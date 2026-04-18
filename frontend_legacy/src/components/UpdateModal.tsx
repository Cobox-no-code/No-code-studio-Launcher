// UpdateModal.tsx
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

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function safePercent(val: unknown): number {
  if (typeof val === "number")
    return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  const p = parseFloat(String(val ?? "0"));
  return isNaN(p) ? 0 : Math.min(100, Math.max(0, p));
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
export default function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: "idle",
    version: null,
    percent: 0,
    error: null,
  });

  const isMounted = useRef(true);
  // FIX 10: single polling interval ref — startPolling() guards against doubles
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // FIX 11+12: track whether we've registered the push listener
  const listenerRegistered = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, []);

  const safeSet = (s: UpdateState) => {
    if (isMounted.current) setUpdateState(s);
  };

  // ── Polling ───────────────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // FIX 10: guard prevents two intervals from ever running simultaneously
  const startPolling = () => {
    if (pollingRef.current) return; // already polling — don't create second interval
    pollingRef.current = setInterval(async () => {
      if (!isMounted.current) {
        stopPolling();
        return;
      }
      if (!window.electronAPI?.getUpdateState) return;
      try {
        const raw = await window.electronAPI.getUpdateState();
        const state = sanitizeState(raw);
        safeSet(state);
        if (
          state.status === "downloaded" ||
          state.status === "error" ||
          state.status === "idle"
        ) {
          stopPolling();
        }
      } catch {
        /* ignore */
      }
    }, 800);
  };

  // ── Push event listener — registered ONCE across the component lifetime ──
  // FIX 11 + 12: We register the listener only once.
  // If ImageFrameAnimationLoader also registers, preload will overwrite its
  // per-channel entry — but UpdateModal is only mounted when the home page
  // is active, by which point the splash loader is unmounted. No conflict.
  useEffect(() => {
    if (!window.electronAPI?.onUpdateEvent || listenerRegistered.current)
      return;
    listenerRegistered.current = true;

    window.electronAPI.onUpdateEvent((channel: string, data: any) => {
      if (channel !== "update-state-changed" || !isMounted.current) return;
      const state = sanitizeState(data);
      safeSet(state);
      if (state.status === "downloaded" || state.status === "error") {
        stopPolling();
      }
    });
  }, []);

  // ── Start/stop polling based on modal visibility ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isOpen]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleCheckForUpdates = async () => {
    safeSet({ status: "checking", version: null, percent: 0, error: null });
    try {
      await window.electronAPI?.checkForUpdates?.();
      startPolling(); // poll to catch result
    } catch {
      safeSet({
        status: "error",
        version: null,
        percent: 0,
        error: "Failed to check for updates",
      });
    }
  };

  const handleDownloadUpdate = async () => {
    // Optimistic — show downloading state immediately
    safeSet({ ...updateState, status: "downloading", percent: 0 });
    // Restart polling to catch progress events that may arrive before state settles
    stopPolling();
    startPolling();
    try {
      await window.electronAPI?.downloadUpdate?.();
    } catch {
      safeSet({
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
      safeSet({
        ...updateState,
        status: "error",
        error: "Failed to install update",
      });
    }
  };

  const handleButtonClick = async () => {
    const { status } = updateState;
    if (status === "downloaded") await handleInstallUpdate();
    else if (status === "available" || status === "error")
      await handleDownloadUpdate();
    else if (status === "idle") await handleCheckForUpdates();
    // "checking" / "downloading" — button is disabled, nothing to do
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const { status, version, error } = updateState;
  const pct = safePercent(updateState.percent);
  const isDisabled = status === "checking" || status === "downloading";

  // ── Button label ─────────────────────────────────────────────────────────
  const buttonLabel = () => {
    if (status === "checking") {
      return (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin inline-block" />
          Checking...
        </span>
      );
    }
    if (status === "downloading") {
      return (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin inline-block" />
          {Math.round(pct)}%
        </span>
      );
    }
    if (status === "downloaded") return "Install & Restart";
    if (status === "error") return "Retry";
    if (status === "available") return "Download Update";
    return "Check for Updates";
  };

  // ── Status body ──────────────────────────────────────────────────────────
  const statusBody = () => {
    if (status === "error")
      return (
        <div className="text-red-400 text-center">
          <div className="font-medium">Update Failed</div>
          <div className="text-sm mt-1">{error ?? "Unexpected error"}</div>
        </div>
      );
    if (status === "checking")
      return (
        <div className="text-white text-center">
          <div className="font-medium">Checking for Updates</div>
          <div className="text-sm text-gray-400 mt-1">Please wait...</div>
        </div>
      );
    if (status === "downloading")
      return (
        <div className="text-white text-center">
          <div className="font-medium">Downloading Update</div>
          <div className="text-sm text-gray-400 mt-1">
            {pct === 0
              ? "Preparing download..."
              : `${Math.round(pct)}% complete`}
          </div>
        </div>
      );
    if (status === "downloaded")
      return (
        <div className="text-white text-center">
          <div className="font-medium">Update Ready</div>
          <div className="text-sm text-gray-400 mt-1">
            Click below to install and restart.
          </div>
        </div>
      );
    if (status === "available")
      return (
        <div className="text-white text-center">
          <div className="font-medium">Update Available</div>
          <div className="text-sm text-gray-400 mt-1">
            Version {version ?? "latest"} is ready to download.
          </div>
        </div>
      );
    return (
      <div className="text-white text-center">
        <div className="font-medium">No Updates Available</div>
        <div className="text-sm text-gray-400 mt-1">
          You&apos;re on the latest version.
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="relative w-[500px] h-[280px]"
        style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))" }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 847 445"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M101 0H808.5L846.5 35.5L738 444.5H25.5L0 404L101 0Z"
            fill="#161616"
            fillOpacity="0.95"
          />
        </svg>

        {/* Close — blocked during download */}
        <button
          onClick={onClose}
          disabled={status === "downloading"}
          className="absolute top-4 right-8 text-white hover:text-gray-300 text-2xl z-20 disabled:opacity-30"
          aria-label="Close"
        >
          ×
        </button>

        <div className="absolute inset-0 flex flex-col justify-between items-center p-6">
          {/* Status */}
          <div className="flex-1 flex items-center justify-center">
            {statusBody()}
          </div>

          {/* Progress bar */}
          {status === "downloading" && (
            <div className="w-full max-w-xs mb-4">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.round(pct)}%` }}
                />
              </div>
              {pct === 0 && (
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="h-full bg-blue-400/50 animate-pulse rounded-full" />
                </div>
              )}
            </div>
          )}

          {/* Button */}
          <div className="mb-4">
            <button
              onClick={handleButtonClick}
              disabled={isDisabled}
              className={`relative w-52 h-14 transform transition-all duration-300 ease-out
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:brightness-110 cursor-pointer"}`}
              style={{
                filter: isDisabled
                  ? "drop-shadow(0 6px 12px rgba(91,27,238,0.2))"
                  : "drop-shadow(0 6px 12px rgba(91,27,238,0.4))",
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
                {buttonLabel()}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
