import heroImg from "@renderer/assets/images/no-code-world-hero.png";
import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { CreateHero } from "@renderer/components/studio/CreateHero";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/create-world")({
  component: CreateWorldPage,
});

function CreateWorldPage() {
  const auth = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth, navigate]);

  if (auth?.status !== "signed-in") return null;

  return (
    <AuthedShell bleed>
      <CreateHero
        title={"NO CODE\nWORLD"}
        description="Unleash your imagination. Create stunning 3D environments and immersive single-player experiences in under 5 minutes without writing code."
        ctaLabel="Create now"
        intent="world"
        bgImage={heroImg}
      />
    </AuthedShell>
  );
}
