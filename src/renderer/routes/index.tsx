import { BootstrapErrorScreen } from "@renderer/components/bootstrap/ BootstrapErrorScreen";
import { BootstrapProgressScreen } from "@renderer/components/bootstrap/BootstrapProgressScreen";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { useBootstrapState } from "@renderer/hooks/useBootstrapState";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const MIN_SPLASH_MS = 3000; // 🆕 minimum 3 seconds splash hold

export const Route = createFileRoute("/")({
  component: BootstrapPage,
});

function BootstrapPage() {
  const boot = useBootstrapState();
  const auth = useAuthState();
  const navigate = useNavigate();
  const didRouteRef = useRef(false);

  // 🆕 Track when minimum splash time has elapsed
  const [minTimeReached, setMinTimeReached] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinTimeReached(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Route to next screen ONLY once, ONLY when bootstrap phase reaches "ready"
  // 🆕 AND minimum 3 sec splash time has passed
  useEffect(() => {
    if (didRouteRef.current) return;
    if (boot?.phase !== "ready") return;
    if (!auth) return;
    if (!minTimeReached) return; // 🆕 hold until 3 sec done

    didRouteRef.current = true;
    if (auth.status === "signed-in") {
      navigate({ to: "/home" });
    } else {
      navigate({ to: "/login" });
    }
  }, [boot?.phase, auth?.status, navigate, minTimeReached]);

  // Error state — show retry UI, do NOT auto-navigate
  if (boot?.phase === "error") {
    return <BootstrapErrorScreen error={boot.error} />;
  }

  return <BootstrapProgressScreen state={boot} />;
}