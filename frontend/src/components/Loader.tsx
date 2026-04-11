"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ImageFrameAnimationLoader() {
  const [currentVideo, setCurrentVideo] = useState<1 | 2 | null>(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(
    null,
  );
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "downloading" | "downloaded" | "error"
  >("idle");
  // FIX: always number, never string
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();
  const videosFinished = useRef(false);

  // ─── UPDATE CHECK ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onUpdateEvent((channel: string, data: any) => {
      switch (channel) {
        case "update-available":
          setUpdateInfo({ version: data?.version || "latest" });
          setShowUpdateModal(true);
          break;

        case "download-progress":
          setUpdateStatus("downloading");
          // FIX: electron-updater sends { percent, bytesPerSecond, total, transferred }
          // percent can arrive as string — force parse to number
          const raw = typeof data === "object" ? data?.percent : data;
          const percent = parseFloat(String(raw ?? 0));
          setDownloadProgress(isNaN(percent) ? 0 : percent);
          break;

        case "update-downloaded":
          setUpdateStatus("downloaded");
          setDownloadProgress(100);
          break;

        case "update-error":
          setUpdateStatus("error");
          setUpdateError(data?.message || "Update failed");
          break;
      }
    });

    window.electronAPI.checkForUpdates?.().catch(() => {});
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const navigateAfterSplash = () => {
    const auth = localStorage.getItem("auth_token");
    router.push(auth ? "/home" : "/login");
  };

  const handleVideoEnd = () => {
    if (currentVideo === 1) {
      setCurrentVideo(null);
      setTimeout(() => setCurrentVideo(2), 1000);
    } else if (currentVideo === 2) {
      videosFinished.current = true;
      // Don't navigate if update modal is open — wait for user action
      if (!showUpdateModal) {
        navigateAfterSplash();
      }
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      setUpdateStatus("downloading");
      setDownloadProgress(0);
      await window.electronAPI?.downloadUpdate?.();
    } catch {
      setUpdateStatus("error");
      setUpdateError("Failed to start download");
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.electronAPI?.installUpdate?.();
    } catch {
      setUpdateStatus("error");
      setUpdateError("Failed to install update");
    }
  };

  // FIX: skip properly closes modal AND always navigates
  const handleSkipUpdate = () => {
    setShowUpdateModal(false);
    navigateAfterSplash();
  };

  // Fallback: navigate if videos never fire onEnded
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!showUpdateModal) navigateAfterSplash();
    }, 8000);
    return () => clearTimeout(timeout);
  }, [showUpdateModal]);

  // If modal closes after videos finished (e.g. install triggered), navigate
  useEffect(() => {
    if (!showUpdateModal && videosFinished.current) {
      navigateAfterSplash();
    }
  }, [showUpdateModal]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ─── VIDEO ──────────────────────────────────────────────────────── */}
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

      {/* ─── UPDATE MODAL ───────────────────────────────────────────────── */}
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
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                {updateStatus === "idle" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Update Available
                    </div>
                    <div className="text-gray-400 text-sm">
                      Version {updateInfo?.version} is ready. Update before
                      logging in.
                    </div>
                  </>
                )}

                {updateStatus === "downloading" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Downloading Update...
                    </div>
                    {/* FIX: Math.round on guaranteed number — no more toFixed crash */}
                    <div className="text-gray-400 text-sm">
                      {Math.round(downloadProgress)}% complete
                    </div>
                    <div className="w-64 bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round(downloadProgress))}%`,
                        }}
                      />
                    </div>
                  </>
                )}

                {updateStatus === "downloaded" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Update Ready!
                    </div>
                    <div className="text-gray-400 text-sm">
                      Click below to install and restart.
                    </div>
                  </>
                )}

                {updateStatus === "error" && (
                  <>
                    <div className="text-red-400 font-bold text-xl">
                      Update Failed
                    </div>
                    <div className="text-gray-400 text-sm">{updateError}</div>
                  </>
                )}
              </div>

              {/* Buttons row */}
              <div className="flex gap-4 mb-2 items-center">
                {/* Spinner during download */}
                {updateStatus === "downloading" && (
                  <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                )}

                {/* Primary button — hidden while downloading */}
                {updateStatus !== "downloading" && (
                  <button
                    onClick={
                      updateStatus === "downloaded"
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
                      {updateStatus === "downloaded"
                        ? "Install & Restart"
                        : "Download Update"}
                    </span>
                  </button>
                )}

                {/* Skip — only when idle or error, not when downloading or ready to install */}
                {(updateStatus === "idle" || updateStatus === "error") && (
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
