import { useSyncExternalStore } from "react";

/**
 * Player vs Creator mode. Persistent across launches (localStorage).
 * Single store — pattern scales if we add more global state later.
 */
export type AppMode = "player" | "creator";

const KEY = "cobox:mode";
const DEFAULT: AppMode = "creator";

let current: AppMode =
  (typeof localStorage !== "undefined" &&
    (localStorage.getItem(KEY) as AppMode)) ||
  DEFAULT;

const listeners = new Set<() => void>();

function setMode(next: AppMode) {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* best-effort */
  }
  listeners.forEach((l) => l());
}

export function useMode(): [AppMode, (m: AppMode) => void, () => void] {
  const mode = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current,
    () => DEFAULT,
  );
  const toggle = () => setMode(mode === "creator" ? "player" : "creator");
  return [mode, setMode, toggle];
}
