import type { ReactNode } from "react";
import { TitleBar } from "@renderer/components/ui/TitleBar";
import { cn } from "@renderer/lib/cn";

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col h-screen bg-surface-50">
      <TitleBar />
      <main className={cn("flex-1 overflow-hidden", className)}>
        {children}
      </main>
    </div>
  );
}
