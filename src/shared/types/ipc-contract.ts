/**
 * Single source of truth for IPC channel names.
 * Imported by main (registering handlers), preload (invoking/listening),
 * and never by the renderer directly — renderer uses typed wrappers.
 */
export const IPC = {
  updater: {
    check: "updater:check",
    download: "updater:download",
    install: "updater:install",
    getState: "updater:get-state",
    stateChanged: "updater:state-changed", // push channel
  },
} as const;
