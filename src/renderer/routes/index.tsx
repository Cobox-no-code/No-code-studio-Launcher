import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

import { BootstrapScreen } from "@renderer/components/bootstrap/BootstrapScreen";
import { IntroVideos } from "@renderer/components/bootstrap/IntroVideos";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { useBootstrapState } from "@renderer/hooks/useBootstrapState";
import { cobox } from "@renderer/lib/electron";

export const Route = createFileRoute("/")({
  component: BootstrapRoute,
});

function BootstrapRoute() {
  const boot = useBootstrapState();
  const auth = useAuthState();
  const navigate = useNavigate();

  // When bootstrap reaches "ready", route forward based on auth state
  useEffect(() => {
    if (!boot || !auth) return;
    if (boot.phase !== "ready") return;
    if (auth.status === "signed-in") navigate({ to: "/home" });
    else if (auth.status === "signed-out") navigate({ to: "/login" });
  }, [boot, auth, navigate]);

  // Nothing to render yet — state not loaded
  if (!boot) return <MiniSplash />;

  // First-run intro videos
  if (boot.phase === "intro-videos") {
    return <IntroVideos onComplete={() => cobox.bootstrap.markIntroDone()} />;
  }

  // Error state — offer retry
  if (boot.phase === "error") {
    return (
      <div className="fixed inset-0 bg-login-gradient flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="font-display font-bold text-2xl">
            Something went wrong
          </div>
          <div className="text-sm text-text-muted">
            {boot.error ?? boot.gameDownload.error}
          </div>
          <button
            onClick={() => cobox.bootstrap.retry()}
            className="inline-flex h-10 px-6 rounded-pill bg-cta hover:bg-cta-hover text-white font-bold text-sm"
            data-no-drag
          >
            Retry
          </button>
          <button
            onClick={() => cobox.bootstrap.skipToLogin()}
            className="block mx-auto text-xs text-text-muted underline"
            data-no-drag
          >
            Continue anyway
          </button>
        </div>
      </div>
    );
  }

  // Everything else that needs the loading screen
  if (
    boot.phase === "checking" ||
    boot.phase === "game-downloading" ||
    boot.phase === "game-installing" ||
    boot.phase === "launcher-updating"
  ) {
    return <BootstrapScreen state={boot} />;
  }

  // Initializing or ready-and-about-to-route
  return <MiniSplash />;
}

function MiniSplash() {
  return (
    <div className="h-screen bg-login-gradient flex flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="size-20 rounded-xl bg-white flex items-center justify-center shadow-lg"
      >
        <span className="font-display font-black text-[11px] text-bg leading-[1.1] text-center">
          NO
          <br />
          CODE
          <br />
          STUDIO
        </span>
      </motion.div>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="animate-spin" size={14} />
        <span>Preparing…</span>
      </div>
    </div>
  );
}
