import { cobox } from "@renderer/lib/electron";
import { cn } from "@renderer/lib/cn";

/**
 * Electron draggable title bar. The `data-drag` attribute makes the whole bar
 * a drag region; explicit action buttons use `data-no-drag` so clicks register.
 */
export function TitleBar({ className }: { className?: string }) {
  return (
    <div
      data-drag
      className={cn(
        "h-10 flex items-center justify-between px-4 border-b border-surface-200 bg-surface-0 select-none",
        className,
      )}
    >
      <span className="text-sm font-semibold tracking-tight text-surface-900">
        Cobox
      </span>
      <span className="text-xs text-surface-900/50">Launcher</span>
    </div>
  );
}
