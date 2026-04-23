import { cn } from "@renderer/lib/cn";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import type {
  PublishedGame,
  PublishedStatus,
} from "../../../shared/types/publish";

interface Props {
  game: PublishedGame;
  onEdit?: () => void;
  onDelete?: () => void;
}

function avatarFor(seed: string): string {
  const enc = encodeURIComponent(seed || "game");
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${enc}`;
}

const STATUS_STYLES: Record<
  PublishedStatus,
  { label: string; cls: string; dot: string }
> = {
  live: {
    label: "LIVE",
    cls: "bg-success/15 text-success border-success/40",
    dot: "bg-success",
  },
  pending: {
    label: "PENDING",
    cls: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
    dot: "bg-yellow-400",
  },
  rejected: {
    label: "REJECTED",
    cls: "bg-danger/15 text-danger border-danger/40",
    dot: "bg-danger",
  },
  draft: {
    label: "DRAFT",
    cls: "bg-white/5 text-text-muted border-border-strong",
    dot: "bg-text-muted",
  },
  suspended: {
    label: "SUSPENDED",
    cls: "bg-orange-400/15 text-orange-300 border-orange-400/40",
    dot: "bg-orange-400",
  },
};

export function PublishedCard({ game, onEdit, onDelete }: Props) {
  const fallback = useMemo(() => avatarFor(game.title), [game.title]);
  const thumb = game.thumbnail_url || fallback;
  const status = STATUS_STYLES[game.status] ?? STATUS_STYLES.draft;

  return (
    <div
      className={cn(
        "rounded overflow-hidden border border-border",
        "bg-surface-1/60 hover:border-brand-700/60 transition-colors",
      )}
    >
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
        {/* Status badge */}
        <div
          className={cn(
            "absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-[1px] border rounded-sm",
            "text-[9px] font-bold tracking-wider",
            status.cls,
          )}
        >
          <span className={cn("size-1.5 rounded-full", status.dot)} />
          {status.label}
        </div>
      </div>

      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="text-[12px] font-semibold truncate flex-1">
          {game.title}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            data-no-drag
            aria-label="Edit"
            className={cn(
              "h-6 px-2.5 rounded-md border border-border-strong",
              "text-[11px] font-semibold text-text-secondary hover:text-white hover:border-brand-700/60 transition",
              "inline-flex items-center gap-1",
            )}
          >
            <Pencil size={10} />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            data-no-drag
            aria-label="Delete"
            className={cn(
              "h-6 px-2.5 rounded-md",
              "bg-cta hover:bg-cta-hover text-white text-[11px] font-bold transition",
              "inline-flex items-center gap-1",
            )}
          >
            <Trash2 size={10} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
