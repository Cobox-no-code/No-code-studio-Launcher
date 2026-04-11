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
  Trash2,
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

  useOnClickOutside(divref, () => {
    setSelectedGame(null);
    setActive(false);
  });

  useEffect(() => {
    if (!active) setSelectedGame(null);
  }, [active]);

  const fetchAndSyncGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/published-games");
      const serverGames = response.data;

      const serverIds = serverGames.map((g: any) => g.game_id);
      const localStatus =
        await window.electronAPI.checkDownloadStatus(serverIds);

      const merged = serverGames.map((game: any) => ({
        ...game,
        isDownloaded: localStatus[game.game_id]?.downloaded || false,
        localPath: localStatus[game.game_id]?.path || null,
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
      await api.post(`/games/${game.game_id}/install`);
    } catch (err) {
      console.error("View increment failed");
    }
  };

  // ── Delete downloaded file from disk ──────────────────────────────────────
  const handleDeleteDownload = async (gameId: any) => {
    const toastId = toast.loading("Deleting local file...");
    try {
      const result = await window.electronAPI.deleteLiveGame({ gameId });
      if (!result.success) throw new Error(result.error || "Delete failed");
      toast.success("Local file removed.", { id: toastId });
      // If we're in the detail view for this game, go back to grid first
      if (selectedGame?.game_id === gameId) setSelectedGame(null);
      await fetchAndSyncGames(); // re-sync to flip isDownloaded → false
    } catch (err: any) {
      toast.error(err.message || "Failed to delete file.", { id: toastId });
    }
  };

  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";

  if (!active) return null;

  return (
    <div className="fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm bg-[#0E052A]/80">
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl w-[85vw] max-w-7xl h-[78vh] py-6 px-8 flex flex-col ${modalBgClass}`}
      >
        {/* Header */}
        {!selectedGame && (
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Discover Games
            </h2>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} isDarkMode={isDarkMode} />
              ))}
            </div>
          ) : selectedGame ? (
            <GameDetailsView
              game={selectedGame}
              onBack={() => setSelectedGame(null)}
              onRefresh={fetchAndSyncGames}
              onDeleteDownload={handleDeleteDownload}
            />
          ) : games.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {games.map((game) => (
                <GameCard
                  key={game.game_id}
                  game={game}
                  isDarkMode={isDarkMode}
                  onViewDetails={handleViewDetails}
                  onPlayAction={async (g) => {
                    // Quick play from card — opens detail to handle download+launch
                    handleViewDetails(g);
                  }}
                  onDeleteDownload={handleDeleteDownload}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] opacity-40">
              <p className={isDarkMode ? "text-white" : "text-gray-900"}>
                No games published yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GameCard — grid item with optional "Delete from disk" button
// ─────────────────────────────────────────────────────────────────────────────
const GameCard = ({
  game,
  isDarkMode,
  onViewDetails,
  onPlayAction,
  onDeleteDownload,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const cardBgClass = isDarkMode ? "bg-[#1C1041]" : "bg-[#F0F0F0]";
  const thumbnail = game.thumbnail_url;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't bubble to card click
    if (!window.confirm(`Remove "${game.title}" from your device?`)) return;
    setIsDeleting(true);
    await onDeleteDownload(game.game_id);
    setIsDeleting(false);
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden pb-4 shadow-sm hover:shadow-md transition-all ${cardBgClass} h-[260px] relative`}
    >
      {/* "ON DISK" badge */}
      {game.isDownloaded && (
        <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg">
          <CheckCircle size={10} /> ON DISK
        </div>
      )}

      {/* Thumbnail */}
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

      {/* Info */}
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

        {/* Action row */}
        <div className="flex gap-1.5 mt-2">
          {/* Play / Download */}
          <button
            onClick={() => onPlayAction(game)}
            className={`flex-1 py-3 cursor-pointer rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all text-white ${
              game.isDownloaded
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#8267D2] hover:brightness-110"
            }`}
          >
            {game.isDownloaded ? (
              <Play size={12} fill="white" />
            ) : (
              <Download size={12} />
            )}
            {game.isDownloaded ? "Play" : "Download"}
          </button>

          {/* Info */}
          <button
            onClick={() => onViewDetails(game)}
            className={`px-3 py-3 rounded-lg border transition-all flex items-center cursor-pointer justify-center ${
              isDarkMode
                ? "border-white/10 text-white hover:bg-white/5"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Info size={14} />
          </button>

          {/* Delete from disk — only when downloaded */}
          {game.isDownloaded && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              title="Remove from device"
              className={`px-3 py-3 rounded-lg border transition-all flex items-center cursor-pointer justify-center disabled:opacity-50 ${
                isDarkMode
                  ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                  : "border-red-200 text-red-500 hover:bg-red-50"
              }`}
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GameDetailsView — full detail page with delete button
// ─────────────────────────────────────────────────────────────────────────────
const GameDetailsView = ({ game, onBack, onRefresh, onDeleteDownload }) => {
  const { isDarkMode } = useDarkMode();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const thumbnail = game.thumbnail_url;

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
          activeGameId: game.game_id,
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
          url:game.file_url ,
          gameId: game.game_id,
          title: game.title,
        });
        if (!result.success) throw new Error(result.error);
        currentLocalPath = result.path;
        await api.post(`/games/${game.game_id}/install`);
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

  const handleDeleteDownload = async () => {
    if (
      !window.confirm(
        `Remove "${game.title}" from your device? You can re-download it anytime.`,
      )
    )
      return;
    setIsDeleting(true);
    await onDeleteDownload(game.game_id);
    // onDeleteDownload will navigate back to grid via GamesModal handler
    setIsDeleting(false);
  };

  const headingClass = isDarkMode ? "text-white" : "text-gray-900";
  const subClass = isDarkMode ? "text-gray-400" : "text-gray-600";

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
        {/* Left — image + primary actions */}
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

          {/* Play / Download button */}
          <button
            onClick={handlePlayAction}
            disabled={isProcessing || isDeleting}
            className="w-full mt-6 cursor-pointer bg-[#8267D2] text-white py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:brightness-110 shadow-lg transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play size={24} fill="white" />
            )}
            {game.isDownloaded ? "PLAY NOW" : "DOWNLOAD & PLAY"}
          </button>

          {/* ── Delete from disk button — only when downloaded ── */}
          {game.isDownloaded && (
            <button
              onClick={handleDeleteDownload}
              disabled={isDeleting || isProcessing}
              className={`w-full mt-3 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all disabled:opacity-50 ${
                isDarkMode
                  ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                  : "border-red-200 text-red-500 hover:bg-red-50"
              }`}
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isDeleting ? "Removing..." : "Delete from Device"}
            </button>
          )}
        </div>

        {/* Right — metadata */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <h1 className={`text-4xl font-black ${headingClass}`}>
              {game.title}
            </h1>
            <p className="text-[#8267D2] font-bold mt-1">
              by {game.author_name}
            </p>
          </div>

          <p className={`text-sm leading-relaxed ${subClass}`}>
            {game.description || "No description provided."}
          </p>

          <div className={`grid grid-cols-2 gap-4 text-sm ${subClass}`}>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-[#8267D2]" />
              <span>{game.view_count || 0} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Download size={16} className="text-[#8267D2]" />
              <span>{game.install_count || 0} downloads</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-[#8267D2]" />
              <span>{game.creator_name || game.author_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#8267D2]" />
              <span>{new Date(game.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
