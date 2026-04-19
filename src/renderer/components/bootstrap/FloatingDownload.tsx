import { motion, AnimatePresence } from "motion/react";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useBootstrapState } from "@renderer/hooks/useBootstrapState";
import { cn } from "@renderer/lib/cn";

/**
 * Bottom-right floating card. Appears whenever a background game download
 * is actively running (or recently finished). Auto-hides when idle.
 */
export function FloatingDownload() {
  const boot = useBootstrapState();
  if (!boot) return null;

  const g = boot.gameDownload;
  const visible =
    g.status === "downloading" ||
    g.status === "extracting" ||
    g.status === "error" ||
    (g.status === "installed" && g.percent === 100 && showRecentlyFinished());

  if (!visible) return null;

  const percent = Math.round(g.percent);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "fixed bottom-5 right-5 z-40",
          "w-[320px] rounded-lg border border-border-strong bg-surface-2/90 backdrop-blur-xl shadow-lg p-4",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "size-9 rounded-md flex items-center justify-center shrink-0",
              g.status === "error"
                ? "bg-danger/20 text-danger"
                : g.status === "installed"
                  ? "bg-success/20 text-success"
                  : "bg-cta/20 text-cta",
            )}
          >
            {g.status === "error" ? (
              <AlertCircle size={18} />
            ) : g.status === "installed" ? (
              <CheckCircle2 size={18} />
            ) : (
              <Download size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {g.status === "error" && "Download failed"}
              {g.status === "downloading" && "No Code Studio"}
              {g.status === "extracting" && "Installing…"}
              {g.status === "installed" && "Ready to launch"}
            </div>
            <div className="text-xs text-text-muted truncate">
              {g.status === "downloading" &&
                `v${g.targetVersion ?? ""} · ${percent}%`}
              {g.status === "extracting" && "Unpacking files…"}
              {g.status === "error" && (g.error ?? "Unknown error")}
              {g.status === "installed" && "Installed successfully"}
            </div>
          </div>
        </div>

        {(g.status === "downloading" || g.status === "extracting") && (
          <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cta transition-[width] duration-500"
              style={{
                width: g.status === "extracting" ? "100%" : `${percent}%`,
                animation:
                  g.status === "extracting"
                    ? "pulse 1.2s ease-in-out infinite"
                    : undefined,
              }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Keep the "installed" chip visible for 4s after completion, then auto-hide.
// Keep simple — a module-level timestamp tracked per mount.
let finishedAt: number | null = null;
function showRecentlyFinished() {
  if (finishedAt === null) finishedAt = Date.now();
  return Date.now() - finishedAt < 4_000;
}
