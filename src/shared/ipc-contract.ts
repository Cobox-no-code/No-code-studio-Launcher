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
    launchWithIntent: "games:launch-with-intent",

    liveGameDownload: "games:live-download",
    liveGameDownloadProgress: "games:live-download-progress", // push
    liveGameCheckStatus: "games:live-check-status",
    liveGameDelete: "games:live-delete",
    playLiveGame: "games:play-live-game",

    liveGameGetLibrary: "games:live-get-library",
  },

  auth: {
    getState: "auth:get-state",
    stateChanged: "auth:state-changed", // push channel
    startLogin: "auth:start-login",
    cancelLogin: "auth:cancel-login",
    refresh: "auth:refresh",
    logout: "auth:logout",
    openExternal: "auth:open-external", // util: opens system browser
    getToken: "auth:get-token",
  },

  publish: {
    // Listing
    listMine: "publish:list-mine",

    // Direct (small files)
    publishDirect: "publish:publish-direct",

    // Presigned flow (large files)
    presign: "publish:presign",
    uploadToS3: "publish:upload-to-s3",
    publishPresigned: "publish:publish-presigned",
    stageThumbnail: "publish:stage-thumbnail",

    // CRUD
    update: "publish:update",
    delete: "publish:delete",

    // Versions
    createVersion: "publish:create-version",

    // Push channel
    uploadProgress: "publish:upload-progress",
  },
  bootstrap: {
    getState: "bootstrap:get-state",
    stateChanged: "bootstrap:state-changed", // push channel
    start: "bootstrap:start",
    markIntroDone: "bootstrap:mark-intro-done",
    skipToLogin: "bootstrap:skip-to-login",
    retry: "bootstrap:retry",
  },
  app: {
    getVersion: "app:get-version",
    openDataFolder: "app:open-data-folder",
    clearCache: "app:clear-cache",
  },
  profile: {
    update: "profile:update",
  },
} as const;
