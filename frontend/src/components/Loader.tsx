"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

interface UpdateState {
  status: UpdateStatus;
  version: string | null;
  percent: number;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// safePercent — NEVER call .toFixed() on raw data from electron-updater.
// percent can be: number, stringified number, undefined, null, or a whole object.
// ─────────────────────────────────────────────────────────────────────────────
function safePercent(val: unknown): number {
  if (typeof val === "number") {
    return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  }
  const parsed = parseFloat(String(val ?? "0"));
  return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
}

function sanitizeState(raw: any): UpdateState {
  return {
    status: raw?.status ?? "idle",
    version: raw?.version ?? null,
    percent: safePercent(raw?.percent),
    error: raw?.error ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ImageFrameAnimationLoader() {
  const [currentVideo, setCurrentVideo] = useState<1 | 2 | null>(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: "idle",
    version: null,
    percent: 0,
    error: null,
  });

  const router = useRouter();

  // ── Refs (not state — no re-renders) ────────────────────────────────────
  const isMounted = useRef(true); // FIX 8: guard all setState calls
  const hasNavigated = useRef(false); // prevent double navigation
  const videosFinished = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // FIX 9: one stable fallback timer — registered once, never re-registered
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopPolling();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  // ── Safe state setter — never fires on unmounted component ───────────────
  const safeSetUpdateState = (s: UpdateState) => {
    if (isMounted.current) setUpdateState(s);
  };
  const safeSetShowModal = (v: boolean) => {
    if (isMounted.current) setShowUpdateModal(v);
  };

  // ── Navigation — idempotent ───────────────────────────────────────────────
  const navigateAfterSplash = () => {
    if (hasNavigated.current || !isMounted.current) return;
    hasNavigated.current = true;
    stopPolling();
    const auth =
      typeof window !== "undefined" && localStorage.getItem("auth_token");
    router.push(auth ? "/home" : "/login");
  };

  // ── Polling ───────────────────────────────────────────────────────────────
  // Asks main process directly every 800ms.
  // This is the FALLBACK that works even when push events fire before React mounts.
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = () => {
    // FIX 10 (also applies here): never start a second interval
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      if (!isMounted.current) {
        stopPolling();
        return;
      }
      if (!window.electronAPI?.getUpdateState) return;

      try {
        const raw = await window.electronAPI.getUpdateState();
        const state = sanitizeState(raw);

        safeSetUpdateState(state);

        if (
          state.status === "available" ||
          state.status === "downloading" ||
          state.status === "downloaded"
        ) {
          safeSetShowModal(true);
        }

        // Terminal states — stop polling
        if (
          state.status === "downloaded" ||
          state.status === "error" ||
          state.status === "idle"
        ) {
          stopPolling();
        }
      } catch {
        // Ignore poll errors — main may not be ready yet
      }
    }, 800);
  };

  // ── Update event setup (push + polling, registered ONCE) ────────────────
  useEffect(() => {
    if (!window.electronAPI) return;

    // FIX 11 + 12: Use a dedicated per-component listener via onUpdateEvent.
    // We pass a stable callback — preload de-dupes per-channel per registration.
    const handlePushEvent = (channel: string, data: any) => {
      if (channel !== "update-state-changed" || !isMounted.current) return;
      const state = sanitizeState(data);
      safeSetUpdateState(state);

      if (
        state.status === "available" ||
        state.status === "downloading" ||
        state.status === "downloaded"
      ) {
        safeSetShowModal(true);
      }

      // Push told us the final state — stop polling
      if (state.status === "downloaded" || state.status === "error") {
        stopPolling();
      }
    };

    window.electronAPI.onUpdateEvent(handlePushEvent);

    // Start polling immediately — catches state that fired before mount
    startPolling();

    // Trigger the update check (errors are swallowed — UI handles state)
    window.electronAPI.checkForUpdates?.().catch(() => {});

    // FIX 9: Fallback navigation — registered ONCE here, never in a
    // dependency-driven useEffect that resets the timer on state changes.
    fallbackTimerRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      if (!showUpdateModal) navigateAfterSplash();
    }, 9000);

