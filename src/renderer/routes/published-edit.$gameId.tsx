import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import {
  PublishForm,
  type PublishFormValues,
} from "@renderer/components/creator/PublishForm";
import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cobox } from "@renderer/lib/electron";
import { fetchPublishedGame } from "@renderer/lib/published-api";
import type { PublishedGame } from "../../shared/types/publish";

export const Route = createFileRoute("/published-edit/$gameId")({
  component: EditPublishedPage,
});

function EditPublishedPage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const { gameId } = useParams({ from: "/published-edit/$gameId" });

  const [game, setGame] = useState<PublishedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth?.status, navigate]); // primitive dep

  useEffect(() => {
    if (auth?.status !== "signed-in") return;
    void (async () => {
      try {
        const g = await fetchPublishedGame(gameId);
        setGame(g);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [auth?.status, gameId]);

  if (auth?.status !== "signed-in") return null;

  const handleSubmit = async (values: PublishFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      let newThumbnailPath: string | undefined;

      if (values.thumbnailFile) {
        const bytes = new Uint8Array(await values.thumbnailFile.arrayBuffer());
        const staged = await cobox.publish.stageThumbnail({
          bytes,
          originalName: values.thumbnailFile.name,
          mimeType: values.thumbnailFile.type || "image/png",
        });
        newThumbnailPath = staged.filePath;
      }

      const res = await cobox.publish.update({
        gameId,
        metadata: {
          title: values.title,
          description: values.description,
          categoryId: values.categoryId,
        },
        newThumbnailPath,
      });
      if (!res.success) throw new Error(res.error ?? "Update failed");

      navigate({ to: "/published" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthedShell bleed>
      <div className="h-full flex flex-col bg-[#080609]">
        <div className="px-8 pt-4">
          <button
            onClick={() => navigate({ to: "/saved" })}
            data-no-drag
            className=" items-center gap-1 text-xs text-text-muted size-10 bg-white rounded-full flex justify-center   hover:text-black transition"
          >
            <ArrowLeft size={25} />
          </button>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-text-muted">
              Loading…
            </div>
          ) : !game ? (
            <div className="h-full flex items-center justify-center text-sm text-danger">
              {error ?? "Game not found"}
            </div>
          ) : (
            <PublishForm
              mode="edit"
              projectId={game.game_id}
              submitting={submitting}
              initial={{
                title: game.title,
                description: game.description ?? "",
                categoryId: game.category_id ?? "",
                thumbnailUrl: game.thumbnail_url,
              }}
              onSubmit={handleSubmit}
              onCancel={() => navigate({ to: "/published" })}
            />
          )}
        </div>

        {error && (
          <div className="px-8 pb-4">
            <div className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-md p-3">
              {error}
            </div>
          </div>
        )}
      </div>
    </AuthedShell>
  );
}
