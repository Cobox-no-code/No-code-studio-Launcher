// preload.ts
import { contextBridge, ipcRenderer } from "electron";

console.log("Preload script is loading...");

const electronAPI = {
  // === CORE GAME FLOW ===

  /**
   * Fetches game version and download link directly from server (Main Process).
   * Bypasses CORS issues present in Renderer.
   */
  getServerVersion: () => ipcRenderer.invoke("get-server-version"),

  /**
   * Opens native dialog to pick folder. Returns string path or null.
   */
  chooseInstallPath: () => ipcRenderer.invoke("choose-install-path"),

  /**
   * Downloads zip, extracts, finds EXE, and saves path to worker.json.
   * Returns the path to the executable.
   */
  downloadGame: (params: { url: string; targetDir: string }) =>
    ipcRenderer.invoke("download-game", params),

  /**
   * Launches the game using path stored in worker.json.
   * No arguments needed anymore.
   */
  launchGame: () => ipcRenderer.invoke("launch-game"),

  /**
   * Checks if game path in worker.json exists on disk.
   */
  getGameInstallationStatus: () => ipcRenderer.invoke("get-game-status"),

  /**
   * Updates keys in worker.json (mode, type, etc.)
   */
  updateWorker: (data: { path: string; updates: Record<string, any> }) =>
    ipcRenderer.invoke("update-worker", data),

  // === UTILS & EVENTS ===

  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),

  onDownloadProgress: (callback: (progress: number) => void) => {
    // Remove existing listeners to prevent duplicate progress bars
    ipcRenderer.removeAllListeners("download-progress");
    ipcRenderer.on("download-progress", (_event, progress) => {
      callback(progress);
    });
  },

  // === UPDATER (AutoUpdater) ===

  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Helper to listen to general update events
  onUpdateEvent: (callback: (channel: string, data: any) => void) => {
    const channels = [
      "checking-for-update",
      "update-available",
      "update-not-available",
      "update-downloaded",
      "update-error",
    ];

    channels.forEach((channel) => {
      ipcRenderer.removeAllListeners(channel); // Cleanup old
      ipcRenderer.on(channel, (_event, data) => callback(channel, data));
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
    ];
    channels.forEach((channel) => ipcRenderer.removeAllListeners(channel));
  },
};

try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  console.log("Successfully exposed electronAPI to main world");
} catch (error) {
  console.error("Failed to expose electronAPI:", error);
}
