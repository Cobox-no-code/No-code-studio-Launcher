import { useEffect, useState } from "react";
import type { BootstrapState } from "../../shared/types/bootstrap";
import { cobox } from "@renderer/lib/electron";
import { useIpcEvent } from "./useIpcEvent";

export function useBootstrapState() {
  const [state, setState] = useState<BootstrapState | null>(null);

  useEffect(() => {
    let mounted = true;
    cobox.bootstrap.getState().then((s) => mounted && setState(s));
    const id = setInterval(() => {
      cobox.bootstrap.getState().then((s) => mounted && setState(s));
    }, 1_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useIpcEvent<BootstrapState>(cobox.bootstrap.onStateChanged, setState);

  return state;
}
