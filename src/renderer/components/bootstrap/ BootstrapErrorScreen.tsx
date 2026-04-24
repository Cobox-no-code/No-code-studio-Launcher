import { motion } from "motion/react";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cobox } from "@renderer/lib/electron";

export function BootstrapErrorScreen({ error }: { error: string | null }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await cobox.bootstrap.retry();
    setRetrying(false);
  };

  const isPlatformError = error?.toLowerCase().includes("requires windows");
  const isNetworkError =
    error?.toLowerCase().includes("internet") ||
    error?.toLowerCase().includes("reach cobox");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen bg-gradient-to-b from-[#0F0116] to-[#1A0632] flex items-center justify-center p-10"
    >
      <div className="max-w-md w-full text-center">
        <div className="size-16 mx-auto rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center mb-5">
          <AlertTriangle size={24} className="text-danger" />
        </div>

        <h1 className="font-display font-black text-2xl mb-3">
          Something went wrong
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed mb-6 break-words">
          {error ?? "An unexpected error occurred during setup."}
        </p>

        {!isPlatformError && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            data-no-drag
            className="inline-flex items-center gap-2 h-10 px-6 rounded-md bg-cta hover:bg-cta-hover text-white text-sm font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={retrying ? "animate-spin" : ""} />
            {retrying ? "Retrying…" : "Retry"}
          </button>
        )}

        {isNetworkError && (
          <div className="mt-5 text-xs text-text-muted">
            Can't reach the internet? Check your Wi-Fi and try again.
          </div>
        )}

        {isPlatformError && (
          <div className="mt-5 space-y-3">
            <p className="text-xs text-text-muted">
              This launcher is currently Windows-only. To test on another
              platform, use the web version.
            </p>
            <button
              onClick={() => cobox.auth.openExternal("https://cobox.games")}
              data-no-drag
              className="inline-flex items-center gap-1 text-xs text-brand-300 hover:text-white transition"
            >
              Open cobox.games
              <ExternalLink size={11} />
            </button>
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-border text-[10px] text-text-muted">
          <div>Cobox Launcher v2.0.0-alpha.0</div>
        </div>
      </div>
    </motion.div>
  );
}
