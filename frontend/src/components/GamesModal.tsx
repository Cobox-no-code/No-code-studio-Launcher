"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import api from "@/utils/api";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  Info,
  Loader2,
  Play,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
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

const SkeletonCard = ({ isDarkMode }) => (
  <div
    className={`h-[260px] rounded-xl animate-pulse ${
      isDarkMode ? "bg-[#1C1041]/50" : "bg-gray-200"
    }`}
  />
);

export default function GamesModal({ active, setActive }) {
  const divref = useRef<HTMLDivElement | null>(null);
  const { isDarkMode } = useDarkMode();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  // ✅ FIX: Reset selectedGame when modal closes so reopening always shows the grid
  useOnClickOutside(divref, () => {
    setSelectedGame(null); // reset detail view
    setActive(false);
  });

  // Also reset when active changes to false from parent (e.g. ESC key or external close)
  useEffect(() => {
    if (!active) {
      setSelectedGame(null);
    }
  }, [active]);

  const fetchAndSyncGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/published-games");
      const serverGames = response.data;

      const serverIds = serverGames.map((g: any) => g.id);
      const localStatus =
        await window.electronAPI.checkDownloadStatus(serverIds);

      const merged = serverGames.map((game: any) => ({
        ...game,
        isDownloaded: localStatus[game.id]?.downloaded || false,
        localPath: localStatus[game.id]?.path || null,
      }));

      setGames(merged);
    } catch (error) {
      console.error("Failed to sync games:", error);
      toast.error("Failed to load library");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) fetchAndSyncGames();
  }, [active, fetchAndSyncGames]);

  const handleViewDetails = async (game) => {
    setSelectedGame(game);
    try {
      await api.put(`/published-games/${game.id}/view`);
    } catch (err) {
      console.error("View increment failed");
    }
  };

  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";
  const backdropClass = isDarkMode ? "bg-[#0E052A]/80" : "bg-[#F5F5FF]/68";

  if (!active) return null;

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm ${backdropClass}`}
    >
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl min-w-6xl w-[60vw] max-w-6xl h-[75vh] overflow-hidden flex flex-col transition-colors duration-300 ${modalBgClass}`}
      >
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} isDarkMode={isDarkMode} />
              ))}
            </div>
          ) : selectedGame ? (
            <GameDetailsView
              game={selectedGame}
              onBack={() => setSelectedGame(null)}
              onRefresh={fetchAndSyncGames}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  isDarkMode={isDarkMode}
                  game={game}
                  onViewDetails={() => handleViewDetails(game)}
                  onRefresh={fetchAndSyncGames}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const GameCard = ({ isDarkMode, game, onViewDetails, onRefresh }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const cardBgClass = isDarkMode
    ? "bg-[#1C1041]"
    : "bg-white border border-gray-200";
  const thumbnail = `https://app.cobox.co${game.thumbnail}`;

  const launchWithSecret = async (
    currentMode: string,
    type: string,
    gameInstalled: boolean,
    specificPath?: string,
  ) => {
    const finalPath = specificPath || game.localPath;
    if (!gameInstalled || !finalPath) {
      toast.error("Game files not found. Please download again.");
      return;
    }
    try {
      const workerResult = await window.electronAPI.updateWorker({
        path: "",
        updates: {
          mode: currentMode,
          type: type,
          currentGamePath: finalPath,
          activeGameId: game.id,
        },
      });
      if (!workerResult.success)
        throw new Error("Failed to update game configuration.");
      const launchResult = await window.electronAPI.launchGame();
      if (!launchResult.success) {
        toast.error(`Launch failed: ${launchResult.error}`);
      } else {
        toast.success(`Launching ${game.title}...`);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during launch.");
    }
  };

  const handlePlayAction = async () => {
    setIsProcessing(true);
    let currentLocalPath = game.localPath;
    const isFirstTimeDownload = !game.isDownloaded;
    try {
      if (isFirstTimeDownload) {
        toast.loading("Downloading game files...", { id: "game-action" });
        const result = await window.electronAPI.downloadLiveGame({
          url: `https://app.cobox.co${game.file_path}`,
          gameId: game.id,
          title: game.title,
        });
        if (!result.success) throw new Error(result.error);
        currentLocalPath = result.path;
        await api.put(`/published-games/${game.id}/install`);
        toast.success("Download complete!", { id: "game-action" });
      }
      await launchWithSecret("play", "playgame", true, currentLocalPath);
      if (!isFirstTimeDownload) {
        toast.success("Launching game...", { id: "game-action" });
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to launch", { id: "game-action" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden pb-4 shadow-sm hover:shadow-md transition-all ${cardBgClass} h-[260px] relative`}
    >
      {game.isDownloaded && (
        <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg">
          <CheckCircle size={10} /> ON DISK
        </div>
      )}
      <div className="relative h-32 w-full shrink-0">
        <img
          src={thumbnail}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
          <Eye size={10} /> {game.view_count || 0}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div className="space-y-0.5">
          <h4
            className={`font-bold text-sm truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {game.title}
          </h4>
          <p className="text-[10px] text-[#8267D2] font-bold uppercase tracking-tight">
            By {game.author_name}
          </p>
          <p
            className={`text-[11px] line-clamp-2 mt-1 leading-snug ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {game.description || "No description provided."}
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handlePlayAction}
            disabled={isProcessing}
            className={`flex-1 py-3 cursor-pointer rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all text-white ${
              game.isDownloaded
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#8267D2] hover:brightness-110"
            } disabled:opacity-50`}
          >
            {isProcessing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : game.isDownloaded ? (
              <Play size={12} fill="white" />
            ) : (
              <Download size={12} />
            )}
            {game.isDownloaded ? "Play" : "Download"}
          </button>
          <button
            onClick={onViewDetails}
            className={`px-3 py-3 rounded-lg border transition-all flex items-center cursor-pointer justify-center ${
              isDarkMode
                ? "border-white/10 text-white hover:bg-white/5"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Info size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const GameDetailsView = ({ game, onBack, onRefresh }) => {
  const { isDarkMode } = useDarkMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const thumbnail = `https://app.cobox.co${game.thumbnail}`;

  const launchWithSecret = async (
    currentMode: string,
    type: string,
    gameInstalled: boolean,
    specificPath?: string,
  ) => {
    const finalPath = specificPath || game.localPath;
    if (!gameInstalled || !finalPath) {
      toast.error("Game files not found. Please download again.");
      return;
    }
    try {
      const workerResult = await window.electronAPI.updateWorker({
        path: "",
        updates: {
          mode: currentMode,
          type: type,
          currentGamePath: finalPath,
          activeGameId: game.id,
        },
      });
      if (!workerResult.success)
        throw new Error("Failed to update game configuration.");
      const launchResult = await window.electronAPI.launchGame();
      if (!launchResult.success) {
        toast.error(`Launch failed: ${launchResult.error}`);
      } else {
        toast.success(`Launching ${game.title}...`);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during launch.");
    }
  };

  const handlePlayAction = async () => {
    setIsProcessing(true);
    let currentLocalPath = game.localPath;
    const isFirstTimeDownload = !game.isDownloaded;
    try {
      if (isFirstTimeDownload) {
        toast.loading("Downloading game files...", { id: "game-action" });
        const result = await window.electronAPI.downloadLiveGame({
          url: `https://app.cobox.co${game.file_path}`,
          gameId: game.id,
          title: game.title,
        });
        if (!result.success) throw new Error(result.error);
        currentLocalPath = result.path;
        await api.put(`/published-games/${game.id}/install`);
        toast.success("Download complete!", { id: "game-action" });
      }
      await launchWithSecret("play", "playgame", true, currentLocalPath);
      if (!isFirstTimeDownload) {
        toast.success("Launching game...", { id: "game-action" });
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to launch", { id: "game-action" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button
        onClick={onBack}
        className="flex items-center text-[#8267D2] cursor-pointer font-bold mb-6 group"
      >
        <ArrowLeft
          size={20}
          className="mr-2 group-hover:-translate-x-1 transition-transform"
        />
        Back to Library
      </button>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="relative">
            <img
              src={thumbnail}
              alt={game.title}
              className="w-full aspect-video rounded-3xl object-cover shadow-2xl border-4 border-[#8267D2]/20"
            />
            {game.isDownloaded && (
              <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                READY TO PLAY
              </div>
            )}
          </div>
          <button
            onClick={handlePlayAction}
            disabled={isProcessing}
            className="w-full mt-6 cursor-pointer bg-[#8267D2] text-white py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:brightness-110 shadow-lg transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play size={24} fill="white" />
            )}
            {game.isDownloaded ? "PLAY NOW" : "DOWNLOAD & PLAY"}
          </button>
        </div>
        <div className="md:col-span-7 space-y-6">
          <h1
            className={`text-4xl font-black ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {game.title}
          </h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-[#8267D2]/10 px-4 py-2 rounded-full flex items-center gap-2 text-[#8267D2] font-bold text-sm">
              <User size={16} /> {game.author_name}
            </div>
            <div className="bg-gray-500/10 px-4 py-2 rounded-full flex items-center gap-2 text-gray-500 font-bold text-sm">
              <Eye size={16} /> {game.view_count} Views
            </div>
            <div className="bg-gray-500/10 px-4 py-2 rounded-full flex items-center gap-2 text-gray-500 font-bold text-sm">
              <Calendar size={16} />{" "}
              {new Date(game.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="space-y-3">
            <h3
              className={`text-xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
            >
              About the game
            </h3>
            <p
              className={`text-lg leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {game.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
