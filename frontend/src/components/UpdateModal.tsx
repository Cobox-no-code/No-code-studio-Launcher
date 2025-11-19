// UpdateModal.tsx
import { useEffect, useState } from "react";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  error?: string;
  updateInfo?: any;
}

export default function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  // const [hasCheckedOnce, setHasCheckedOnce] = useState(false); // REMOVED

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    progress: 0,
  });

  useEffect(() => {
    // --- CHANGE: No automatic check on modal open. ---
    // The initial check is now handled by Home.tsx on startup.
    // Manual checks are triggered by handleCheckForUpdates below.
    // ----------------------------------------------------

    // Listen for update events from main process
    const handleUpdateEvent = (event: any, data: any) => {
      console.log("Update event:", event, data);

      switch (event) {
        case "checking-for-update":
          setUpdateStatus((prev) => ({
            ...prev,
            checking: true,
            available: false, // Reset available on new check
            downloaded: false, // Reset downloaded on new check
            error: undefined,
          }));
          break;
        case "update-available":
          setUpdateStatus((prev) => ({
            ...prev,
            checking: false,
            available: true,
            updateInfo: data,
          }));
          break;
        case "update-not-available":
          setUpdateStatus((prev) => ({
            ...prev,
            checking: false,
            available: false,
          }));
          break;
        case "download-progress":
          setUpdateStatus((prev) => ({
            ...prev,
            downloading: true,
            progress: data.percent || 0,
          }));
          break;
        case "update-downloaded":
          setUpdateStatus((prev) => ({
            ...prev,
            downloading: false,
            downloaded: true,
            progress: 100,
          }));
          break;
        case "error":
          setUpdateStatus((prev) => ({
            ...prev,
            checking: false,
            downloading: false,
            error: data.message || "Update failed",
          }));
          break;
      }
    };

    // Note: The listener in Home.tsx will also receive these events.
    if (window.electronAPI?.onUpdateEvent) {
      // Listen for the events while the modal is open
      window.electronAPI.onUpdateEvent(handleUpdateEvent);
    }

    return () => {
      // The listener cleanup is handled in Home.tsx for a global listener.
      // If you are using a separate listener for the modal, keep this:
      // if (window.electronAPI?.removeUpdateListener) {
      //   window.electronAPI.removeUpdateListener();
      // }
    };
  }, []); // Run only once to set up the listener

  const handleCheckForUpdates = async () => {
    try {
      // Reset status before checking
      setUpdateStatus({
        checking: true,
        available: false,
        downloading: false,
        downloaded: false,
        progress: 0,
        error: undefined,
      });

      // Trigger update check in main process
      if (window.electronAPI?.checkForUpdates) {
        // This will trigger "checking-for-update" event, updating the status
        await window.electronAPI.checkForUpdates();
      }
    } catch (error) {
      setUpdateStatus((prev) => ({
        ...prev,
        checking: false,
        error: "Failed to check for updates",
      }));
    }
  };

  const handleInstallUpdate = async () => {
    try {
      if (window.electronAPI?.installUpdate) {
        await window.electronAPI.installUpdate();
      }
    } catch (error) {
      setUpdateStatus((prev) => ({
        ...prev,
        error: "Failed to install update",
      }));
    }
  };

  const getButtonContent = () => {
    if (updateStatus.checking) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
          <span>Checking...</span>
        </div>
      );
    }

    if (updateStatus.downloading) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
          <span>Downloading... {Math.round(updateStatus.progress)}%</span>
        </div>
      );
    }

    if (updateStatus.downloaded) {
      return "Install & Restart";
    }

    if (updateStatus.available) {
      return "Download Update";
    }

    // Default button for manual check
    return "Check for Updates";
  };

  const getStatusMessage = () => {
    if (updateStatus.error) {
      return (
        <div className="text-red-400 text-center">
          <div className="font-medium">Error</div>
          <div className="text-sm mt-1">{updateStatus.error}</div>
        </div>
      );
    }

    if (updateStatus.checking) {
      return (
        <div className="text-white text-center">
          <div className="font-medium">Checking for Updates</div>
          <div className="text-sm text-gray-400 mt-1">Please wait...</div>
        </div>
      );
    }

    if (updateStatus.downloading) {
      return (
        <div className="text-white text-center">
          <div className="font-medium">Downloading Update</div>
          <div className="text-sm text-gray-400 mt-1">
            {Math.round(updateStatus.progress)}% complete
          </div>
        </div>
      );
    }

    if (updateStatus.downloaded) {
      return (
        <div className="text-white text-center">
          <div className="font-medium">Update Ready</div>
          <div className="text-sm text-gray-400 mt-1">
            Click to install and restart the application
          </div>
        </div>
      );
    }

    if (updateStatus.available) {
      return (
        <div className="text-white text-center">
          <div className="font-medium">Update Available</div>
          <div className="text-sm text-gray-400 mt-1">
            Version {updateStatus.updateInfo?.version || "Unknown"} is ready to
            download
          </div>
        </div>
      );
    }

    if (!updateStatus.checking && !updateStatus.available) {
      return (
        <div className="text-white text-center">
          <div className="font-medium">No Updates Available</div>
          <div className="text-sm text-gray-400 mt-1">
            You&apos;re running the latest version
          </div>
        </div>
      );
    }

    return (
      <div className="text-white text-center">
        <div className="font-medium">Update Manager</div>
        <div className="text-sm text-gray-400 mt-1">
          Check for the latest version of the application
        </div>
      </div>
    );
  };

  const handleButtonClick = () => {
    if (updateStatus.downloaded) {
      handleInstallUpdate();
    } else if (updateStatus.available) {
      // If update is available, download starts automatically by electron-updater
      // (as setup in main.ts/electron-updater config), so no action needed here.
      return;
    } else {
      // Manual check
      handleCheckForUpdates();
    }
  };

  const isButtonDisabled = updateStatus.checking || updateStatus.downloading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="relative w-[500px] h-[280px] transition-all duration-700 ease-out opacity-100 scale-100 translate-y-0"
        style={{
          filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))",
        }}
      >
        {/* Custom SVG Shape */}
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

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-8 text-white hover:text-gray-300 text-2xl z-20"
          disabled={updateStatus.downloading}
        >
          ×
        </button>

        {/* Content inside the custom shape */}
        <div className="absolute inset-0 flex flex-col justify-between items-center p-6">
          {/* Status message */}
          <div className="flex-1 flex items-center justify-center">
            {getStatusMessage()}
          </div>

          {/* Progress bar for download */}
          {updateStatus.downloading && (
            <div className="w-full max-w-xs mb-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${updateStatus.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mb-4">
            <button
              onClick={handleButtonClick}
              disabled={isButtonDisabled}
              className={`
                relative w-52 h-14 transform transition-all duration-300 ease-out
                ${
                  isButtonDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105 hover:brightness-110 cursor-pointer"
                }
              `}
              style={{
                filter: isButtonDisabled
                  ? "drop-shadow(0 6px 12px rgba(91, 27, 238, 0.2))"
                  : "drop-shadow(0 6px 12px rgba(91, 27, 238, 0.4))",
              }}
            >
              {/* Button SVG Shape */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 202 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.3691 6.8L13.0043 0H198.439C200.3 0 201.711 1.67568 201.396 3.50904L194.631 42.8L189.646 49.2L3.5703 49.9849C1.70674 49.9928 0.286994 48.3176 0.600358 46.4805L7.3691 6.8Z"
                  fill="#5B1BEE"
                  className="transition-all duration-300 hover:brightness-110"
                />
              </svg>

              {/* Button Text */}
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg z-10">
                {getButtonContent()}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
