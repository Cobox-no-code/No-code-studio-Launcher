export const IPC = {
  updater: {
    check: "updater:check",
    download: "updater:download",
    install: "updater:install",
    getState: "updater:get-state",
    stateChanged: "updater:state-changed",
  },
  games: {
    // Installer (zip-based main game)
    getServerVersion: "games:get-server-version",
    getDefaultInstallPath: "games:get-default-install-path",
    chooseInstallPath: "games:choose-install-path",
    download: "games:download",
    downloadProgress: "games:download-progress", // push channel
    launch: "games:launch",
    getStatus: "games:get-status",
    checkInstallation: "games:check-installation",

    // Live games (.sav based)
    downloadLive: "games:download-live",
    checkDownloadStatus: "games:check-download-status",
    deleteLive: "games:delete-live",
    getLocalLibrary: "games:get-local-library",
  },
} as const;
