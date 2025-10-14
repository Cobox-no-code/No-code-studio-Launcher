import UpdateModal from "@/components/UpdateModal";
import { useDarkMode } from "@/context/DarkModeContext";
import {
  CreateButtons,
  CreateButtonsPlaceholder,
  ToggleDarkMode,
  ToggleMode,
} from "@/utils/icons";
import { useEffect, useState } from "react";

const GAME_KEY = "cyber-game-path";
const DOWNLOAD_URL =
  "https://cobox-game-data.s3.us-east-1.amazonaws.com/Archive.zip";

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
  updateSecret: (data: {
    path: string;
    updates: Record<string, any>;
  }) => Promise<any>;
  _updateListeners: Map<string, (event: any, ...args: any[]) => void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export default function Home() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [mode, setMode] = useState<"play" | "create">("create");
  const [activeGameTabs, setActiveGameTabs] = useState(false);
  const [gamePath, setGamePath] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    installed: false,
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    checkGameInstallation();
    checkForUpdate(); // ✅ Auto-check for updates on load

    // Listen for download progress updates
    window.electronAPI.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
    });
  }, []);
  useEffect(() => {
    // Whenever mode changes, update secret.json
    if (gamePath && gameStatus.installed) {
      const dir = gamePath; // path to NoCodeStudio.exe folder
      window.electronAPI.updateSecret({
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

  // ✅ Auto check for updates
  const checkForUpdate = async () => {
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
      try {
        setError(null);
        await window.electronAPI.launchGame(gamePath);
      } catch (error) {
        setError("Failed to launch game. Please try reinstalling.");
        console.error("Launch error:", error);
      }
      return;
    }

    setIsDownloading(true);
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
      setGamePath(exePath);
      setGameStatus({ installed: true, path: exePath });
    } catch (error) {
      console.error("Download/install error:", error);
      setError("Failed to download or install game. Please try again.");
      localStorage.removeItem(GAME_KEY);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReinstall = () => {
    localStorage.removeItem(GAME_KEY);
    setGamePath(null);
    setGameStatus({ installed: false });
    setError(null);
  };

  const getButtonText = () => {
    if (isDownloading) return "Installing...";
    if (gameStatus.installed) return "Launch Game";
    return "Download Game";
  };
  const handleGameTabsToggle = () => {
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
      await window.electronAPI.updateSecret({
        path: gamePath,
        updates: { mode, type },
      });

      // Delay 2 seconds before launching
      setTimeout(async () => {
        await window.electronAPI.launchGame(gamePath);
      }, 2000);
    } catch (error) {
      console.error("Failed to launch with secret.json:", error);
      setError("Failed to launch game");
    }
  };

  const createGame = () => launchWithSecret("creategame");
  const createEnvironment = () => launchWithSecret("createenv");
  const playGame = () => launchWithSecret("playgame");

  return (
    <div className="  w-full h-full">
      <img className=" absolute inset-0 z-50 " src="/home.png" alt="" />

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
                background: !isDarkMode
                  ? "linear-gradient(90deg, #6A4BC9, #4D349C)"
                  : "linear-gradient(90deg, #000000, #444444)",
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
