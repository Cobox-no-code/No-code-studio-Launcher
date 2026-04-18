import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

import { useAuthState } from "@renderer/hooks/useAuthState";
import { useUpdateState } from "@renderer/hooks/useUpdateState";
import { cobox } from "@renderer/lib/electron";

export const Route = createFileRoute("/")({
  component: SplashPage,
});

function SplashPage() {
  const auth = useAuthState();
  const update = useUpdateState();
  const navigate = useNavigate();

  // Kick an update check as soon as we mount.
  useEffect(() => {
    cobox.updater.check().catch(() => {});
  }, []);

  // Route decision logic:
  //  - if an update is available / downloading → stay here, show progress
  //  - else if no auth session → /login
  //  - else → /home
  useEffect(() => {
    if (!auth || !update) return;
    const blockingUpdate =
      update.status === "available" ||
      update.status === "downloading" ||
      update.status === "downloaded";
    if (blockingUpdate) return;

    if (auth.status === "signed-in") {
      navigate({ to: "/home" });
    } else if (auth.status === "signed-out") {
      navigate({ to: "/login" });
    }
  }, [auth, update, navigate]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 text-surface-900">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="size-20 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg">
          <span className="text-white text-3xl font-bold">C</span>
        </div>
        <div className="text-2xl font-semibold">Cobox Launcher</div>
        <div className="flex items-center gap-2 text-sm text-surface-900/60">
          <Loader2 className="animate-spin" size={14} />
          <span>
            {update?.status === "downloading"
              ? `Downloading update ${update.percent.toFixed(0)}%`
              : update?.status === "checking"
                ? "Checking for updates…"
                : "Preparing your launcher…"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
