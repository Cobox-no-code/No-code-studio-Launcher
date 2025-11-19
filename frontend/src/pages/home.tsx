// Home.tsx
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
import { Gamepad2Icon } from "lucide-react"; // Import DownloadCloudIcon for the button
import { useEffect, useRef, useState } from "react";

const GAME_KEY = "gamePath";

// ... (Keep your interfaces and declare global) ...
interface GameStatus {
  installed: boolean;
  path?: string;
}
interface ElectronAPI {
  chooseInstallPath: () => Promise<string | null>;
  downloadGame: (params: { url: string; targetDir: string }) => Promise<string>;
  launchGame: (exePath: string) => Promise<{ success: boolean }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  checkGameInstallation: (
    gamePath: string
  ) => Promise<{ installed: boolean; path?: string }>;
  getDefaultInstallPath: () => Promise<string>;
  onDownloadProgress: (callback: (progress: number) => void) => void;
  checkForUpdates: () => Promise<any>;
  installUpdate: () => Promise<void>;
  onUpdateEvent: (callback: (event: string, data: any) => void) => void;
  removeUpdateListener: () => void;
  updateWorker: (data: {
    path: string;
    updates: Record<string, any>;
  }) => Promise<any>;
  createSecret: (data: Record<string, any>) => Promise<any>;
  updateSecret: (data: Record<string, any>) => Promise<any>;
  _updateListeners: Map<string, (event: any, ...args: any[]) => void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export default function Home() {
  const didCheckUpdate = useRef(false);

  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [gameModal, setGameModal] = useState(false);
  const [DOWNLOAD_URL, setDownloadUrl] = useState(
    "https://cobox-launcher.s3.amazonaws.com/game/builds/game-latest.zip"
  );
  const { isDownloading, downloadProgress, startDownload, finishDownload } =
    useDownload();

  const [mode, setMode] = useState<"play" | "create">("create");
  const [activeGameTabs, setActiveGameTabs] = useState(false);
  const [gamePath, setGamePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    installed: false,
  });

  // State to control modal visibility - opens for update available or manual check
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleOpenUpdateModal = () => {
    setShowUpdateModal(true);
  };

  const checkForUpdate = async () => {
    if (didCheckUpdate.current) return;
    didCheckUpdate.current = true;

    try {
      // Trigger the check in the main process.
      // The main process will fire an event if an update is available.
      await window.electronAPI.checkForUpdates();
    } catch (error) {
      console.error("Initial update check failed:", error);
    }
  };

  useEffect(() => {
    const gameData = localStorage.getItem("gameData");
    const parsedGame = JSON.parse(gameData);

    if (parsedGame && parsedGame?.link) {
      setDownloadUrl(parsedGame?.link);
    }
    if (!window.electronAPI) return;
    checkGameInstallation();
    checkForUpdate();

    // --- NEW: Update Event Listener in Home.tsx ---
    const handleUpdateEvent = (event: string, data: any) => {
      console.log("Global Update event received:", event, data);

      // Auto-open the modal ONLY if an update is available
      if (event === "update-available") {
        setShowUpdateModal(true);
      }
    };

    if (window.electronAPI?.onUpdateEvent) {
      window.electronAPI.onUpdateEvent(handleUpdateEvent);
    }

    return () => {
      if (window.electronAPI?.removeUpdateListener) {
        // Note: You must ensure this cleans up correctly in preload.js
        window.electronAPI.removeUpdateListener();
      }
    };
    // ---------------------------------------------
  }, []);

  useEffect(() => {
    if (gamePath && gameStatus.installed) {
      const dir = gamePath;
      window.electronAPI.updateWorker({
        path: dir,
        updates: { mode },
      });
    }
  }, [mode]);

  const checkGameInstallation = async () => {
    try {
      const storedPath = localStorage.getItem(GAME_KEY);
      if (storedPath) {
        const status = await window.electronAPI.checkGameInstallation(
          storedPath
        );
        setGameStatus(status);
        if (status.installed) {
          setGamePath(storedPath);
        } else {
          localStorage.removeItem(GAME_KEY);
        }
      }
    } catch (error) {
      console.error("Error checking game installation:", error);
      setError("Failed to check game installation");
    }
  };

