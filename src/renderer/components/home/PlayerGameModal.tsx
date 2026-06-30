import placeholder from "@renderer/assets/images/game-thumb-placeholder.png";
import type { CardState } from "@renderer/hooks/usePlayerGames";
import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import type { PlayerGame } from "@renderer/lib/games-api";
import {
  displayInstalls,
  displayRating,
  fmtNum,
  gameThumb,
} from "@renderer/lib/games-api";
import {
  Download,
  Loader2,
  Play,
  RotateCw,
  Share2,
  Star,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface Props {
  game: PlayerGame;
  state?: CardState;
  onClose: () => void;
  onShare?: (g: PlayerGame) => void;
  onInstall?: (g: PlayerGame) => void;
  onPlay?: (g: PlayerGame) => void;
  onRetry?: (g: PlayerGame) => void;
}

export function PlayerGameModal({
  game,
  state,
  onClose,
  onShare,
  onInstall,
  onPlay,
  onRetry,
}: Props) {
  const [imgErr, setImgErr] = useState(false);

  // Live rating — seeded from the game, then replaced by the /rate response.
  const [avg, setAvg] = useState<number>(displayRating(game));
  const [count, setCount] = useState<number>(game.rating_count ?? 0);
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

  const primary = (() => {
    switch (state?.phase) {
      case "installed":
        return {
          label: "Play",
          icon: <Play size={13} fill="white" />,
          onClick: () => onPlay?.(game),
          className: "bg-cta hover:bg-cta-hover",
          disabled: false,
        };
      case "downloading":
        return {
          label: `${Math.round(state.percent)}%`,
          icon: <Loader2 size={13} className="animate-spin" />,
          onClick: () => {},
          className: "bg-brand-700/60 cursor-default",
          disabled: true,
        };
      case "error":
        return {
          label: "Retry",
          icon: <RotateCw size={13} />,
          onClick: () => onRetry?.(game),
          className: "bg-danger/80 hover:bg-danger",
          disabled: false,
        };
      default:
        return {
          label: "Install",
          icon: <Download size={13} />,
          onClick: () => onInstall?.(game),
          className: "bg-brand-700 hover:bg-brand-500",
          disabled: false,
        };
    }
  })();

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
          {/* Hero */}
          <div className="relative aspect-video bg-black/40 overflow-hidden">
            <img
              src={!imgErr ? gameThumb(game, placeholder) : placeholder}
              alt={game.title}
              draggable={false}
              className="w-full h-full object-cover"
              onError={() => setImgErr(true)}
            />
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-2 right-2 size-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition"
            >
              <X size={16} />
            </button>
            <div className="absolute top-2 left-2 flex gap-1">
              {game.is_featured && (
                <span className="flex items-center gap-0.5 px-1.5 py-[2px] bg-brand-700 text-white text-[9px] font-bold tracking-wider rounded-sm">
                  <Zap size={8} /> FEATURED
                </span>
              )}
              {game.is_reward_eligible && (
                <span className="flex items-center gap-0.5 px-1.5 py-[2px] bg-yellow-500 text-black text-[9px] font-bold tracking-wider rounded-sm">
                  <Trophy size={8} /> EARN
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-tight truncate">
                  {game.title}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  by {game.display_name || game.creator_name}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-text-secondary">
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star size={13} className="text-yellow-400 fill-yellow-400" />
                  {avg.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm">
                  <Download size={13} />
                  {fmtNum(displayInstalls(game))}
                </span>
              </div>
            </div>

            {(game.description || game.short_description || game.genre) && (
              <p className="text-xs text-text-muted mt-3 leading-relaxed whitespace-pre-wrap line-clamp-4">
                {game.description || game.short_description || game.genre}
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
                {count > 0 && (
                  <span className="text-xs text-text-muted ml-1">
                    {fmtNum(count)} rating{count === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {rateError && (
                <p className="text-[11px] text-danger mt-2">{rateError}</p>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={primary.onClick}
                disabled={primary.disabled}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 h-10 rounded-md text-white text-sm font-bold transition-colors",
                  primary.className,
                )}
              >
                {primary.icon}
                {primary.label}
              </button>
              {onShare && (
                <button
                  type="button"
                  onClick={() => onShare(game)}
                  aria-label="Share"
                  className="size-10 flex items-center justify-center rounded-md border border-border-strong text-text-secondary hover:text-white hover:border-brand-700/60 transition-colors"
                >
                  <Share2 size={15} />
                </button>
              )}
            </div>

            {state?.phase === "error" && state.error && (
              <p className="text-[11px] text-danger mt-2 truncate">
                {state.error}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
