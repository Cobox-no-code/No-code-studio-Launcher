"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import api from "@/utils/api"; // Make sure to import your custom API instance
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

// The useOnClickOutside hook is correct and needs no changes.
function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function GamesModal({ active, setActive }) {
  const divref = useRef<HTMLDivElement | null>(null);
  const { isDarkMode } = useDarkMode();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleOutside = useCallback(() => {
    setActive(false);
  }, [setActive]);

  useOnClickOutside(divref, handleOutside);

  // Fetch games when the modal becomes active
  useEffect(() => {
    if (active) {
      const fetchGames = async () => {
        setIsLoading(true);
        try {
          const response = await api.get("/games");
          setGames(response.data);
        } catch (error) {
          console.error("Failed to fetch games:", error);
          setGames([]); // Ensure games is an empty array on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchGames();
    }
  }, [active]);

  const backdropClass = isDarkMode ? "bg-[#0E052A]/80" : "bg-[#F5F5FF]/68";
  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";

  if (!active) return null;

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm transition-colors duration-300 ${backdropClass}`}
    >
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl min-w-6xl w-[60vw] max-w-6xl h-[75vh] py-4 px-4 transition-colors duration-300 ${modalBgClass}`}
      >
        <div className="flex flex-col mx-auto w-full h-full space-y-2">
          <div className="flex flex-col pt-4">
            {/* Navigation can go here */}
          </div>

          <div className="w-full h-full overflow-y-auto pr-4">
            {isLoading ? (
              // State 1: Show skeleton cards while loading
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <SkeletonCard key={index} isDarkMode={isDarkMode} />
                ))}
              </div>
            ) : games.length > 0 ? (
              // State 2: Show game cards once data is loaded
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {games.map((game) => (
                  <SavedItem
                    key={game.id}
                    isDarkMode={isDarkMode}
                    game={game}
                  />
                ))}
              </div>
            ) : (
              // State 3: Show message if no games are available
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg">No games available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Component for a single Game Item card ---
const SavedItem = ({ isDarkMode, game }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const cardBgClass = isDarkMode ? "bg-[#1C1041]" : "bg-[#EAEAEA]";
  const [gamePath, setGamePath] = useState<string | null>(null);
  const GAME_KEY = "gamePath";

  useEffect(() => {
    checkGameInstallation();

    // ❌ 4. Remove the progress listener setup from here, it's now global
    // window.electronAPI.onDownloadProgress((progress) => {
    //   setDownloadProgress(progress);
    // });
  }, []);
  const checkGameInstallation = async () => {
    // ... (no changes in this function)
    try {
      const storedPath = localStorage.getItem(GAME_KEY);
      if (storedPath) {
        const status = await window.electronAPI.checkGameInstallation(
          storedPath
        );
        if (status.installed) {
          setGamePath(storedPath);
        } else {
          localStorage.removeItem(GAME_KEY);
        }
      }
    } catch (error) {
      console.error("Error checking game installation:", error);
    }
  };

  const handlePlay = async () => {
    if (!game || !game.data) {
      toast.error("Game data is missing.");
      return;
    }

    setIsLaunching(true);
    try {
      // 2. Prepare the updates for the worker.json file
      const workerUpdates = {
        type: "playgame",
        mode: "play",
        data: game.data, // This is the JSON from the 'data' field of the game object
      };

      // 3. Call the IPC handler to update the file
      await window.electronAPI.updateWorker({
        path: gamePath,
        updates: workerUpdates,
      });

      // 4. Call the IPC handler to launch the game's executable
      await window.electronAPI.launchGame(gamePath);
    } catch (error) {
      console.error("Failed to launch game:", error);
      toast.error(`There was an error launching ${game.title}.`);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div
      className={`group relative aspect-video rounded-xl transition-colors duration-300 overflow-hidden cursor-pointer ${cardBgClass}`}
    >
      {/* Overlay with Play Button - appears on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center">
        <button
          onClick={handlePlay}
          disabled={isLaunching}
          className="bg-purple-600 text-white font-bold py-2 px-6 rounded-full transform hover:scale-105 transition-transform duration-200 shadow-lg disabled:bg-purple-800 disabled:cursor-not-allowed flex items-center"
        >
          {isLaunching ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Launching...
            </>
          ) : (
            "Play"
          )}
        </button>
      </div>

      {/* Game Title */}
      <div className="absolute bottom-0 left-0 p-3 w-full bg-gradient-to-t from-black/70 to-transparent">
        <h4 className="text-white font-semibold truncate">{game.title}</h4>
      </div>
    </div>
  );
};

// --- Component for the loading skeleton ---
const SkeletonCard = ({ isDarkMode }) => {
  const cardBgClass = isDarkMode ? "bg-[#1C1041]/50" : "bg-[#EAEAEA]";
  return (
    <div className={`aspect-video rounded-xl animate-pulse ${cardBgClass}`} />
  );
};