  const handleDownloadOrPlay = async () => {
    if (gamePath && gameStatus.installed) {
      return;
    }

    startDownload();
    setError(null);

    try {
      let installPath = await window.electronAPI.chooseInstallPath();

      if (!installPath) {
        setError("You must choose an installation folder.");
        finishDownload();
        return;
      }

      const exePath = await window.electronAPI.downloadGame({
        url: DOWNLOAD_URL,
        targetDir: installPath,
      });

      localStorage.setItem(GAME_KEY, exePath);
      setGamePath(exePath);
      setGameStatus({ installed: true, path: exePath });
    } catch (error) {
      console.error("Download/install error:", error);
      setError("Failed to download or install game. Please try again.");
      localStorage.removeItem(GAME_KEY);
    }
  };

  const handleGameTabsToggle = () => {
    if (isDownloading) return;
    if (gamePath && gameStatus.installed) {
      setActiveGameTabs(!activeGameTabs);
    } else {
      handleDownloadOrPlay();
    }
  };

  const launchWithSecret = async (
    type: "creategame" | "createenv" | "playgame"
  ) => {
    if (!gamePath) return;
    try {
      await window.electronAPI.updateWorker({
        path: gamePath,
        updates: { mode, type },
      });

      setTimeout(async () => {
        await window.electronAPI.launchGame(gamePath);
      }, 2000);
    } catch (error) {
      console.error("Failed to launch with worker.json:", error);
      setError("Failed to launch game");
    }
  };

  const createGame = () => launchWithSecret("creategame");
  const createEnvironment = () => launchWithSecret("createenv");
  const playGame = () => launchWithSecret("playgame");

  return (
    <div className="w-full h-full  overflow-hidden">
      <img className=" absolute inset-0 z-50 " src="./home.png" alt="" />
      <GamesModal active={gameModal} setActive={setGameModal} />
      {mode === "play" && (
        <button
          onClick={() => setGameModal(true)}
          className="flex   gap-2 z-60 absolute top-[2rem] left-8  translate-x-0 p-2 rounded-lg cursor-pointer items-center justify-between bg-white text-sm font-medium text-black hover:bg-gray-100 shadow-md "
        >
          {" "}
          <Gamepad2Icon /> Explore
        </button>
      )}

      {/* NEW: Manual Update Check Button */}

      <CreateButtonsPlaceholder
        mode={mode}
        playGame={playGame}
        isDarkMode={isDarkMode}
        setActiveGameTabs={handleGameTabsToggle}
        activeGameTabs={activeGameTabs}
      />
      {isDownloading && (
        <div className="absolute bottom-[1vh] left-1/2 -translate-x-1/2 w-80 flex flex-col items-center gap-2 z-50">
          {/* Progress bar container */}
          <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Smooth animated bar */}
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out animate-pulse"
              style={{
                width: `${downloadProgress}%`,
                background: !isDarkMode ? "#000000" : "#4D349C",
              }}
            ></div>
          </div>

          {/* Animated text showing progress percentage */}
          <div className="text-xs font-medium text-center text-gray-800 dark:text-gray-200 animate-fade-in">
            {downloadProgress < 100
              ? `Downloading... ${downloadProgress.toFixed(1)}%`
              : "Finalizing installation..."}
          </div>
        </div>
      )}
      {activeGameTabs && (
        <>
          <CreateButtons
            mode={mode}
            isDarkMode={isDarkMode}
            createGame={createGame}
            createEnvironment={createEnvironment}
          />
        </>
      )}

      {/* Dark/Light Mode Toggle */}
      <ToggleDarkMode isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Play/Create Mode Toggle */}
      <ToggleMode isDarkMode={isDarkMode} mode={mode} setMode={setMode} />

      {/* Auto-triggered or manually-triggered modal */}
      {showUpdateModal && (
        <UpdateModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
}
