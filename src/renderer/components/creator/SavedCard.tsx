import { cn } from "@renderer/lib/cn";
import { useMemo } from "react";
import type { LocalLibraryGame } from "../../../shared/types/game";

interface Props {
  game: LocalLibraryGame;
  onPublish?: (g: LocalLibraryGame) => void;
}

function avatarFor(seed: string): string {
  const enc = encodeURIComponent(seed || "game");
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${enc}`;
}

export function SavedCard({ game, onPublish }: Props) {
  const thumb = useMemo(() => avatarFor(game.name), [game.name]);

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden border border-border",
        "bg-surface-1/60 hover:border-brand-700/60 transition-colors",
      )}
    >
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        <img
          src={thumb}
          alt={game.name}
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold truncate flex-1">
          {game.name}
        </div>
        <button
          type="button"
          onClick={() => onPublish?.(game)}
          data-no-drag
          className={cn(
            "h-6 px-3 rounded-md text-[11px] font-bold text-white shrink-0",
            "bg-cta hover:bg-cta-hover transition-colors",
          )}
        >
          Publish now
        </button>
      </div>
    </div>
  );
}
