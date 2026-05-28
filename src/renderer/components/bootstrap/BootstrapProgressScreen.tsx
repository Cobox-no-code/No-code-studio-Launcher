import { useEffect, useRef, useState } from "react";
import type { BootstrapState } from "@shared/types/bootstrap";

import charactersSrc from "@renderer/assets/images/group1.png";

const MIN_FILL_MS = 3000; // bar 0→100 kam se kam itne time mein bhare

export function BootstrapProgressScreen({
  state,
}: {
  state: BootstrapState | null;
}) {
  const phase = state?.phase;
  const realPercent = Math.round(state?.gameDownload?.percent ?? 0);
  const targetVersion = state?.gameDownload?.targetVersion;

  // 🆕 Smooth display progress — never overshoots real, but takes ≥ MIN_FILL_MS
  const [displayPercent, setDisplayPercent] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const timeBased = Math.min(100, (elapsed / MIN_FILL_MS) * 100);

      // Agar phase ready hai (download done), bar ko time ke hisaab se 100 tak le jao.
      // Warna real download progress ke saath chalo, but time se aage nahi.
      const ceiling = phase === "ready" ? 100 : realPercent;
      const next = Math.min(ceiling, timeBased);

      setDisplayPercent((prev) => (next > prev ? next : prev));
      if (next < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, realPercent]);

  const rounded = Math.round(displayPercent);

  const label =
    phase === "intro-videos"
      ? "Welcome"
      : phase === "checking"
        ? "Checking for updates"
        : phase === "game-downloading"
          ? `Downloading No Code Studio ${targetVersion ?? ""}`.trim()
          : phase === "ready"
            ? "Ready to launch"
            : "Starting up";

  return (
    <div className="h-screen relative overflow-hidden bg-[#0F0116]">
      <img
        src={charactersSrc}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

     // Ab karo:
<div className="absolute bottom-10 left-10 right-10 z-10">
  {/* Label + percentage same line */}
  <div className="flex items-center justify-between mb-2">
    <span
      className="text-sm font-semibold tracking-wide text-white/70"
      style={{ letterSpacing: "0.08em" }}
    >
      {label}
    </span>
    <span className="text-sm font-bold text-white/90 tabular-nums">
      {rounded}%
    </span>
  </div>

  {/* Progress bar */}
  <div
    className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden"
    style={{ filter: "drop-shadow(0 0 4px rgba(255,92,195,0.4))" }}
  >
    <div
      className="h-full rounded-full"
      style={{
        width: `${displayPercent}%`,
        background: "linear-gradient(90deg, #c084fc, #FF5CC3)",
        boxShadow: "0 0 6px rgba(255,92,195,0.5)",
        transition: "width 120ms linear",
      }}
    />
  </div>
</div>
    </div>
  );
}