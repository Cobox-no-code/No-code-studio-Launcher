import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderOpen, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PublishedCard } from "@renderer/components/creator/PublishedCard";
import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cobox } from "@renderer/lib/electron";
import type { PublishedGame } from "../../shared/types/publish";

export const Route = createFileRoute("/published")({
  component: PublishedPage,
});

function PublishedPage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PublishedGame | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await cobox.publish.listMine();
      setGames(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth?.status, navigate]);

  useEffect(() => {
    if (auth?.status === "signed-in") void refresh();
  }, [auth?.status, refresh]);

  if (auth?.status !== "signed-in") return null;

  const MIN_CELLS = 16;
  const cells = Math.max(games.length, MIN_CELLS);
  const filler = Array.from({ length: Math.max(0, cells - games.length) });

  return (
    <AuthedShell>
      <div className="h-full overflow-auto p-3 bg-[#080609]">
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : games.length === 0 ? (
          <EmptyPublished />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
            {games.map((g) => (
              <PublishedCard
                key={g.game_id}
                game={g}
                onEdit={() => {
                  navigate({ to: `/published-edit/${g.game_id}` });
                }}
                onDelete={() => setDeleting(g)}
              />
            ))}
            {filler.map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-[4/3] rounded-md border border-border bg-surface-1/40 opacity-50 pointer-events-none"
              />
            ))}
          </div>
        )}
      </div>

      {deleting && (
        <DeleteDialog
          game={deleting}
          onConfirm={async () => {
            try {
              const res = await cobox.publish.delete(deleting.game_id);
              if (!res.success) throw new Error(res.error ?? "Delete failed");
              setDeleting(null);
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Delete failed");
              setDeleting(null);
            }
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </AuthedShell>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-1/60 border border-border rounded-md overflow-hidden animate-pulse"
        >
          <div className="aspect-video bg-white/5" />
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div className="h-3 bg-white/8 w-1/2 rounded" />
            <div className="h-5 bg-white/5 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPublished() {
  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center">
      <FolderOpen size={40} className="text-text-muted/40 mb-4" />
      <h3 className="font-display font-bold text-lg">No published games yet</h3>
      <p className="text-text-muted text-sm mt-1 max-w-sm">
        Go to Saved and publish a game. It'll appear here once accepted.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="text-sm text-danger">{message}</div>
      <button
        onClick={onRetry}
        className="mt-3 h-8 px-4 rounded-pill bg-brand-700 hover:bg-brand-500 text-white text-xs font-bold"
      >
        Retry
      </button>
    </div>
  );
}

function DeleteDialog({
  game,
  onConfirm,
  onCancel,
}: {
  game: PublishedGame;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onCancel}
    >
      <div
        className="w-[420px] rounded-xl bg-surface-1 border border-border-strong p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-display font-bold text-lg">Delete game?</div>
        <p className="mt-2 text-sm text-text-muted">
          “{game.title}” will be removed from the live server. This cannot be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="h-9 px-4 rounded-pill border border-border-strong text-xs font-bold hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setPending(true);
              onConfirm();
            }}
            disabled={pending}
            className="h-9 px-4 rounded-pill bg-danger hover:opacity-90 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            {pending && <Loader2 size={12} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
