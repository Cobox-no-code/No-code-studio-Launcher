import { useEffect, useState } from "react";
import type { BootstrapState } from "@shared/types/bootstrap";

export function BootstrapProgressScreen({
  state,
}: {
  state: BootstrapState | null;
}) {
  const phase = state?.phase;
  const percent = Math.round(state?.gameDownload?.percent ?? 0);
  const targetVersion = state?.gameDownload?.targetVersion;

  // Auto-advance countdown — only starts when phase === "ready"
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "ready") {
      setCountdown(null);
      return;
    }
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => (c === null ? null : Math.max(0, c - 1)));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const label =
    phase === "intro-videos"
      ? "Welcome"
      : phase === "checking"
        ? "Checking for updates"
        : phase === "game-downloading"
          ? `Downloading No Code Studio ${targetVersion ?? ""}`
          : phase === "ready"
            ? "Ready to launch"
            : "Starting up";

  return (
    <div className="h-screen bg-[url('/bootstrap-bg.jpg')] bg-cover bg-center relative">
      {/* Existing character art + background, unchanged */}

      {/* Bottom status area */}
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
        <div className="flex-1">
          <div className="font-display font-black text-2xl">{label}</div>

          {phase === "game-downloading" && (
            <>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden w-[420px]">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 text-xs text-text-muted">
                {countdown === null
                  ? "Auto-advance when ready"
                  : `Auto-advance in ${countdown}s`}
              </div>
            </>
          )}
        </div>

        <div className="font-display font-black text-4xl">{percent}%</div>
      </div>
    </div>
  );
}
