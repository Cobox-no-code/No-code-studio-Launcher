import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

console.log("Preload script is loading...");

export const api = {
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event: IpcRendererEvent, args: any) =>
      callback(event, args)
    );
  },

  send: (channel: string, args: any): void => {
    ipcRenderer.send(channel, args);
  },

  sendSync: (channel: string, args: any): any => {
    return ipcRenderer.sendSync(channel, args);
  },
};

const electronAPI = {
  // Existing game-related methods
  chooseInstallPath: () => ipcRenderer.invoke("choose-install-path"),
  downloadGame: (params) => {
    console.log("Preload: downloadGame called with:", params);
    console.log("Preload: params type:", typeof params);
    console.log("Preload: params keys:", params ? Object.keys(params) : "null");
    return ipcRenderer.invoke("download-game", params);
  },
  onDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on("download-progress", (_event, progress) => {
      callback(progress);
    });
  },
  createSecret: (data) => ipcRenderer.invoke("create-secret", data),
  updateSecret: (data) => ipcRenderer.invoke("update-secret", data),
  updateWorker: (data) => ipcRenderer.invoke("update-worker", data),
  launchGame: (exePath) => ipcRenderer.invoke("launch-game", exePath),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  checkGameInstallation: (gamePath) =>
    ipcRenderer.invoke("check-game-installation", gamePath),
  getDefaultInstallPath: () => ipcRenderer.invoke("get-default-install-path"),

  // Update-related methods
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Update event listeners
  // Store listeners so they can be removed later
  _updateListeners: new Map<
    string,
    (event: IpcRendererEvent, ...args: any[]) => void
  >(),

  onUpdateEvent: (callback: (event: string, data: any) => void) => {
    const channels = [
      "checking-for-update",
      "update-available",
      "update-not-available",
      "download-progress",
      "update-downloaded",
      "update-error",
      "update-worker",
      "update-secret",
      "create-secret",
    ];

    channels.forEach((channel) => {
      const listener = (_: IpcRendererEvent, data: any) =>
        callback(channel, data);
      ipcRenderer.on(channel, listener);
      electronAPI._updateListeners.set(channel, listener);
    });
  },

  removeUpdateListener: () => {
    const channels = [
      "checking-for-update",
      "update-available",
      "update-not-available",
      "download-progress",
      "update-downloaded",
      "update-error",
      "update-worker",
      "update-secret",
      "create-secret",
    ];

    channels.forEach((channel) => {
      const listener = electronAPI._updateListeners.get(channel);
      if (listener) {
        ipcRenderer.removeListener(channel, listener);
        electronAPI._updateListeners.delete(channel);
      }
    });
  },
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  console.log("Successfully exposed electronAPI to main world");
} catch (error) {
  console.error("Failed to expose electronAPI:", error);
}
