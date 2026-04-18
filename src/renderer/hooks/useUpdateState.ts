import { useEffect, useState } from "react";
import type { UpdateStatePayload } from "../../shared/types/update";
import { cobox } from "@renderer/lib/electron";
import { useIpcEvent } from "./useIpcEvent";

const POLL_MS = 800;

export function useUpdateState() {
  const [state, setState] = useState<UpdateStatePayload | null>(null);

  useEffect(() => {
    let mounted = true;
    const pull = async () => {
      const s = await cobox.updater.getState();
      if (mounted) setState(s);
    };
    pull();
    const id = setInterval(pull, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useIpcEvent<UpdateStatePayload>(cobox.updater.onStateChanged, setState);

  return state;
}
