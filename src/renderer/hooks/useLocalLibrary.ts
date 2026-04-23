import { cobox } from "@renderer/lib/electron";
import { useCallback, useEffect, useState } from "react";
import type { LocalLibraryGame } from "../../shared/types/game";

export function useLocalLibrary() {
  const [games, setGames] = useState<LocalLibraryGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await cobox.games.getLibrary();
      setGames(list ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load library";
      setError(msg);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { games, loading, error, refresh };
}
