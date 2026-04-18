import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, User } from "lucide-react";

import { useAuthState } from "@renderer/hooks/useAuthState";
import { useGameStatus } from "@renderer/hooks/useGameStatus";
import { cobox } from "@renderer/lib/electron";
import { Button } from "@renderer/components/ui/Button";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  const auth = useAuthState();
  const game = useGameStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth, navigate]);

  if (auth?.status !== "signed-in") return null;

  return (
    <div className="h-full p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
            <User size={18} />
          </div>
          <div>
            <div className="text-sm text-surface-900/60">Signed in as</div>
            <div className="font-medium">
              {auth.user?.name ?? auth.user?.email}
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={() => cobox.auth.logout()}>
          <LogOut size={14} />
          Logout
        </Button>
      </header>

      <section className="flex-1 flex items-center justify-center text-surface-900/50 text-sm">
        <div className="text-center">
          <div>Home is a placeholder.</div>
          <div className="text-xs mt-1">
            Game installed: <code>{String(game?.installed ?? false)}</code>
          </div>
        </div>
      </section>
    </div>
  );
}
