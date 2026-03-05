// preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

console.log("Preload script is loading...");
interface ServerVersionData {
  version: string;
  link: string;
}

interface GameStatus {
  installed: boolean;
  path?: string;
  version?: string;
}
export interface PublishGamePayload {
  filePath: string;
  thumbnailBase64: string;
  metadata: {
    id: string | number;
    userId: string | number;
    title: string;
    authorName: string;
    description: string;
    token?: string;
  };
}

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
  openExternal: (url: string) => Promise<{ success: boolean }>;
  onDownloadProgress: (callback: (progress: number) => void) => void;
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
  downloadLiveGame: (params: {
    url: string;
    gameId: string;
    title: string;
  }) => Promise<{ success: boolean; path: string; error?: string }>;
  checkDownloadStatus: (
    gameIds: string[],
  ) => Promise<Record<string, { downloaded: boolean; path: string | null }>>;
  // ── NEW ──────────────────────────────────────────────────────────────────
  deleteLiveGame: (params: {
    gameId: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const electronAPI = {
  getServerVersion: () => ipcRenderer.invoke("get-server-version"),
  chooseInstallPath: () => ipcRenderer.invoke("choose-install-path"),
  downloadGame: (params: { url: string; targetDir: string }) =>
    ipcRenderer.invoke("download-game", params),
  launchGame: () => ipcRenderer.invoke("launch-game"),
  getGameInstallationStatus: () => ipcRenderer.invoke("get-game-status"),
  checkGameInstallation: (gamePath: string) =>
    ipcRenderer.invoke("check-game-installation", gamePath),
  getDefaultInstallPath: () => ipcRenderer.invoke("get-default-install-path"),
  updateWorker: (data: { path: string; updates: Record<string, any> }) =>
    ipcRenderer.invoke("update-worker", data),
  createSecret: (data: Record<string, any>) =>
    ipcRenderer.invoke("create-secret", data),
  updateSecret: (data: Record<string, any>) =>
    ipcRenderer.invoke("update-secret", data),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  onDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.removeAllListeners("download-progress");
    ipcRenderer.on("download-progress", (_event, progress) => {
      callback(progress);
    });
  },
  publishGameFull: (payload: PublishGamePayload): Promise<IpcResponse> =>
    ipcRenderer.invoke("publish-game-full", payload),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  /**
   * Downloads a live game .sav file and stores it in /live_games
   */
  downloadLiveGame: (data) => ipcRenderer.invoke("download-live-game", data),

  /**
   * Checks download status for an array of game IDs
   */
  checkDownloadStatus: (gameIds) =>
    ipcRenderer.invoke("check-download-status", gameIds),

  /**
   * Deletes the locally downloaded .sav file for a given gameId
   */
  deleteLiveGame: (data: { gameId: string }) =>
    ipcRenderer.invoke("delete-live-game", data),

  getLocalLibraryGames: (): Promise<
    Array<{
      id: string;
      name: string;
      path: string;
      createdAt: Date;
      modifiedAt: Date;
    }>
  > => ipcRenderer.invoke("get-local-library-games"),

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
      "download-progress",
      "update-worker",
      "update-secret",
      "create-secret",
      "publish-game-full",
      "download-live-game",
      "check-download-status",
      "delete-live-game", // ← NEW
    ];

    channels.forEach((channel) => {
      const oldListener = electronAPI._updateListeners.get(channel);
      if (oldListener) ipcRenderer.removeListener(channel, oldListener);
      const listener = (_event: IpcRendererEvent, data: any) =>
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
      "update-downloaded",
      "update-error",
      "download-progress",
      "update-worker",
      "update-secret",
      "create-secret",
      "publish-game-full",
      "download-live-game",
      "check-download-status",
      "delete-live-game", // ← NEW
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
