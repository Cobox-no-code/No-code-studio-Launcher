import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { CreateHero } from "@renderer/components/studio/CreateHero";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
// Use the same hero for now; swap when you have a distinct Create Game image
import heroImg from "@renderer/assets/images/no-code-world-hero.png";

export const Route = createFileRoute("/create-game")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const auth = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth, navigate]);

  if (auth?.status !== "signed-in") return null;

  return (
    <AuthedShell bleed>
      <CreateHero
        title={"NO CODE\nGAME"}
        description="Turn your worlds into playable single-player experiences. Define objectives, logic, and rewards — all without code."
        ctaLabel="Create now"
        intent="game"
        bgImage={heroImg}
      />
    </AuthedShell>
  );
}
