import GamesModal from "@/components/GamesModal";
import UpdateModal from "@/components/UpdateModal";
import { useDarkMode } from "@/context/DarkModeContext";
import { useDownload } from "@/context/ProgressContext"; // ✅ 1. Import the custom hook
import {
  CreateButtons,
  CreateButtonsPlaceholder,
  ToggleDarkMode,
  ToggleMode,
} from "@/utils/icons";
import { Gamepad2Icon } from "lucide-react";
import { useEffect, useState } from "react";

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
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [gameModal, setGameModal] = useState(false);
  const [DOWNLOAD_URL, setDownloadUrl] = useState(
    "https://cobox-launcher.s3.amazonaws.com/game/builds/game-latest.zip"
  );
  // ✅ 2. Use the global download state
  const { isDownloading, downloadProgress, startDownload, finishDownload } =
    useDownload();

  const [mode, setMode] = useState<"play" | "create">("create");
  const [activeGameTabs, setActiveGameTabs] = useState(false);
  const [gamePath, setGamePath] = useState<string | null>(null);
  // ❌ 3. Remove the local state for downloading
  // const [isDownloading, setIsDownloading] = useState(false);
  // const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    installed: false,
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ Only runs in browser

    const updateFromLocalStorage = () => {
      const gameDataStr = window.localStorage.getItem("gameData");
      const gamePathStr = window.localStorage.getItem("gamePath");

      if (gameDataStr) {
        try {
          const parsedGame = JSON.parse(gameDataStr);
          if (parsedGame?.link) {
            setDownloadUrl(parsedGame.link);
          }
        } catch (err) {
          console.error("Invalid gameData in localStorage:", err);
        }
      }

      if (window.electronAPI) {
        checkGameInstallation();
        checkForUpdate();
      }
    };

    // 🔹 Run immediately on mount
    updateFromLocalStorage();

    // 🔹 Listen for changes in other tabs or in-app storage updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "gameData" || e.key === "gamePath") {
        updateFromLocalStorage();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 🔹 Also listen for custom in-tab updates
    const handleCustomUpdate = () => updateFromLocalStorage();
    window.addEventListener("localStorageUpdate", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageUpdate", handleCustomUpdate);
    };
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
    // ... (no changes in this function)
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
          window.dispatchEvent(new Event("localStorageUpdate"));
        }
      }
    } catch (error) {
      console.error("Error checking game installation:", error);
      setError("Failed to check game installation");
    }
  };

  const checkForUpdate = async () => {
    // ... (no changes in this function)
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result?.success && result.updateInfo?.version) {
        setShowUpdateModal(true);
      }
    } catch (error) {
      console.error("Update check failed:", error);
    }
  };

  const handleDownloadOrPlay = async () => {
    if (gamePath && gameStatus.installed) {
      return;
    }

    startDownload(); // ✅ 5. Use the global function to start
    setError(null);

    try {
      let installPath = await window.electronAPI.chooseInstallPath();
      if (!installPath) {
        installPath = await window.electronAPI.getDefaultInstallPath();
      }

      const exePath = await window.electronAPI.downloadGame({
        url: DOWNLOAD_URL,
        targetDir: installPath,
      });

      localStorage.setItem(GAME_KEY, exePath);
      window.dispatchEvent(new Event("localStorageUpdate"));
      setGamePath(exePath);
      setGameStatus({ installed: true, path: exePath });
    } catch (error) {
      console.error("Download/install error:", error);
      setError("Failed to download or install game. Please try again.");
      localStorage.removeItem(GAME_KEY);
    } finally {
      // The context will handle resetting the state, but you can also call it here if needed
      // finishDownload(); // The listener in the context now handles this automatically
    }
  };

  const handleGameTabsToggle = () => {
    if (isDownloading) return; // Prevent toggling while downloading
    if (gamePath && gameStatus.installed) {
      // If the game is installed, toggle the create/environment buttons
      setActiveGameTabs(!activeGameTabs);
    } else {
      // If the game is not installed, start the download process
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

      // Delay 2 seconds before launching
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

  // The rest of your return statement can remain exactly the same!
  // It will now read `isDownloading` and `downloadProgress` from the global context.
  return (
    <div className="w-full h-full overflow-hidden">
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

      {/* ✅ Auto-triggered modal */}
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </div>
  );
}
