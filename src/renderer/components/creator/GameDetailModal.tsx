import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import { Download, Pencil, Star, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { PublishedGame } from "../../../shared/types/publish";

interface Props {
  game: PublishedGame;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function avatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed || "game")}`;
}

function toNum(v: string | number | undefined): number {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function GameDetailModal({ game, onClose, onEdit, onDelete }: Props) {
  const fallback = useMemo(() => avatarFor(game.title), [game.title]);
  const thumb = game.thumbnail_url || fallback;

  // Live rating state — seeded from the game, updated from the /rate response.
  const [avg, setAvg] = useState<number>(toNum(game.rating_avg));
  const [count, setCount] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Fire the view event exactly once when the modal opens.
  useEffect(() => {
    void cobox.tracker.view(game.game_id);
  }, [game.game_id]);

  const submitRating = async (value: number) => {
    if (submitting) return;
    setSubmitting(true);
    setRateError(null);
    setMyRating(value); // optimistic
    try {
      const res = await cobox.tracker.rate(game.game_id, value);
      if (res.success) {
        if (typeof res.new_avg === "number") setAvg(res.new_avg);
        if (typeof res.rating_count === "number") setCount(res.rating_count);
      } else {
        setRateError("Couldn't save rating. Are you signed in?");
        setMyRating(0);
      }
    } catch {
      setRateError("Couldn't save rating. Try again.");
      setMyRating(0);
    } finally {
      setSubmitting(false);
    }
  };

  const displayStars = hover || myRating;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-surface-1 border border-border-strong rounded-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero thumbnail */}
          <div className="relative aspect-video bg-black/40 overflow-hidden">
            <img
              src={thumb}
              alt={game.title}
              draggable={false}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = fallback;
              }}
            />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-2 right-2 size-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition"
            >
              <X size={16} />
            </button>
            {game.type && (
              <span className="absolute top-2 left-2 px-2 py-[2px] rounded-sm bg-black/60 text-[10px] font-bold tracking-wider text-white uppercase">
                {game.type}
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold leading-tight">{game.title}</h3>
              <div className="flex items-center gap-3 shrink-0 text-text-secondary">
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star size={13} className="text-yellow-400 fill-yellow-400" />
                  {avg.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm">
                  <Download size={13} />
                  {game.install_count ?? 0}
                </span>
              </div>
            </div>

            {(game.category_name || game.description) && (
              <p className="text-xs text-text-muted mt-2 leading-relaxed whitespace-pre-wrap">
                {game.description || game.category_name}
              </p>
            )}

            {/* ── Rating picker ── */}
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-[10px] font-bold tracking-[0.15em] text-text-muted mb-2">
                {myRating ? "YOUR RATING" : "RATE THIS GAME"}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHover(0)}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={submitting}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => void submitRating(n)}
                      aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      className={cn(
                        "transition-transform",
                        !submitting && "hover:scale-110",
                        submitting && "opacity-60 cursor-default",
                      )}
                    >
                      <Star
                        size={26}
                        className={cn(
                          "transition-colors",
                          n <= displayStars
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-text-muted/40",
                        )}
                      />
                    </button>
                  ))}
                </div>
                {count !== null && (
                  <span className="text-xs text-text-muted ml-1">
                    {count} rating{count === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {rateError && (
                <p className="text-[11px] text-danger mt-2">{rateError}</p>
              )}
            </div>

            {/* Optional actions */}
            {(onEdit || onDelete) && (
              <div className="mt-5 flex items-center justify-end gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="h-8 px-3 rounded-md border border-border-strong text-xs font-semibold text-text-secondary hover:text-white hover:border-brand-700/60 transition inline-flex items-center gap-1.5"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="h-8 px-3 rounded-md bg-cta hover:bg-cta-hover text-white text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
