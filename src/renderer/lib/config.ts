/**
 * Public backend URL visible to the renderer.
 * Mirrors what main process reads, but for renderer-side fetches.
 */
export const BACKEND_URL_PUBLIC =
  import.meta.env.VITE_BACKEND_URL || "https://api.cobox.games/api";
