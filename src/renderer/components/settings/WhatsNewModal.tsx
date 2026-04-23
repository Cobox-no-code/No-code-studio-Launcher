import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, Tag, ExternalLink } from "lucide-react";
import { cobox } from "@renderer/lib/electron";
import { fetchReleases, type GHRelease } from "@renderer/lib/changelog";

// Set these to your release repo. Public repo required for unauth'd fetch.
const OWNER = "Cobox-no-code";
const REPO = "No-code-studio-Launcher";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WhatsNewModal({ open, onClose }: Props) {
  const [releases, setReleases] = useState<GHRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchReleases(OWNER, REPO, 10)
      .then(setReleases)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-6"
          style={{
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(12px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl max-h-[80vh] flex flex-col rounded-xl bg-surface-1 border border-border-strong shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-bold text-base">What's new</h2>
              <button
                onClick={onClose}
                data-no-drag
                aria-label="Close"
                className="text-text-muted hover:text-white transition p-1 rounded-md hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                  <Loader2 size={20} className="animate-spin mb-2" />
                  <span className="text-xs">Loading changelog…</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-sm text-danger">
                  {error}
                </div>
              ) : releases.length === 0 ? (
                <div className="text-center py-12 text-sm text-text-muted">
                  No releases yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {releases.map((r) => (
                    <ReleaseEntry key={r.id} release={r} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReleaseEntry({ release }: { release: GHRelease }) {
  const date = new Date(release.published_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="pb-5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <Tag size={12} className="text-brand-300" />
        <span className="font-display font-bold text-sm">
          {release.name || release.tag_name}
        </span>
        {release.prerelease && (
          <span className="text-[9px] px-1.5 py-0.5 bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 rounded tracking-wider font-bold">
            PRE-RELEASE
          </span>
        )}
        <span className="text-[11px] text-text-muted ml-auto">{date}</span>
      </div>

      <div className="text-[12px] text-text-secondary whitespace-pre-wrap leading-relaxed">
        {release.body || "No description provided."}
      </div>

      <button
        onClick={() => cobox.auth.openExternal(release.html_url)}
        data-no-drag
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-300 hover:text-white transition"
      >
        View on GitHub
        <ExternalLink size={10} />
      </button>
    </div>
  );
}
