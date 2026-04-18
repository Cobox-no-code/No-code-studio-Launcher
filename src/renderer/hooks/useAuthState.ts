import { useEffect, useState } from "react";
import type { AuthState } from "../../shared/types/auth";
import { cobox } from "@renderer/lib/electron";
import { useIpcEvent } from "./useIpcEvent";

const POLL_MS = 1_000;

export function useAuthState() {
  const [state, setState] = useState<AuthState | null>(null);

  useEffect(() => {
    let mounted = true;
    const pull = async () => {
      const s = await cobox.auth.getState();
      if (mounted) setState(s);
    };
    pull();
    const id = setInterval(pull, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useIpcEvent<AuthState>(cobox.auth.onStateChanged, setState);

  return state;
}
