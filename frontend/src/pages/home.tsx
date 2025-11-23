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
import { useRouter } from "next/navigation";
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
  getGameInstallationStatus: () => Promise<{
    installed: boolean;
    path?: string;
  }>;
  _updateListeners: Map<string, (event: any, ...args: any[]) => void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export default function Home() {
  const didCheckUpdate = useRef(false);
  const router = useRouter();
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

  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    installed: false,
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const gameData = localStorage?.getItem("gameData");
    if (!gameData) return;
    const parsedGame = JSON?.parse(gameData);

    if (parsedGame && parsedGame?.link) {
      setDownloadUrl(parsedGame?.link);
    }
    if (!window.electronAPI) return;
    checkGameInstallation();
    checkForUpdate();
  }, []);

  useEffect(() => {
    const check = async () => {
      const statusResult = await window.electronAPI.getGameInstallationStatus();
      const storedExePath = statusResult.path; // This is the full EXE path
      if (gamePath) {
        const dir = gamePath;
        window.electronAPI.updateWorker({
          path: dir,
          updates: { mode },
        });
      }
    };
    check();
  }, [mode]);

  // Home.tsx
  const checkGameInstallation = async () => {
    try {
      // 1. Get the reliably stored path (full EXE path) from worker.json
      const statusResult = await window.electronAPI.getGameInstallationStatus();
      const storedExePath = statusResult.path; // This is the full EXE path

      if (storedExePath) {
        setGameStatus(statusResult);
        if (statusResult.installed) {
          setGamePath(storedExePath); // StoredExePath is correct here
        } else {
          // If installed=false, the file is missing/corrupted, so clear the config.
          await window.electronAPI.updateWorker({
            // The `path` argument here is mostly ignored now, but the required type is string
            path: storedExePath,
            updates: {
              gamePath: null, // Clear the invalid path
            },
          });
        }
      }
    } catch (error) {
      console.error("Error checking game installation:", error);
      setError("Failed to check game installation");
    }
  };

  const checkForUpdate = async () => {
    if (didCheckUpdate.current) return; // ⛔ Prevent re-checking on tab change
    didCheckUpdate.current = true; // mark as checked

    try {
      const result = await window.electronAPI.checkForUpdates();

      if (result?.success && result.updateInfo?.version) {
        setShowUpdateModal(true); // YES update
      } else {
        setShowUpdateModal(false); // NO update
      }
    } catch (error) {
      console.error("Update check failed:", error);
    }
  };

  const handleDownloadOrPlay = async () => {
    const statusResult = await window.electronAPI.getGameInstallationStatus();
    const gamePath = statusResult.path;

    if (gamePath) {
      setGamePath(gamePath);
      setGameStatus(statusResult);
      return;
    }

    startDownload();
    setError(null);

    try {
      let installPath = await window.electronAPI.chooseInstallPath();

      // User didn't choose folder
      if (!installPath) {
        setError("You must choose an installation folder.");
        finishDownload();
        return;
      }

      const exePath = await window.electronAPI.downloadGame({
        url: DOWNLOAD_URL,
        targetDir: installPath,
      });
      if (exePath) {
        setGamePath(exePath);
        setGameStatus({ installed: true, path: exePath });
        finishDownload();
      }

      router;
    } catch (error) {
      console.error("Download/install error:", error);
      setError("Failed to download or install game. Please try again.");
      localStorage.removeItem(GAME_KEY);
      finishDownload();
    }
  };

  const handleGameTabsToggle = async () => {
    if (isDownloading) return; // Prevent toggling while downloading
    const statusResult = await window.electronAPI.getGameInstallationStatus();
    const gamePath = statusResult.path;
    if (gamePath) {
      setGamePath(gamePath);
      setGameStatus(statusResult);
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
    const statusResult = await window.electronAPI.getGameInstallationStatus();
    const gamePath = statusResult.path;
    if (!gamePath) {
      setError("Game is not installed.");
      return;
    }
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
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-50">
        <CreateButtonsPlaceholder
          mode={mode}
          playGame={playGame}
          isDarkMode={isDarkMode}
          setActiveGameTabs={handleGameTabsToggle}
          activeGameTabs={activeGameTabs}
        />
      </div>
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
