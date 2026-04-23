import { FloatingDownload } from "@renderer/components/bootstrap/FloatingDownload";
import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AuthedShell({
  children,
  bleed = false,
}: {
  children: ReactNode;
  bleed?: boolean;
}) {
  // Reaching an authed shell is our definition of "first run complete"
  useEffect(() => {
    void cobox.bootstrap.markFirstRunComplete();
  }, []);

  return (
    <div className="flex flex-col h-screen  bg-layout-gradient">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 ",
            bleed ? "mt-2 mb-3 mr-3" : "mt-2 mb-3 mr-3 ",
          )}
        >
          <div
            className={cn(
              "h-full w-full overflow-hidden",
              bleed
                ? "rounded bg-surface-1 border border-border"
                : "rounded bg-surface-1 border border-border",
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <FloatingDownload />
    </div>
  );
}
