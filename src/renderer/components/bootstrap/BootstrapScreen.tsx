import { Button } from "@renderer/components/ui/Button";
import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import { useEffect, useState } from "react";
import type { BootstrapState } from "../../../shared/types/bootstrap";

// Full-bleed background art — purple scene already baked in
import charactersSrc from "@renderer/assets/images/boot-characters.png";

const AUTO_ADVANCE_MS = 12_000;

export function BootstrapScreen({ state }: { state: BootstrapState }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const ms = Date.now() - start;
      setElapsed(ms);
      if (ms >= AUTO_ADVANCE_MS) {
        clearInterval(id);
        void cobox.bootstrap.skipToLogin();
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const percent = Math.max(0, Math.min(100, state.gameDownload.percent ?? 0));
  const rounded = Math.round(percent);

  const statusLine = (() => {
    const g = state.gameDownload;
    if (g.status === "error") return `Error — ${g.error ?? "unknown"}`;
    if (g.status === "extracting") return "Installing…";
    if (g.status === "downloading")
      return `Downloading No Code Studio ${g.targetVersion ?? ""}`.trim();
    if (g.status === "checking") return "Checking for updates…";
    if (g.status === "installed") return "Ready to launch";
    return "Preparing…";
  })();

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0F0116]">
      {/* Full-bleed background — PNG already has the purple scene */}
      <img
        src={charactersSrc}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      {/* Overlay content — positioned over the art */}
      <div className="relative z-10 h-full flex flex-col justify-end px-10 pb-10">
        {/* Status + percent row */}
        <div className="flex items-end justify-between text-white mb-3">
          <span className="font-display font-bold text-sm tracking-wide drop-shadow-lg">
            {statusLine}
          </span>
          <span className="font-display font-black text-lg tracking-wider drop-shadow-lg">
            {rounded}%
          </span>
        </div>

        {/* Progress bar — hot pink, 2px, drop shadow per Figma */}
        <div
          className="relative h-[2px] w-full bg-white/5 rounded-full overflow-visible"
          style={{ filter: "drop-shadow(0 0 6px rgba(255, 92, 195, 0.55))" }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${percent}%`,
              background: "#FF5CC3",
              boxShadow: "0 0 8px 2px rgba(255, 92, 195, 0.55)",
            }}
          />
        </div>

        {/* Footer — countdown + skip */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-white/60 drop-shadow-md">
            {state.gameDownload.status === "error" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cobox.bootstrap.retry()}
              >
                Retry
              </Button>
            ) : (
              <span>
                Auto-advance in{" "}
                {Math.max(0, Math.ceil((AUTO_ADVANCE_MS - elapsed) / 1000))}s
              </span>
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => cobox.bootstrap.skipToLogin()}
            className={cn("text-white hover:text-white/80")}
          >
            Skip to login →
          </Button>
        </div>
      </div>
    </div>
  );
}
