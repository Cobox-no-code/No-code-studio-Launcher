import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cobox } from "@renderer/lib/electron";
import type {
  LiveGameDownloadProgress,
  LiveGameStatus,
} from "../../shared/types/game";

export type CardPhase =
  | "idle" // not installed, button = Install
  | "downloading" // % progress shown
  | "installed" // button = Play
  | "error";

export interface CardState {
  phase: CardPhase;
  percent: number; // 0-100 during download
  savPath: string | null; // populated once installed
  error: string | null;
}

const defaultState = (): CardState => ({
  phase: "idle",
  percent: 0,
  savPath: null,
  error: null,
});

/**
 * Tracks download/install state for every game visible in the grid.
 * Batches status fetches by game_ids and listens to download progress events.
 */
export function usePlayerGames(gameIds: string[]) {
  const [states, setStates] = useState<Record<string, CardState>>({});
  const gameIdsKey = useMemo(() => gameIds.join("|"), [gameIds]);
  const mounted = useRef(true);

  // Refresh status for all passed gameIds
  const refresh = useCallback(async () => {
    if (gameIds.length === 0) return;
    const map = await cobox.games.liveGames.checkStatus(gameIds);
    if (!mounted.current) return;
    setStates((prev) => {
      const next = { ...prev };
      for (const id of gameIds) {
        const s: LiveGameStatus = map[id] ?? { downloaded: false, path: null };
        const existing = next[id];
        // Don't stomp a currently-downloading state
        if (existing?.phase === "downloading") continue;
        next[id] = {
          phase: s.downloaded ? "installed" : "idle",
          percent: s.downloaded ? 100 : 0,
          savPath: s.path,
          error: null,
        };
      }
      return next;
    });
  }, [gameIdsKey]);

  // Initial + whenever gameIds change
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  // Subscribe once to progress events, route by gameId
  useEffect(() => {
    const unsub = cobox.games.liveGames.onDownloadProgress((data) => {
      setStates((prev) => ({
        ...prev,
        [data.gameId]: {
          phase: data.percent >= 100 ? "installed" : "downloading",
          percent: data.percent,
          savPath: prev[data.gameId]?.savPath ?? null,
          error: null,
        },
      }));
    });
    return unsub;
  }, []);

  const getState = useCallback(
    (id: string): CardState => states[id] ?? defaultState(),
    [states],
  );

  const setState = useCallback(
    (id: string, patch: Partial<CardState>) =>
      setStates((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? defaultState()), ...patch },
      })),
    [],
  );

  return { getState, setState, refresh };
}
