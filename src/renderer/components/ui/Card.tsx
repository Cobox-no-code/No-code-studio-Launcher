import type { ReactNode } from "react";
import { cn } from "@renderer/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface-2/60 border border-border overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
