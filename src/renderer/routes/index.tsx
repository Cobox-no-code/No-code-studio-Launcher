import { BootstrapErrorScreen } from "@renderer/components/bootstrap/ BootstrapErrorScreen";
import { BootstrapProgressScreen } from "@renderer/components/bootstrap/BootstrapProgressScreen";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { useBootstrapState } from "@renderer/hooks/useBootstrapState";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: BootstrapPage,
});

function BootstrapPage() {
  const boot = useBootstrapState();
  const auth = useAuthState();
  const navigate = useNavigate();
  const didRouteRef = useRef(false);

  // Route to next screen ONLY once, ONLY when bootstrap phase reaches "ready"
  useEffect(() => {
    if (didRouteRef.current) return;
    if (boot?.phase !== "ready") return;
    if (!auth) return;

    didRouteRef.current = true;
    if (auth.status === "signed-in") {
      navigate({ to: "/home" });
    } else {
      navigate({ to: "/login" });
    }
  }, [boot?.phase, auth?.status, navigate]);

  // Error state — show retry UI, do NOT auto-navigate
  if (boot?.phase === "error") {
    return <BootstrapErrorScreen error={boot.error} />;
  }

  return <BootstrapProgressScreen state={boot} />;
}
