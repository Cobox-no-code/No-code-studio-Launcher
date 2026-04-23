import placeholder from "@renderer/assets/images/game-thumb-placeholder.png";
import type { CardState } from "@renderer/hooks/usePlayerGames";
import { cn } from "@renderer/lib/cn";
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
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Props {
  game: PlayerGame;
  state: CardState;
  onShare: (g: PlayerGame) => void;
  onOpen?: (g: PlayerGame) => void;
  onInstall: (g: PlayerGame) => void;
  onPlay: (g: PlayerGame) => void;
  onRetry: (g: PlayerGame) => void;
}

export function GameCard({
  game,
  state,
  onShare,
  onOpen,
  onInstall,
  onPlay,
  onRetry,
}: Props) {
  const [imgErr, setImgErr] = useState(false);
  const rating = displayRating(game);
  const installs = displayInstalls(game);

  const primaryAction = (() => {
    switch (state.phase) {
      case "installed":
        return {
          label: "Play",
          icon: <Play size={10} fill="white" />,
          onClick: () => onPlay(game),
          className: "bg-cta hover:bg-cta-hover",
          disabled: false,
        };
      case "downloading":
        return {
          label: `${Math.round(state.percent)}%`,
          icon: <Loader2 size={10} className="animate-spin" />,
          onClick: () => {},
          className: "bg-brand-700/60 cursor-default",
          disabled: true,
        };
      case "error":
        return {
          label: "Retry",
          icon: <RotateCw size={10} />,
          onClick: () => onRetry(game),
          className: "bg-danger/80 hover:bg-danger",
          disabled: false,
        };
      case "idle":
      default:
        return {
          label: "Install",
          icon: <Download size={10} />,
          onClick: () => onInstall(game),
          className: "bg-brand-700 hover:bg-brand-500",
          disabled: false,
        };
    }
  })();

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded",
        " bg-[] border border-border hover:border-brand-700/60",
        "transition-all duration-200",
      )}
    >
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => onOpen?.(game)}
        data-no-drag
        className="block w-full relative aspect-video overflow-hidden bg-black/40"
      >
        <img
          src={!imgErr ? gameThumb(game, placeholder) : placeholder}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          onError={() => setImgErr(true)}
        />

        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {game.is_featured && (
            <span className="flex items-center gap-0.5 px-1 py-[1px] bg-brand-700 text-white text-[8px] font-bold tracking-wider rounded-sm">
              <Zap size={7} /> FEAT
            </span>
          )}
          {game.is_reward_eligible && (
            <span className="flex items-center gap-0.5 px-1 py-[1px] bg-yellow-500 text-black text-[8px] font-bold tracking-wider rounded-sm">
              <Trophy size={7} /> EARN
            </span>
          )}
        </div>

        {/* Installed chip */}
        {state.phase === "installed" && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-[1px] bg-black/60 border border-success/40 rounded-sm text-[8px] font-bold text-success tracking-wider">
            INSTALLED
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </button>

      {/* Title + creator + inline stats */}
      <div className="px-2.5 pt-2 pb-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold truncate leading-tight">
            {game.title}
          </div>
          <div className="text-[10px] text-text-muted truncate leading-tight mt-0.5">
            by {game.display_name || game.creator_name}
          </div>
        </div>

        <div className="flex items-center gap-2 text-text-muted shrink-0 text-[10px]">
          <span className="flex items-center gap-0.5">
            <Star size={9} className="text-yellow-400 fill-yellow-400" />
            {rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5">
            <Download size={9} />
            {fmtNum(installs)}
          </span>
        </div>
      </div>

      {/* Download progress bar — only when downloading */}
      {state.phase === "downloading" && (
        <div className="px-2.5 -mt-0.5 mb-1.5">
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-[width] duration-300"
              style={{ width: `${state.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-2.5 pb-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          data-no-drag
          className={cn(
            "flex-1 flex items-center justify-center gap-1 h-7 rounded text-white text-[11px] font-bold transition-colors",
            primaryAction.className,
          )}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
        <button
          type="button"
          onClick={() => onShare(game)}
          data-no-drag
          aria-label="Share"
          className={cn(
            "size-7 flex items-center justify-center rounded",
            "border border-border-strong text-text-secondary hover:text-white hover:border-brand-700/60 transition-colors",
          )}
        >
          <Share2 size={10} />
        </button>
      </div>

      {/* Error line */}
      {state.phase === "error" && state.error && (
        <div className="px-2.5 pb-2.5 -mt-2 text-[9px] text-danger truncate">
          {state.error}
        </div>
      )}
    </div>
  );
}
