"use client";
import { useDarkMode } from "@/context/DarkModeContext";
import api from "@/utils/api";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  FileText,
  Folder,
  Gamepad2,
  Globe,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const getAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`;

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

export default function PublishModal({ active, setActive }) {
  const [activeTab, setActiveTab] = useState<"unpublished" | "published">(
    "unpublished",
  );
  const [selectedGame, setSelectedGame] = useState(null);
  const [editingGame, setEditingGame] = useState(null); // ← NEW
  const divref = useRef<HTMLDivElement | null>(null);
  const { isDarkMode } = useDarkMode();

  const [localGames, setLocalGames] = useState([]);
  const [publishedGames, setPublishedGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Close modal only when neither detail view nor edit view is open
  const handleOutside = useCallback(() => {
    if (!selectedGame && !editingGame) setActive(false);
  }, [setActive, selectedGame, editingGame]);

  useOnClickOutside(divref, handleOutside);

  const fetchLocalGames = async () => {
    try {
      const games = await window.electronAPI.getLocalLibraryGames();
      return games;
    } catch (err) {
      toast.error("Could not load local save games.");
      return [];
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/published-games/my");
      const serverGames = res.data.data || [];
      setPublishedGames(serverGames);

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
    if (active) refreshData();
  }, [active]);

  // ─── Delete handler (passed down to PublishedItem) ───────────────────────
  const handleDelete = async (gameId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this game from the live server? This cannot be undone.",
    );
    if (!confirmed) return;

    const toastId = toast.loading("Removing game...");
    try {
      await api.delete(`/published-games/${gameId}`);
      toast.success("Game removed successfully.", { id: toastId });
      refreshData();
    } catch (err) {
      toast.error("Failed to remove game.", { id: toastId });
    }
  };

  const backdropClass = isDarkMode ? "bg-[#0E052A]/80" : "bg-[#F5F5FF]/68";
  const modalBgClass = isDarkMode ? "bg-[#0E052A]" : "bg-white";
  const tabActiveClass = "text-[#8267D2] border-b-2 border-[#8267D2]";
  const tabInactiveClass = "text-gray-500 hover:text-gray-400";

  if (!active) return null;

  const isInSubView = !!selectedGame || !!editingGame;

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 z-[100] flex justify-center items-center backdrop-blur-sm transition-colors duration-300 ${backdropClass}`}
    >
      <div
        ref={divref}
        className={`rounded-3xl shadow-2xl min-w-6xl w-[60vw] max-w-6xl h-[75vh] py-6 px-8 transition-colors duration-300 flex flex-col ${modalBgClass}`}
      >
        {/* Header — hidden while in publish-detail or edit view */}
        {!isInSubView && (
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
                  activeTab === "published" ? tabActiveClass : tabInactiveClass
                }`}
              >
                <Globe size={18} /> Published ({publishedGames.length})
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} isDarkMode={isDarkMode} />
              ))}
            </div>
          ) : editingGame ? (
            /* ── EDIT VIEW ─────────────────────────────────────────────── */
            <EditPublishedGame
              game={editingGame}
              onBack={() => setEditingGame(null)}
              onSuccess={() => {
                setEditingGame(null);
                refreshData();
              }}
            />
          ) : selectedGame ? (
            /* ── PUBLISH DETAIL VIEW ───────────────────────────────────── */
            <PublishDetails
              game={selectedGame}
              onBack={() => setSelectedGame(null)}
              onSuccess={() => {
                setSelectedGame(null);
                refreshData();
              }}
            />
          ) : (
            /* ── GRID VIEW ─────────────────────────────────────────────── */
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
                      onEdit={setEditingGame} // ← NEW
                      onDelete={handleDelete} // ← NEW
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

// ─────────────────────────────────────────────────────────────────────────────
// SavedItem (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// PublishedItem — now has Edit & Delete buttons
// ─────────────────────────────────────────────────────────────────────────────
const PublishedItem = ({ isDarkMode, game, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const cardBgClass = isDarkMode ? "bg-[#1C1041]/60" : "bg-[#F0F0F0]";
  const thumbnail = `https://app.cobox.co${game.thumbnail}`;

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    await onDelete(game.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden border ${
        isDarkMode ? "border-white/5" : "border-black/5"
      } ${cardBgClass}`}
    >
      {/* Thumbnail */}
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

      {/* Info */}
      <div className="p-3">
        <h4
          className={`font-semibold truncate ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {game.title}
        </h4>
        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400">
          <span>Views: {game.view_count || 0}</span>
          <span>{new Date(game.created_at).toLocaleDateString()}</span>
        </div>

        {/* ── Action buttons ───────────────────────────────────────── */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(game)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition ${
              isDarkMode
                ? "bg-[#8267D2]/20 text-[#8267D2] hover:bg-[#8267D2]/30"
                : "bg-[#8267D2]/10 text-[#8267D2] hover:bg-[#8267D2]/20"
            }`}
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition disabled:opacity-50 ${
              isDarkMode
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-red-100 text-red-500 hover:bg-red-200"
            }`}
          >
            {isDeleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            {isDeleting ? "Removing..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EditPublishedGame — PUT /published-games/:id with optional new thumbnail
// ─────────────────────────────────────────────────────────────────────────────
const EditPublishedGame = ({ game, onBack, onSuccess }) => {
  const { isDarkMode } = useDarkMode();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(game.title || "");
  const [author, setAuthor] = useState(game.author_name || "");
  const [description, setDescription] = useState(game.description || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    `https://app.cobox.co${game.thumbnail}`,
  );
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelClass = isDarkMode ? "text-gray-400" : "text-gray-600";
  const headingClass = isDarkMode ? "text-white" : "text-gray-900";
  const inputBase =
    "w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 outline-none focus:ring-4 focus:ring-[#8267D2]/20";
  const inputTheme = isDarkMode
    ? "bg-[#1C1041] border-[#3D2B7A] text-white placeholder:text-gray-500 focus:border-[#8267D2]"
    : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#8267D2]";

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewThumbFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title is required.");
    if (!author.trim()) return toast.error("Author name is required.");

    setIsSubmitting(true);
    const toastId = toast.loading("Saving changes...");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("authorName", author);
      formData.append("description", description);
      if (newThumbFile) {
        formData.append("thumbnail", newThumbFile);
      }

      await api.put(`/published-games/${game.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Game updated successfully!", { id: toastId });
      onSuccess();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to save changes.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-xs font-bold text-[#8267D2] mb-3 group hover:opacity-80 transition-opacity"
          >
            <ArrowLeft
              size={14}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            Back to published
          </button>
          <h2 className={`text-3xl font-black tracking-tight ${headingClass}`}>
            Edit <span className="text-[#8267D2]">Game</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
            Project ID: {game.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left — Thumbnail */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={14} className="text-[#8267D2]" />
            <label
              className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}
            >
              Cover Image
            </label>
          </div>
          <div
            onClick={() => !isSubmitting && thumbInputRef.current?.click()}
            className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
              previewUrl
                ? "border-solid border-[#8267D2] shadow-lg shadow-[#8267D2]/10"
                : "border-gray-500 hover:border-[#8267D2] bg-gray-500/5"
            }`}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-xs font-bold bg-[#8267D2] px-4 py-2 rounded-full">
                    Change Image
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Upload
                  size={32}
                  className="mx-auto text-gray-500 group-hover:text-[#8267D2] mb-2 transition-colors"
                />
                <p className="text-[10px] font-bold text-gray-500">
                  Click to replace thumbnail
                </p>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={thumbInputRef}
            hidden
            onChange={handleThumbnailChange}
            accept="image/*"
          />
          {newThumbFile && (
            <p className="text-[10px] text-[#8267D2] font-semibold text-center">
              ✓ New thumbnail selected — will be uploaded on save
            </p>
          )}
        </div>

        {/* Right — Metadata */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <label
                className={`text-xs font-bold flex items-center gap-2 ${labelClass}`}
              >
                <Gamepad2 size={14} /> Title{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Gamepad2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Game title"
                  className={`${inputBase} ${inputTheme}`}
                />
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label
                className={`text-xs font-bold flex items-center gap-2 ${labelClass}`}
              >
                <User size={14} /> Creator{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author display name"
                  className={`${inputBase} ${inputTheme}`}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              className={`text-xs font-bold flex items-center gap-2 ${labelClass}`}
            >
              <FileText size={14} /> Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your game..."
              className={`${inputBase} ${inputTheme} pl-4 resize-none`}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full py-4 bg-[#8267D2] text-white font-black text-sm uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-[#8267D2]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PublishDetails (unchanged — for publishing new games from drafts)
// ─────────────────────────────────────────────────────────────────────────────
const PublishDetails = ({ game, onBack, onSuccess }) => {
  const { isDarkMode } = useDarkMode();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(game.name);
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelClass = isDarkMode ? "text-gray-400" : "text-gray-600";
  const headingClass = isDarkMode ? "text-white" : "text-gray-900";
  const inputBase =
    "w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 outline-none focus:ring-4 focus:ring-[#8267D2]/20";
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
    if (!consent) return toast.error("Please accept the legal terms.");

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
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-xs font-bold text-[#8267D2] mb-3 group hover:opacity-80 transition-opacity"
          >
            <ArrowLeft
              size={14}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            Back to selection
          </button>
          <h2 className={`text-3xl font-black tracking-tight ${headingClass}`}>
            Finalize <span className="text-[#8267D2]">Publication</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
            Project ID: {game.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={14} className="text-[#8267D2]" />
            <label
              className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}
            >
              Cover Image <span className="text-red-500">*</span>
            </label>
          </div>
          <div
            onClick={() => !isSubmitting && thumbInputRef.current?.click()}
            className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
              previewUrl
                ? "border-solid border-[#8267D2] shadow-lg shadow-[#8267D2]/10"
                : "border-gray-500 hover:border-[#8267D2] bg-gray-500/5"
            }`}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  alt="Preview"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-xs font-bold bg-[#8267D2] px-4 py-2 rounded-full">
                    Change Image
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Upload
                  size={32}
                  className="mx-auto text-gray-500 group-hover:text-[#8267D2] mb-2 transition-colors"
                />
                <p className="text-[10px] font-bold text-gray-500">
                  Click to upload 16:9 Thumbnail
                </p>
              </div>
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

        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                className={`text-xs font-bold flex items-center gap-2 ${labelClass}`}
              >
                <Gamepad2 size={14} /> Title{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Gamepad2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The name of your masterpiece"
                  className={`${inputBase} ${inputTheme}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                className={`text-xs font-bold flex items-center gap-2 ${labelClass}`}
              >
                <User size={14} /> Creator{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author display name"
                  className={`${inputBase} ${inputTheme}`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              className={`text-xs font-bold flex items-center gap-2 ${labelClass}`}
            >
              <FileText size={14} /> Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the world what your game is about..."
              className={`${inputBase} ${inputTheme} pl-4 resize-none`}
            />
          </div>

          <div
            className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer transition-colors ${
              consent
                ? "bg-[#8267D2]/10 border-[#8267D2]/30"
                : isDarkMode
                  ? "bg-black/20 border-white/5"
                  : "bg-gray-50 border-gray-200"
            }`}
            onClick={() => setConsent(!consent)}
          >
            <div
              className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                consent ? "bg-[#8267D2] border-[#8267D2]" : "border-gray-500"
              }`}
            >
              {consent && <Check size={14} className="text-white font-bold" />}
            </div>
            <div className="space-y-1">
              <p
                className={`text-[11px] font-bold uppercase tracking-tight ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Legal Declaration & Consent
              </p>
              <p className="text-[10px] leading-relaxed text-gray-500">
                I hereby declare that I am the legal owner of this content or
                possess all necessary rights to publish it. I understand that
                any copyright violations may lead to immediate removal and
                account restriction.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-[#8267D2] text-white font-black text-sm uppercase tracking-[2px] rounded-xl flex items-center justify-center gap-3 shadow-xl shadow-[#8267D2]/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Finalizing...
              </>
            ) : (
              "Complete Publication"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Misc helpers
// ─────────────────────────────────────────────────────────────────────────────
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
