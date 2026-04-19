import { cn } from "@renderer/lib/cn";

export function Avatar({
  src,
  name,
  online,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string;
  online?: boolean;
  size?: number;
  className?: string;
}) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full bg-white/10 border border-border-strong flex items-center justify-center overflow-hidden font-bold text-sm text-white"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img
            src={src}
            alt={name ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-bg",
            online ? "bg-success" : "bg-text-muted",
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