    return () => {
      stopPolling();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount

  // Navigate after modal closes IF videos are done
  // (separate from the fallback timer — this handles the "install" path)
  useEffect(() => {
    if (!showUpdateModal && videosFinished.current) {
      navigateAfterSplash();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUpdateModal]);

  // ── Video handlers ────────────────────────────────────────────────────────
  const handleVideoEnd = () => {
    if (currentVideo === 1) {
      if (isMounted.current) setCurrentVideo(null);
      setTimeout(() => {
        if (isMounted.current) setCurrentVideo(2);
      }, 1000);
    } else if (currentVideo === 2) {
      videosFinished.current = true;
      if (!showUpdateModal) navigateAfterSplash();
    }
  };

  // ── Update action handlers ─────────────────────────────────────────────────
  const handleDownloadUpdate = async () => {
    if (!isMounted.current) return;
    // Optimistic UI — show downloading state immediately
    safeSetUpdateState({ ...updateState, status: "downloading", percent: 0 });
    // Restart polling to catch progress immediately
    stopPolling();
    startPolling();
    try {
      await window.electronAPI?.downloadUpdate?.();
    } catch {
      safeSetUpdateState({
        status: "error",
        version: updateState.version,
        percent: 0,
        error: "Failed to start download",
      });
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.electronAPI?.installUpdate?.();
    } catch {
      safeSetUpdateState({
        ...updateState,
        status: "error",
        error: "Failed to install update",
      });
    }
  };

  const handleSkipUpdate = () => {
    stopPolling();
    safeSetShowModal(false);
    navigateAfterSplash();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const pct = safePercent(updateState.percent);
  const { status, version, error } = updateState;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ── VIDEO ──────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
        {currentVideo === 1 && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            onEnded={handleVideoEnd}
          >
            <source src="./unreal engine intro.mp4" type="video/mp4" />
          </video>
        )}
        {currentVideo === 2 && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            onEnded={handleVideoEnd}
          >
            <source src="./cobox.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* ── UPDATE MODAL ────────────────────────────────────────────────────── */}
      {showUpdateModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70">
          <div
            className="relative w-[500px] h-[300px]"
            style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.6))" }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 847 445"
              fill="none"
            >
              <path
                d="M101 0H808.5L846.5 35.5L738 444.5H25.5L0 404L101 0Z"
                fill="#161616"
                fillOpacity="0.97"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-between p-8">
              {/* Status */}
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                {(status === "idle" || status === "available") && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Update Available
                    </div>
                    <div className="text-gray-400 text-sm">
                      Version {version ?? "latest"} is ready to download.
                    </div>
                  </>
                )}
                {status === "downloading" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Downloading Update...
                    </div>
                    <div className="text-gray-400 text-sm">
                      {pct === 0
                        ? "Preparing download..."
                        : `${Math.round(pct)}% complete`}
                    </div>
                    <div className="w-64 bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.round(pct)}%` }}
                      />
                    </div>
                  </>
                )}
                {status === "downloaded" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Update Ready!
                    </div>
                    <div className="text-gray-400 text-sm">
                      Click below to install and restart.
                    </div>
                  </>
                )}
                {status === "error" && (
                  <>
                    <div className="text-red-400 font-bold text-xl">
                      Update Failed
                    </div>
                    <div className="text-gray-400 text-sm">
                      {error ?? "An unexpected error occurred."}
                    </div>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mb-2 items-center">
                {status === "downloading" && (
                  <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                )}

                {status !== "downloading" && (
                  <button
                    onClick={
                      status === "downloaded"
                        ? handleInstallUpdate
                        : handleDownloadUpdate
                    }
                    className="relative w-48 h-12 cursor-pointer hover:scale-105 transition-all duration-300"
                    style={{
                      filter: "drop-shadow(0 6px 12px rgba(91,27,238,0.4))",
                    }}
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 202 50"
                      fill="none"
                    >
                      <path
                        d="M7.3691 6.8L13.0043 0H198.439C200.3 0 201.711 1.67568 201.396 3.50904L194.631 42.8L189.646 49.2L3.5703 49.9849C1.70674 49.9928 0.286994 48.3176 0.600358 46.4805L7.3691 6.8Z"
                        fill="#5B1BEE"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-base z-10">
                      {status === "downloaded"
                        ? "Install & Restart"
                        : "Download Update"}
                    </span>
                  </button>
                )}

                {status !== "downloading" && status !== "downloaded" && (
                  <button
                    onClick={handleSkipUpdate}
                    className="text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
