import { useEffect, useState } from "react";
import type { GameStatus } from "../../shared/types/game";
import { cobox } from "@renderer/lib/electron";

export function useGameStatus(refreshMs = 2_000) {
  const [status, setStatus] = useState<GameStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const pull = async () => {
      const s = await cobox.games.getStatus();
      if (mounted) setStatus(s);
    };
    pull();
    const id = setInterval(pull, refreshMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [refreshMs]);

  return status;
}
