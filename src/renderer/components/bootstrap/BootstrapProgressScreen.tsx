import { useEffect, useRef, useState } from "react";
import type { BootstrapState } from "@shared/types/bootstrap";

import charactersSrc from "@renderer/assets/images/boot-characters.png";

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

      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
        <div className="flex-1">
          <div className="font-display font-black text-2xl text-white drop-shadow-lg">
            {label}
          </div>

          <div
            className="mt-3 h-[2px] w-full max-w-[calc(100%-120px)] bg-white/10 rounded-full overflow-visible"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,92,195,0.55))" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${displayPercent}%`,
                background: "#FF5CC3",
                boxShadow: "0 0 8px 2px rgba(255,92,195,0.55)",
                transition: "width 120ms linear",
              }}
            />
          </div>
        </div>

        <div className="font-display font-black text-4xl text-white drop-shadow-lg ml-6">
          {rounded}%
        </div>
      </div>
    </div>
  );
}