import { useEffect, useState } from "react";
import type { BootstrapState } from "@shared/types/bootstrap";

// 🆕 Background art import
import charactersSrc from "@renderer/assets/images/boot-characters.png";

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

  // 🆕 Show progress bar in ALL phases except "ready" (where it's already 100%)
  const showProgressBar = phase !== "ready";
  const displayPercent = phase === "ready" ? 100 : percent;

  return (
    <div className="h-screen relative overflow-hidden bg-[#0F0116]">
      {/* 🆕 Full-bleed background image */}
      <img
        src={charactersSrc}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      {/* Bottom status area — overlaid on image */}
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
        <div className="flex-1">
          <div className="font-display font-black text-2xl text-white drop-shadow-lg">
            {label}
          </div>

          {showProgressBar && (
            <div
              className="mt-3 h-[2px] w-full max-w-[calc(100%-120px)] bg-white/10 rounded-full overflow-visible"
              style={{ filter: "drop-shadow(0 0 6px rgba(255,92,195,0.55))" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${displayPercent}%`,
                  background: "#FF5CC3",
                  boxShadow: "0 0 8px 2px rgba(255,92,195,0.55)",
                }}
              />
            </div>
          )}

          {phase === "game-downloading" && (
            <div className="mt-2 text-xs text-white/60 drop-shadow">
              {countdown === null
                ? "Auto-advance when ready"
                : `Auto-advance in ${countdown}s`}
            </div>
          )}
        </div>

        <div className="font-display font-black text-4xl text-white drop-shadow-lg ml-6">
          {displayPercent}%
        </div>
      </div>
    </div>
  );
}