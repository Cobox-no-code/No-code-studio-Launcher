// preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

console.log("Preload script is loading...");
interface ServerVersionData {
  version: string;
  link: string; // The download URL
}

interface GameStatus {
  installed: boolean;
  path?: string;
  version?: string;
}
export interface PublishGamePayload {
  filePath: string; // The absolute system path (e.g., /Users/sarthak/Downloads/game.sav)
  thumbnailBase64: string; // The base64 string from the preview state
  metadata: {
    id: string | number;
    userId: string | number;
    title: string;
    authorName: string;
    description: string;
    token?: string; // JWT for API authentication
  };
}

// The response received from the Electron Main process
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ElectronAPI {
  getServerVersion: () => Promise<ServerVersionData | null>;
  chooseInstallPath: () => Promise<string | null>;
  downloadGame: (params: { url: string; targetDir: string }) => Promise<string>;
  launchGame: () => Promise<{ success: boolean; error?: string }>;
  getGameInstallationStatus: () => Promise<GameStatus>;
  updateWorker: (data: {
    path: string;
    updates: Record<string, any>;
  }) => Promise<{ success: boolean }>;
  createSecret: (data: Record<string, any>) => Promise<{ success: boolean }>;
  updateSecret: (data: Record<string, any>) => Promise<{ success: boolean }>;
  // Utils
  openExternal: (url: string) => Promise<{ success: boolean }>;
  onDownloadProgress: (callback: (progress: number) => void) => void;

  // Updater
  checkForUpdates: () => Promise<any>;
  installUpdate: () => Promise<void>;
  onUpdateEvent: (callback: (channel: string, data: any) => void) => void;
  removeUpdateListener: () => void;
  publishGameFull: (payload: PublishGamePayload) => Promise<IpcResponse>;
  getLocalLibraryGames: () => Promise<
    Array<{
      id: string;
      name: string;
      path: string;
      createdAt: Date;
      modifiedAt: Date;
    }>
  >;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
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
  publishGameFull: (payload: PublishGamePayload): Promise<IpcResponse> =>
    ipcRenderer.invoke("publish-game-full", payload),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  /**
   * Downloads a game and saves it to the /live_games folder
   * @param {Object} data - { url, gameId, title }
   */
  downloadLiveGame: (data) => ipcRenderer.invoke("download-live-game", data),

  /**
   * Checks the download status for an array of game IDs
   * @param {Array<string>} gameIds - List of IDs to check locally
   */
  checkDownloadStatus: (gameIds) =>
    ipcRenderer.invoke("check-download-status", gameIds),

  getLocalLibraryGames: (): Promise<
    Array<{
      id: string;
      name: string;
      path: string;
      createdAt: Date;
      modifiedAt: Date;
    }>
  > => ipcRenderer.invoke("get-local-library-games"),

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
      "publish-game-full",
      "download-live-game",
      "check-download-status",
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
      "publish-game-full",
      "download-live-game",
      "check-download-status",
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
