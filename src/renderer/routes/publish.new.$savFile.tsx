import { useToast } from "@renderer/components/ui/Toaster";
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
import { useLocalLibrary } from "@renderer/hooks/useLocalLibrary";
import { cobox } from "@renderer/lib/electron";
import type { LocalLibraryGame } from "../../shared/types/game";

export const Route = createFileRoute("/publish/new/$savFile")({
  component: PublishNewPage,
});

function PublishNewPage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const { savFile } = useParams({ from: "/publish/new/$savFile" });
  const decoded = decodeURIComponent(savFile);
  const { push: toast } = useToast();
  const { games } = useLocalLibrary();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<LocalLibraryGame | null>(null);

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth, navigate]);

  useEffect(() => {
    const found = games.find((g) => g.fileName === decoded);
    if (found) setGame(found);
  }, [games, decoded]);

  if (auth?.status !== "signed-in") return null;
  if (!game) {
    return (
      <AuthedShell>
        <div className="h-full flex items-center justify-center text-sm text-text-muted">
          Locating save file…
        </div>
      </AuthedShell>
    );
  }

  const handleSubmit = async (values: PublishFormValues) => {
    if (!values.thumbnailFile) return;
    setSubmitting(true);
    setError(null);
    try {
      const bytes = new Uint8Array(await values.thumbnailFile.arrayBuffer());
      const staged = await cobox.publish.stageThumbnail({
        bytes,
        originalName: values.thumbnailFile.name,
        mimeType: values.thumbnailFile.type || "image/png",
      });

      const res = await cobox.publish.publishDirect({
        filePath: game.path,
        thumbnailPath: staged.filePath, // ← new field
        metadata: {
          title: values.title,
          description: values.description,
          categoryId: values.categoryId,
        },
      });
      if (!res.success) throw new Error(res.error ?? "Publish failed");
      toast({
        kind: "success",
        title: "Game published",
        body: `"${values.title}" is pending review.`,
      });

      navigate({ to: "/published" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      setError(msg);
      toast({ kind: "error", title: "Publish failed", body: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!game) {
    return (
      <AuthedShell>
        <div className="h-full flex items-center justify-center text-sm text-text-muted">
          Locating save file…
        </div>
      </AuthedShell>
    );
  }

  // Pre-fill title with the user's chosen save name (title-cased)
  const suggestedTitle = game.name
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");

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
          <PublishForm
            mode="new"
            submitting={submitting}
            initial={{ title: suggestedTitle }}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/saved" })}
          />
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
