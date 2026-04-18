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

  auth: {
    getState: "auth:get-state",
    stateChanged: "auth:state-changed", // push channel
    startLogin: "auth:start-login",
    cancelLogin: "auth:cancel-login",
    refresh: "auth:refresh",
    logout: "auth:logout",
    openExternal: "auth:open-external", // util: opens system browser
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

    // CRUD
    update: "publish:update",
    delete: "publish:delete",

    // Versions
    createVersion: "publish:create-version",

    // Push channel
    uploadProgress: "publish:upload-progress",
  },
} as const;
