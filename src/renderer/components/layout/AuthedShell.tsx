import { FloatingDownload } from "@renderer/components/bootstrap/FloatingDownload";
import { cobox } from "@renderer/lib/electron";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AuthedShell({ children }: { children: ReactNode }) {
  // Reaching an authed shell is our definition of "first run complete"
  useEffect(() => {
    void cobox.bootstrap.markFirstRunComplete();
  }, []);

  return (
    <div className="flex flex-col h-screen  bg-layout-gradient">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto px-4 pt-1 pb-4">
          <div className="h-full rounded-lg bg-surface-1 border border-border overflow-auto">
            {children}
          </div>
        </main>
      </div>
      <FloatingDownload />
    </div>
  );
}
