// preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

console.log("Preload script is loading...");

const electronAPI = {
  // ==================== NEW FLOW FUNCTIONS ====================

  /**
   * Fetches game version and download link directly from server (Main Process).
   */
  getServerVersion: () => ipcRenderer.invoke("get-server-version"),

  /**
   * Opens native dialog to pick folder. Returns string path or null.
   */
  chooseInstallPath: () => ipcRenderer.invoke("choose-install-path"),

  /**
   * Downloads zip, extracts, finds EXE, and saves path to worker.json.
   */
  downloadGame: (params: { url: string; targetDir: string }) =>
    ipcRenderer.invoke("download-game", params),

  /**
   * Launches the game using path stored in worker.json.
   */
  launchGame: () => ipcRenderer.invoke("launch-game"),

  /**
   * Checks if game path in worker.json exists on disk.
   */
  getGameInstallationStatus: () => ipcRenderer.invoke("get-game-status"),

  /**
   * Checks specific path (Legacy/Helper)
   */
  checkGameInstallation: (gamePath: string) =>
    ipcRenderer.invoke("check-game-installation", gamePath),

  getDefaultInstallPath: () => ipcRenderer.invoke("get-default-install-path"),

  // ==================== RESTORED SECRET/WORKER FUNCTIONS ====================

  /**
   * Updates keys in worker.json (mode, type, etc.)
   */
  updateWorker: (data: { path: string; updates: Record<string, any> }) =>
    ipcRenderer.invoke("update-worker", data),

  /**
   * ✅ RESTORED: Create secret.json
   */
  createSecret: (data: Record<string, any>) =>
    ipcRenderer.invoke("create-secret", data),

  /**
   * ✅ RESTORED: Update secret.json
   */
  updateSecret: (data: Record<string, any>) =>
    ipcRenderer.invoke("update-secret", data),

  // ==================== UTILS & EVENTS ====================

  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  onDownloadProgress: (callback: (progress: number) => void) => {
    // Remove existing listeners to prevent duplicate progress bars
    ipcRenderer.removeAllListeners("download-progress");
    ipcRenderer.on("download-progress", (_event, progress) => {
      callback(progress);
    });
  },

  // ==================== UPDATER (AutoUpdater) ====================

  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Helper to store listeners so they can be removed
  _updateListeners: new Map<
    string,
    (event: IpcRendererEvent, ...args: any[]) => void
  >(),

  onUpdateEvent: (callback: (channel: string, data: any) => void) => {
    const channels = [
      "checking-for-update",
      "update-available",
      "update-not-available",
      "update-downloaded",
      "update-error",
      "download-progress", // Added this to general events too just in case
      "update-worker",
      "update-secret",
      "create-secret",
    ];

    channels.forEach((channel) => {
      // Clean up previous listeners for this channel
      const oldListener = electronAPI._updateListeners.get(channel);
      if (oldListener) {
        ipcRenderer.removeListener(channel, oldListener);
      }

      // Create new listener
      const listener = (_event: IpcRendererEvent, data: any) =>
        callback(channel, data);

      // Register
      ipcRenderer.on(channel, listener);
      electronAPI._updateListeners.set(channel, listener);
    });
  },

  removeUpdateListener: () => {
    const channels = [
      "checking-for-update",
      "update-available",
      "update-not-available",
      "update-downloaded",
      "update-error",
      "download-progress",
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
