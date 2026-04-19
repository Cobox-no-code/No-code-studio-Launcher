import { useMode } from "@renderer/stores/mode.store";
import { cn } from "@renderer/lib/cn";
import { Gamepad2, Wrench } from "lucide-react";

export function ModeToggle({ className }: { className?: string }) {
  const [mode, , toggle] = useMode();
  const isCreator = mode === "creator";

  return (
    <button
      onClick={toggle}
      data-no-drag
      aria-label={`Switch to ${isCreator ? "player" : "creator"} mode`}
      className={cn(
        "relative w-14 h-7 rounded-pill border border-border-strong bg-surface-1",
        "flex items-center px-1 transition-colors",
        isCreator ? "bg-brand-700/40" : "bg-surface-1",
        className,
      )}
    >
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 size-5 rounded-full bg-white shadow-md transition-all flex items-center justify-center",
          isCreator ? "left-1" : "left-[calc(100%-1.5rem)]",
        )}
      >
        {isCreator ? (
          <Wrench size={10} className="text-brand-700" />
        ) : (
          <Gamepad2 size={10} className="text-brand-700" />
        )}
      </div>
    </button>
  );
}
