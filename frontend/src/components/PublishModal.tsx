"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import api from "@/utils/api";
import {
  ArrowLeft,
  CheckCircle,
  Folder,
  Globe,
  Loader2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const getAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`;

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

export default function PublishModal({ active, setActive }) {
  const [activeTab, setActiveTab] = useState<"unpublished" | "published">(
    "unpublished"
  );
  const [selectedGame, setSelectedGame] = useState(null);
  const divref = useRef<HTMLDivElement | null>(null);
  const { isDarkMode } = useDarkMode();

  const [localGames, setLocalGames] = useState([]);
  const [publishedGames, setPublishedGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleOutside = useCallback(() => {
    if (!selectedGame) setActive(false);
  }, [setActive, selectedGame]);

  useOnClickOutside(divref, handleOutside);

  const fetchLocalGames = async () => {
    try {
      const games = await window.electronAPI.getLocalLibraryGames();
      return games;
    } catch (err) {
      toast.error("Could not load local save games.");
    }
  };
  // Fetch Published Games from Server and Local Games
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Server using userId (handled by backend middleware)
      const res = await api.get("/published-games/my-games");
      const serverGames = res.data.data || [];
      setPublishedGames(serverGames);

      // 2. Set Local Games (In real app, this might come from Electron scanner)
      // Filter logic: Only show local games that are NOT in the published list
      const publishedIds = new Set(serverGames.map((pg: any) => pg.id));
      const localGames = await fetchLocalGames();
      const filteredLocal = localGames.filter((g) => !publishedIds.has(g.id));

      setLocalGames(filteredLocal);
    } catch (err) {
      console.error("Error fetching published games:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      refreshData();
    }
  }, [active]);

  const backdropClass = isDarkMode ? "bg-[#0E052A]/80" : "bg-[#F5F5FF]/68";
  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";
  const tabActiveClass = "text-[#8267D2] border-b-2 border-[#8267D2]";
  const tabInactiveClass = "text-gray-500 hover:text-gray-400";

  if (!active) return null;

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm transition-colors duration-300 ${backdropClass}`}
    >
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl min-w-6xl w-[60vw] max-w-6xl h-[75vh] py-6 px-8 transition-colors duration-300 flex flex-col ${modalBgClass}`}
      >
        {!selectedGame && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Manage Games
              </h2>
              <div className="flex space-x-6 text-sm font-semibold">
                <button
                  onClick={() => setActiveTab("unpublished")}
                  className={`pb-2 transition-all flex items-center gap-2 ${
                    activeTab === "unpublished"
                      ? tabActiveClass
                      : tabInactiveClass
                  }`}
                >
                  <Folder size={18} /> Drafts ({localGames.length})
                </button>
                <button
                  onClick={() => setActiveTab("published")}
                  className={`pb-2 transition-all flex items-center gap-2 ${
                    activeTab === "published"
                      ? tabActiveClass
                      : tabInactiveClass
                  }`}
                >
                  <Globe size={18} /> Published ({publishedGames.length})
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} isDarkMode={isDarkMode} />
              ))}
            </div>
          ) : selectedGame ? (
            <PublishDetails
              game={selectedGame}
              onBack={() => setSelectedGame(null)}
              onSuccess={() => {
                setSelectedGame(null);
                refreshData();
              }}
            />
          ) : (
            <>
              {activeTab === "unpublished" ? (
                localGames.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {localGames.map((game) => (
                      <SavedItem
                        key={game.id}
                        game={game}
                        isDarkMode={isDarkMode}
                        onPublish={setSelectedGame}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    message="No new games to publish"
                    isDarkMode={isDarkMode}
                  />
                )
              ) : publishedGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {publishedGames.map((game) => (
                    <PublishedItem
                      key={game.id}
                      game={game}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="You haven't published any games yet"
                  isDarkMode={isDarkMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const SavedItem = ({ isDarkMode, game, onPublish }) => {
  const cardBgClass = isDarkMode ? "bg-[#1C1041]" : "bg-[#EAEAEA]";
  return (
    <div className={`rounded-xl overflow-hidden transition p-1 ${cardBgClass}`}>
      <img
        src={getAvatar(game.name)}
        alt={game.name}
        className="w-full h-32 object-cover rounded-t-lg"
      />
      <div className="p-3">
        <h4
          className={`font-semibold truncate mb-3 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {game.name}
        </h4>
        <button
          onClick={() => onPublish(game)}
          className="w-full bg-[#8267D2] text-white text-xs py-2 rounded-lg hover:bg-[#8267D2]/90 transition font-bold"
        >
          Ready to Publish
        </button>
      </div>
    </div>
  );
};

