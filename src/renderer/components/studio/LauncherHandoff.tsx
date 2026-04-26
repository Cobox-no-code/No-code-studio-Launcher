import { motion, AnimatePresence } from "motion/react";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cobox } from "@renderer/lib/electron";
import { Button } from "@renderer/components/ui/Button";
import type { StudioIntent } from "../../../shared/types/game";

type Phase = "idle" | "launching" | "launched" | "error";

interface Props {
  open: boolean;
  intent: StudioIntent | null;
  onClose: () => void;
}

/**
 * Handoff modal — writes intent to worker.json, spawns the studio,
 * shows friendly progress while Electron hands control off.
 */
export function LauncherHandoff({ open, intent, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [alreadyRunning, setAlreadyRunning] = useState(false);
  const didLaunchRef = useRef(false);

useEffect(() => {
    if (!open || !intent) {
      setPhase("idle");
      setError(null);
      setAlreadyRunning(false);
      didLaunchRef.current = false;
      return;
    }

    if (didLaunchRef.current) return;
    didLaunchRef.current = true;

    let mounted = true;
    const run = async () => {
      setPhase("launching");
      setError(null);
      setAlreadyRunning(false);

      // Tiny delay so the modal is visible even if launch is instant
      await new Promise((r) => setTimeout(r, 400));

      const res = await cobox.games.launchWithIntent({ intent });
      if (!mounted) return;

      if (res.success) {
        setAlreadyRunning(!!res.alreadyRunning);
        setPhase("launched");
        setTimeout(
          () => mounted && onClose(),
          res.alreadyRunning ? 1500 : 2000,
        );
      } else {
        setPhase("error");
        setError(res.error ?? "Could not launch No Code Studio");
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [open, intent]);
  const title =
    intent === "world"
      ? "Opening World Builder"
      : intent === "game"
        ? "Opening Game Builder"
        : "Opening No Code Studio";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(12px)",
          }}
          onClick={phase === "error" ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-[420px] rounded-xl bg-surface-1 border border-border-strong p-8 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === "error" && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-text-muted hover:text-white transition"
                data-no-drag
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}

            <div className="flex flex-col items-center gap-5 text-center">
              <div
                className={`size-14 rounded-full flex items-center justify-center ${
                  phase === "launched"
                    ? "bg-success/15 text-success"
                    : phase === "error"
                      ? "bg-danger/15 text-danger"
                      : "bg-cta/15 text-cta"
                }`}
              >
                {phase === "launched" ? (
                  <CheckCircle2 size={24} />
                ) : phase === "error" ? (
                  <AlertCircle size={24} />
                ) : (
                  <Loader2 size={24} className="animate-spin" />
                )}
              </div>

              <div>
                <h2 className="font-display font-bold text-lg tracking-wide">
                  {phase === "launched"
                    ? alreadyRunning
                      ? "Studio is already open"
                      : "No Code Studio opened"
                    : phase === "error"
                      ? "Couldn't open the studio"
                      : title}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {phase === "launched" &&
                    (alreadyRunning
                      ? "Switch to the Studio window to continue."
                      : "You can close this and continue in the studio.")}
                  {phase === "error" && (error ?? "Unknown error")}
                  {phase === "launching" &&
                    "Preparing your workspace and launching…"}
                </p>
              </div>

              {phase === "error" && (
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={onClose} size="sm">
                    Close
                  </Button>
                  <Button
                    variant="cta"
                    size="sm"
                    onClick={() => {
                      setPhase("launching");
                      setError(null);
                      setAlreadyRunning(false);
                      if (intent) {
                        void cobox.games
                          .launchWithIntent({ intent })
                          .then((r) => {
                            if (r.success) {
                              setAlreadyRunning(!!r.alreadyRunning);
                              setPhase("launched");
                              setTimeout(
                                onClose,
                                r.alreadyRunning ? 1500 : 2000,
                              );
                            } else {
                              setPhase("error");
                              setError(r.error ?? "Launch failed");
                            }
                          });
                      }
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}