import { useEffect, useState } from "react";

const GAME_KEY = "cyber-game-path";
const DOWNLOAD_URL =
  "https://cobox-game-data.s3.us-east-1.amazonaws.com/Archive.zip";

interface GameStatus {
  installed: boolean;
  path?: string;
}

export default function Home() {
  const [gamePath, setGamePath] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    installed: false,
  });

  useEffect(() => {
    checkGameInstallation();
  }, []);

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
          // Remove invalid path from localStorage
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
      // Game already downloaded, launch it
      try {
        setError(null);
        await window.electronAPI.launchGame(gamePath);
      } catch (error) {
        setError("Failed to launch game. Please try reinstalling.");
        console.error("Launch error:", error);
      }
      return;
    }

    // Download game
    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      let installPath = await window.electronAPI.chooseInstallPath();

      if (!installPath) {
        installPath = await window.electronAPI.getDefaultInstallPath();
      }

      console.log("Installing to:", installPath);
      console.log("Download URL:", DOWNLOAD_URL);

      const exePath = await window.electronAPI.downloadGame({
        url: DOWNLOAD_URL,
        targetDir: installPath,
      });

      localStorage.setItem(GAME_KEY, exePath);
      setGamePath(exePath);
      setGameStatus({ installed: true, path: exePath });
      setDownloadProgress(100);

      console.log("Game installed successfully!");
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute bottom-16 left-16 z-20">
        <div className="relative">
          <button
            onClick={handleDownloadOrPlay}
            disabled={isDownloading}
            className={`
              relative px-8 py-3 font-semibold rounded-sm transition-all duration-200
              ${
                isDownloading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-white text-[#3A14A3] hover:bg-gray-100 cursor-pointer"
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              {isDownloading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
              )}
              <span>{getButtonText()}</span>
            </div>

            {/* Progress bar overlay */}
            {isDownloading && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-[#3A14A3] transition-all duration-300 ease-out rounded-b-sm"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
