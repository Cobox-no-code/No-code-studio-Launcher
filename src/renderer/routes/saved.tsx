import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";

import { SavedCard } from "@renderer/components/creator/SavedCard";
import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { useLocalLibrary } from "@renderer/hooks/useLocalLibrary";
import type { LocalLibraryGame } from "../../shared/types/game";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
});

function SavedPage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const { games, loading, refresh } = useLocalLibrary();

  const [editing, setEditing] = useState<LocalLibraryGame | null>(null);
  const [publishing, setPublishing] = useState<LocalLibraryGame | null>(null);

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth, navigate]);

  if (auth?.status !== "signed-in") return null;

  // Empty grid cells match the screenshot's 4×4 look even when list is small
  const MIN_CELLS = 16;
  const cells = Math.max(games.length, MIN_CELLS);
  const filler = Array.from({ length: Math.max(0, cells - games.length) });
  const handlePublish = (game: LocalLibraryGame) => {
    // Route param is the sav filename (URL-safe) so we can reload it later
    const encoded = encodeURIComponent(game.fileName);
    navigate({ to: `/publish/new/${encoded}` });
  };

  return (
    <AuthedShell>
      <div className="h-full overflow-auto p-3 bg-[#080609]">
        {loading ? (
          <SavedSkeleton />
        ) : games.length === 0 ? (
          <EmptyLibrary />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
            {games.map((g) => (
              <SavedCard key={g.id} game={g} onPublish={handlePublish} />
            ))}
            {/* Quiet placeholder cells to preserve the grid density in the design */}
            {filler.map((_, i) => (
              <PlaceholderCell key={`empty-${i}`} />
            ))}
          </div>
        )}
      </div>

      {/* TODO: Edit + Publish modals next phase */}
      {editing && (
        <ConsoleStub
          title={`Edit: ${editing.name}`}
          onClose={() => setEditing(null)}
        />
      )}
      {publishing && (
        <ConsoleStub
          title={`Publish: ${publishing.name}`}
          onClose={() => {
            setPublishing(null);
            void refresh();
          }}
        />
      )}
    </AuthedShell>
  );
}

function PlaceholderCell() {
  return (
    <div className="aspect-[4/3] rounded-md border border-border bg-surface-1/40 opacity-50 pointer-events-none" />
  );
}

function EmptyLibrary() {
  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center">
      <FolderOpen size={40} className="text-text-muted/40 mb-4" />
      <h3 className="font-display font-bold text-lg">No saved games yet</h3>
      <p className="text-text-muted text-sm mt-1 max-w-sm">
        Games you create in No Code Studio will appear here. Use the sidebar to
        start a new world or game.
      </p>
    </div>
  );
}

function SavedSkeleton() {
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

/**
 * Temporary stub — replaced by proper Edit/Publish modals in the next phase.
 */
function ConsoleStub({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#080609]"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-xl bg-surface-1 border border-border-strong p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-display font-bold text-lg mb-2">{title}</div>
        <p className="text-sm text-text-muted">
          This flow is wired in the next phase (publish metadata form + API).
        </p>
        <button
          onClick={onClose}
          className="mt-4 h-9 px-5 rounded-pill bg-brand-700 hover:bg-brand-500 text-white text-xs font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