const PublishedItem = ({ isDarkMode, game }) => {
  const cardBgClass = isDarkMode ? "bg-[#1C1041]/60" : "bg-[#F0F0F0]";
  // Use the storage path from backend or the direct URL
  const thumbnail = `https://app.cobox.co${game.thumbnail}`;

  return (
    <div
      className={`rounded-xl overflow-hidden border ${
        isDarkMode ? "border-white/5" : "border-black/5"
      } ${cardBgClass}`}
    >
      <div className="relative">
        <img
          src={thumbnail}
          alt={game.title}
          className="w-full h-32 object-cover opacity-80"
        />
        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
          <CheckCircle size={14} />
        </div>
      </div>
      <div className="p-3">
        <h4
          className={`font-semibold truncate ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {game.title}
        </h4>
        <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
          <span>Views: {game.view_count || 0}</span>
          <span>{new Date(game.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message, isDarkMode }) => (
  <div className="flex flex-col items-center justify-center h-[50vh] opacity-40">
    <Folder size={48} className={isDarkMode ? "text-white" : "text-gray-900"} />
    <p className={`mt-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
      {message}
    </p>
  </div>
);

const SkeletonCard = ({ isDarkMode }) => (
  <div
    className={`h-48 rounded-xl animate-pulse ${
      isDarkMode ? "bg-[#1C1041]/50" : "bg-gray-200"
    }`}
  />
);

const PublishDetails = ({ game, onBack, onSuccess }) => {
  const { isDarkMode } = useDarkMode();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(game.name);
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelClass = isDarkMode ? "text-gray-300" : "text-gray-600";
  const inputBase = `w-full px-4 py-2 rounded-lg border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#8267D2]/40`;
  const inputTheme = isDarkMode
    ? "bg-[#1C1041] border-[#3D2B7A] text-white placeholder:text-gray-500 focus:border-[#8267D2]"
    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#8267D2]";

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Game title is required.");
    if (!previewUrl) return toast.error("Thumbnail is required.");
    if (!author.trim()) return toast.error("Author name is required.");
    if (!consent) return toast.error("Please accept the terms.");

    setIsSubmitting(true);
    const loadingToast = toast.loading("Uploading game...");

    try {
      const result = await window.electronAPI.publishGameFull({
        filePath: game.path,
        thumbnailBase64: previewUrl,
        metadata: {
          id: game.id,
          userId: "current",
          title: name,
          authorName: author,
          description: description,
          token: localStorage.getItem("auth_token"),
        },
      });

      if (result.success) {
        toast.success("Success! Game is now live.", { id: loadingToast });
        onSuccess();
      } else {
        toast.error(result.error || "Failed to publish.", { id: loadingToast });
      }
    } catch (err) {
      toast.error("An unexpected error occurred.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={onBack}
        className="flex items-center text-xs font-bold text-[#8267D2] mb-6 group"
      >
        <ArrowLeft
          size={14}
          className="mr-2 group-hover:-translate-x-1 transition-transform"
        />
        Back to selection
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <label className={`text-xs font-bold ${labelClass}`}>
            Thumbnail (16:9)
          </label>
          <div
            onClick={() => !isSubmitting && thumbInputRef.current?.click()}
            className={`relative aspect-video rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden ${
              previewUrl
                ? "border-solid border-[#8267D2]"
                : "border-gray-500 hover:border-[#8267D2]"
            }`}
          >
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-cover" />
            ) : (
              <Upload className="text-gray-500" />
            )}
          </div>
          <input
            type="file"
            ref={thumbInputRef}
            hidden
            onChange={handleThumbnailChange}
            accept="image/*"
          />
        </div>

        <div className="md:col-span-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold block mb-1 ${labelClass}`}>
                Title
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputBase} ${inputTheme}`}
              />
            </div>
            <div>
              <label className={`text-xs font-bold block mb-1 ${labelClass}`}>
                Creator Name
              </label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={`${inputBase} ${inputTheme}`}
              />
            </div>
          </div>
          <div>
            <label className={`text-xs font-bold block mb-1 ${labelClass}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputBase} ${inputTheme} resize-none`}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded border-gray-300 text-[#8267D2]"
            />
            <span className={`text-[10px] ${labelClass}`}>
              Confirm ownership of this content.
            </span>
          </label>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#8267D2] text-white font-bold rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Publish Game"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
