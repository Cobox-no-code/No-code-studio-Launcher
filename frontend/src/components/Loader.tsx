"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ImageFrameAnimationLoader() {
  const [currentVideo, setCurrentVideo] = useState<1 | 2 | null>(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(
    null,
  );
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "downloading" | "downloaded" | "error"
  >("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const router = useRouter();

  // ─── EMERGENCY UPDATE CHECK ───────────────────────────────────────────────
  // This runs BEFORE login, BEFORE any API call.
  // Old users with broken login will still reach this screen and get the update.
  useEffect(() => {
    if (!window.electronAPI) return;

    // Listen for update events from main process
    window.electronAPI.onUpdateEvent((channel: string, data: any) => {
      switch (channel) {
        case "update-available":
          setUpdateInfo({ version: data?.version || "latest" });
          setShowUpdateModal(true);
          break;
        case "download-progress":
          setUpdateStatus("downloading");
          setDownloadProgress(data?.percent || 0);
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

    // Trigger the check immediately on splash screen
    window.electronAPI.checkForUpdates().catch(() => {
      // silently ignore — don't block splash if update check fails
    });
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const handleVideoEnd = () => {
    const auth = localStorage.getItem("auth_token");
    if (currentVideo === 1) {
      setCurrentVideo(null);
      setTimeout(() => setCurrentVideo(2), 1000);
    } else if (currentVideo === 2) {
      // If update modal is open, don't navigate — let user handle update first
      if (showUpdateModal) return;
      if (auth) {
        router.push("/home");
      } else {
        router.push("/login");
      }
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      setUpdateStatus("downloading");
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

  const handleSkipUpdate = () => {
    // Allow user to skip and continue to login even on old version
    setShowUpdateModal(false);
    const auth = localStorage.getItem("auth_token");
    if (auth) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  };

  // Fallback timeout in case videos don't load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!showUpdateModal) router.push("/login");
    }, 8000);
    return () => clearTimeout(timeout);
  }, [router, showUpdateModal]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ─── VIDEO SPLASH ─────────────────────────────────────────────────── */}
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

      {/* ─── EMERGENCY UPDATE MODAL ───────────────────────────────────────── */}
      {/* Sits above everything, including the video. z-[100] beats z-50. */}
      {showUpdateModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70">
          <div
            className="relative w-[500px] h-[300px]"
            style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.6))" }}
          >
            {/* Modal background shape */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 847 445"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M101 0H808.5L846.5 35.5L738 444.5H25.5L0 404L101 0Z"
                fill="#161616"
                fillOpacity="0.97"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-between p-8">
              {/* Status text */}
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                {updateStatus === "idle" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Update Available
                    </div>
                    <div className="text-gray-400 text-sm">
                      Version {updateInfo?.version} is ready. Please update
                      before logging in.
                    </div>
                  </>
                )}
                {updateStatus === "downloading" && (
                  <>
                    <div className="text-white font-bold text-xl">
                      Downloading Update...
                    </div>
                    <div className="text-gray-400 text-sm">
                      {Math.round(downloadProgress)}% complete
                    </div>
                    <div className="w-64 bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
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

              {/* Buttons */}
              <div className="flex gap-4 mb-2">
                {/* Primary action button */}
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

                {/* Skip button — always visible so user is never fully blocked */}
                {updateStatus !== "downloading" &&
                  updateStatus !== "downloaded" && (
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
