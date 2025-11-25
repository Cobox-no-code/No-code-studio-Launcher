"use client";
import GamesModal from "@/components/GamesModal";
import UpdateModal from "@/components/UpdateModal";
import { useDarkMode } from "@/context/DarkModeContext";
import { useDownload } from "@/context/ProgressContext";
import {
  CreateButtons,
  CreateButtonsPlaceholder,
  ToggleDarkMode,
  ToggleMode,
} from "@/utils/icons";
import { Gamepad2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ServerVersionData {
  version: string;
  link: string; // The download URL
}

interface GameStatus {
  installed: boolean;
  path?: string;
  version?: string;
}

interface ElectronAPI {
  getServerVersion: () => Promise<ServerVersionData | null>;
  chooseInstallPath: () => Promise<string | null>;
  downloadGame: (params: { url: string; targetDir: string }) => Promise<string>;
  launchGame: () => Promise<{ success: boolean; error?: string }>;
  getGameInstallationStatus: () => Promise<GameStatus>;
  updateWorker: (data: {
    path: string;
    updates: Record<string, any>;
  }) => Promise<{ success: boolean }>;
  createSecret: (data: Record<string, any>) => Promise<{ success: boolean }>;
  updateSecret: (data: Record<string, any>) => Promise<{ success: boolean }>;
  // Utils
  openExternal: (url: string) => Promise<{ success: boolean }>;
  onDownloadProgress: (callback: (progress: number) => void) => void;

  // Updater
  checkForUpdates: () => Promise<any>;
  installUpdate: () => Promise<void>;
  onUpdateEvent: (callback: (channel: string, data: any) => void) => void;
  removeUpdateListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
export default function Home() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [gameModal, setGameModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const { isDownloading, downloadProgress, startDownload, finishDownload } =
    useDownload();

  const [mode, setMode] = useState<"play" | "create">("create");
  const [activeGameTabs, setActiveGameTabs] = useState(false);
  const [gameInstalled, setGameInstalled] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const didCheckUpdate = useRef(false);

  // 1. INITIAL LOAD
  useEffect(() => {
    if (!window.electronAPI) return;

    const init = async () => {
      try {
        // A. Get Local Status (Path + Version)
        const localStatus =
          await window.electronAPI.getGameInstallationStatus();

        // B. Get Server Version
        const serverData = await window.electronAPI.getServerVersion();

        // C. LOGIC: Compare Versions
        let isLatestVersion = true;

        if (
          localStatus.installed &&
          localStatus.version &&
          serverData?.version
        ) {
          // If server version is different from local version
          if (serverData.version !== localStatus.version) {
            console.log(
              `Update available! Local: ${localStatus.version}, Server: ${serverData.version}`
            );
            isLatestVersion = false;

            // ⚠️ OPTION: Automatically invalidate the old build
            // This forces the UI to show "Download" (which acts as Update)
            await window.electronAPI.updateWorker({
              path: "",
              updates: { gamePath: null }, // Clear path so it looks uninstalled
            });

            setStatusMessage("Update Available");
            setGameInstalled(false); // Reset UI to uninstalled state
          }
        }

        // D. Set State based on result
        if (localStatus.installed && isLatestVersion) {
          setGameInstalled(true);
          setActiveGameTabs(false);
        } else if (!isLatestVersion && localStatus.installed) {
          // It was installed, but we just invalidated it above.
          setGameInstalled(false);
        }

        // E. Check for Launcher Updates (AutoUpdater)
        if (!didCheckUpdate.current) {
          didCheckUpdate.current = true;
          const update = await window.electronAPI.checkForUpdates();
          if (update?.success && update.updateInfo?.version) {
            setShowUpdateModal(true);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    init();
  }, []);

  // 2. MAIN ACTION LOGIC (FIXED)
  const handleDownloadOrPlay = async () => {
    // A. IF INSTALLED
    if (gameInstalled) {
      if (mode === "create") {
        // ✅ FIX: In Create Mode, just toggle the tabs. DO NOT LAUNCH.
        console.log("Create mode: Toggling tabs");
        setActiveGameTabs(!activeGameTabs);
      } else {
        // ✅ FIX: In Play Mode, launch immediately.
        console.log("Play mode: Launching default");
        await launchWithSecret("play", "playgame");
      }
      return;
    }

    // B. IF NOT INSTALLED -> START DOWNLOAD SEQUENCE
    try {
      if (isDownloading) return;

      setStatusMessage("Checking installation...");
      startDownload();

      const serverData = await window.electronAPI.getServerVersion();
      const downloadLink = serverData?.link || "https://default-bucket-url.zip";
      const version = serverData?.version || "1.0.0";

      await window.electronAPI.updateWorker({
        path: "",
        updates: {
          mode: mode,
          type: "creategame",
          version: version,
          gameDownloadLink: downloadLink,
        },
      });

      const installPath = await window.electronAPI.chooseInstallPath();
      if (!installPath) {
        setStatusMessage("");
        finishDownload();
        return;
      }

      setStatusMessage("Downloading...");

      await window.electronAPI.downloadGame({
        url: downloadLink,
        targetDir: installPath,
      });

      setStatusMessage("");
      setGameInstalled(true);

      // After download success:
      if (mode === "create") {
        setActiveGameTabs(true); // Show tabs so they can create
      } else {
      }

      finishDownload();
    } catch (error: any) {
      console.error("Flow failed:", error);
      setStatusMessage("Error");
      alert("Setup failed: " + error.message);
      finishDownload();
    }
  };

  const launchWithSecret = async (currentMode: string, type: string) => {
    if (!gameInstalled) {
      alert("Game not installed yet.");
      return;
    }
    try {
      await window.electronAPI.updateWorker({
        path: "",
        updates: { mode: currentMode, type },
      });

      const result = await window.electronAPI.launchGame();

      if (!result.success) {
        console.error("Launch failed:", result.error);
        if (result.error?.includes("not found")) {
          setGameInstalled(false);
          setActiveGameTabs(false);
          alert("Game files missing. Please download again.");
        }
      }
    } catch (error) {
      console.error("Launch error:", error);
    }
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <img className="absolute inset-0 z-50" src="./home.png" alt="" />

      <GamesModal active={gameModal} setActive={setGameModal} />

      {mode === "play" && (
        <button
          onClick={() => setGameModal(true)}
          className="flex gap-2 z-60 absolute top-[2rem] left-8 p-2 rounded-lg bg-white text-sm font-medium text-black shadow-md hover:bg-gray-100 transition"
        >
          <Gamepad2Icon /> Explore
        </button>
      )}

      {/* MAIN BUTTON */}
      <div className="absolute left-[49.8%] bottom-0 -translate-x-1/2  z-50">
        <CreateButtonsPlaceholder
          mode={mode}
          playGame={() => launchWithSecret(mode, "playgame")}
          isDarkMode={isDarkMode}
          setActiveGameTabs={handleDownloadOrPlay}
          // ✅ FIX: Only highlight if tabs are actually open OR if downloading/installed logic dictates
          activeGameTabs={activeGameTabs}
        />
      </div>

      {/* DOWNLOAD PROGRESS */}
      {isDownloading && (
        <div className="absolute bottom-[1vh] left-1/2 -translate-x-1/2 w-80 flex flex-col items-center gap-2 z-[70]">
          <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <div
              className="h-full bg-[#8267D2] transition-all duration-300 ease-out"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <div className="text-xs  text-white bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm animate-pulse">
            {statusMessage} {downloadProgress.toFixed(0)}%
          </div>
        </div>
      )}

      {/* SUB-BUTTONS (Tabs) */}
      {/* ✅ FIX: Only show if activeGameTabs is TRUE (toggled by user) and not downloading */}
      {activeGameTabs && !isDownloading && (
        <CreateButtons
          mode={mode}
          isDarkMode={isDarkMode}
          createGame={() => launchWithSecret(mode, "creategame")}
          createEnvironment={() => launchWithSecret(mode, "createenv")}
        />
      )}

      <ToggleDarkMode isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <ToggleMode
        isDarkMode={isDarkMode}
        mode={mode}
        setMode={(newMode) => {
          setMode(newMode);
          // Optional: Close tabs when switching modes to reset UI state
          setActiveGameTabs(false);
        }}
      />

      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </div>
  );
}
