"use client";
import GamesModal from "@/components/GamesModal";
import PublishModal from "@/components/PublishModal";
import UpdateModal from "@/components/UpdateModal";
import { useDarkMode } from "@/context/DarkModeContext";
import { useDownload } from "@/context/ProgressContext";
import {
  CreateButtons,
  CreateButtonsPlaceholder,
  ToggleDarkMode,
  ToggleMode,
} from "@/utils/icons";
import { Folder, Gamepad2Icon } from "lucide-react";
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
export interface PublishGamePayload {
  filePath: string; // The absolute system path (e.g., /Users/sarthak/Downloads/game.sav)
  thumbnailBase64: string; // The base64 string from the preview state
  metadata: {
    id: string | number;
    userId: string | number;
    title: string;
    authorName: string;
    description: string;
    token?: string; // JWT for API authentication
  };
}

// The response received from the Electron Main process
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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
  publishGameFull: (payload: PublishGamePayload) => Promise<IpcResponse>;

  downloadLiveGame: (params: {
    url: string;
    gameId: string;
    title: string;
  }) => Promise<{ success: boolean; path: string; error?: string }>;

  deleteLiveGame: (
    gameId: any,
  ) => Promise<{ success: boolean; error?: string }>;

  /** Checks local /live_games folder for an array of IDs */
  checkDownloadStatus: (gameIds: string[]) => Promise<
    Record<
      string,
      {
        downloaded: boolean;
        path: string | null;
      }
    >
  >;
  getLocalLibraryGames: () => Promise<
    Array<{
      id: string;
      name: string;
      path: string;
      createdAt: Date;
      modifiedAt: Date;
    }>
  >;
  downloadUpdate: () => Promise<{ success: boolean; message?: string }>;
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
  const [publishModal, setPublishModal] = useState(false);
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
              `Update available! Local: ${localStatus.version}, Server: ${serverData.version}`,
            );
            isLatestVersion = false;

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
  // 2. MAIN ACTION LOGIC (FIXED WITH DELAY)
  const handleDownloadOrPlay = async () => {
    // A. IF INSTALLED
    if (gameInstalled) {
      if (mode === "create") {
        console.log("Create mode: Toggling tabs");
        setActiveGameTabs(!activeGameTabs);
      } else {
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

      // Save metadata first
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

      // 1️⃣ PERFORM DOWNLOAD
      await window.electronAPI.downloadGame({
        url: downloadLink,
        targetDir: installPath,
      });

      // 2️⃣ ADD "FINALIZING" STATE (The Fix)
      setStatusMessage("Finalizing installation...");

      // Force a 5-second wait while showing 100% progress
      // This ensures main.ts has fully written worker.json
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // 3️⃣ VERIFY INSTALLATION (Double Check)
      // Before we unlock the UI, let's ask Electron "Are you ACTUALLY ready?"
      const checkStatus = await window.electronAPI.getGameInstallationStatus();

      if (checkStatus.installed && checkStatus.path) {
        setStatusMessage("Ready!");
        setGameInstalled(true);

        if (mode === "create") {
          setActiveGameTabs(true);
        }
      } else {
        // If we waited 5 seconds and it's still not ready, something failed.
        throw new Error("Installation verification failed. Please try again.");
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
      <PublishModal active={publishModal} setActive={setPublishModal} />

      {mode === "play" && gameInstalled ? (
        <button
          onClick={() => setGameModal(true)}
          className="flex gap-2 z-60 absolute top-[2rem] left-8 p-2 rounded-lg items-center justify-center bg-white text-sm font-medium text-black shadow-md hover:bg-gray-100 transition"
        >
          <Gamepad2Icon /> Discover Games
        </button>
      ) : (
        <button
          onClick={() => setPublishModal(true)}
          className="flex gap-2 z-60 absolute top-[2rem] left-8 p-3 items-center justify-center rounded-lg bg-white text-sm font-medium text-black shadow-md hover:bg-gray-100 transition"
        >
          <Folder /> My Games
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
