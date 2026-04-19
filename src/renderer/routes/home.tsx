import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { useMode } from "@renderer/stores/mode.store";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  const auth = useAuthState();
  const [mode] = useMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth, navigate]);

  if (auth?.status !== "signed-in") return null;

  return (
    <AuthedShell>
      <div className="h-full flex items-center justify-center p-10">
        <div className="text-center space-y-3">
          <div className="font-display font-black text-5xl leading-none">
            {mode === "creator" ? "NO CODE STUDIO" : "COBOX PLAYER"}
          </div>
          <p className="text-sm text-text-muted max-w-md">
            {mode === "creator"
              ? "Unleash your imagination. Create stunning 3D environments and immersive single-player experiences in under 5 minutes without writing code."
              : "Discover games built by the Cobox community. Library coming in the next phase."}
          </p>
          <p className="text-xs text-text-muted pt-4">
            Signed in as{" "}
            <span className="text-text">
              {auth.user?.name ?? auth.user?.email}
            </span>
          </p>
        </div>
      </div>
    </AuthedShell>
  );
}
