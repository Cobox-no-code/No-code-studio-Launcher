import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { CreatorHome } from "@renderer/components/home/CreatorHome";
import { PlayerHome } from "@renderer/components/home/PlayerHome";
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
      {mode === "creator" ? <CreatorHome /> : <PlayerHome />}
    </AuthedShell>
  );
}
