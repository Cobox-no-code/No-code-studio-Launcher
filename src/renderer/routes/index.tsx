import { BootstrapErrorScreen } from "@renderer/components/bootstrap/ BootstrapErrorScreen";
import { BootstrapProgressScreen } from "@renderer/components/bootstrap/BootstrapProgressScreen";
import { IntroVideos } from "@renderer/components/bootstrap/IntroVideos";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { useBootstrapState } from "@renderer/hooks/useBootstrapState";
import { cobox } from "@renderer/lib/electron";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const MIN_SPLASH_MS = 3000;

export const Route = createFileRoute("/")({
  component: BootstrapPage,
});

function BootstrapPage() {
  const boot = useBootstrapState();
  
  const auth = useAuthState();
  const navigate = useNavigate();
  const didRouteRef = useRef(false);

  const [minTimeReached, setMinTimeReached] = useState(false);
  const [introsDone, setIntrosDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeReached(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (didRouteRef.current) return;
    if (boot?.phase !== "ready") return;
    if (!auth) return;
    if (!minTimeReached) return;
    if (boot.firstRun && !introsDone) return;

    didRouteRef.current = true;
    navigate({ to: auth.status === "signed-in" ? "/home" : "/login" });
  }, [
    boot?.phase,
    boot?.firstRun,
    auth?.status,
    navigate,
    minTimeReached,
    introsDone,
  ]);

  if (boot?.phase === "error") {
    return <BootstrapErrorScreen error={boot.error} />;
  }

  // 🆕 Intro videos sirf tab jab loading min 3 sec ho chuki ho
  if (
    boot?.phase === "ready" &&
    boot.firstRun &&
    !introsDone &&
    minTimeReached
  ) {
    return (
      <IntroVideos
        onComplete={() => {
          setIntrosDone(true);
          void cobox.bootstrap.markIntroDone();
        }}
      />
    );
  }

  return <BootstrapProgressScreen state={boot} />;
}