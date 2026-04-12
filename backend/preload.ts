// preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

console.log("Preload script loading...");

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
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
    genre?: string;
    token?: string;
  };
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateStatePayload {
  status:
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "downloaded"
    | "error";
  version: string | null;
  percent: number;
  error: string | null;
}

interface ElectronAPI {
  // Game install
  getServerVersion: () => Promise<ServerVersionData | null>;
  chooseInstallPath: () => Promise<string | null>;
  downloadGame: (params: { url: string; targetDir: string }) => Promise<string>;
  launchGame: () => Promise<{ success: boolean; error?: string }>;
  getGameInstallationStatus: () => Promise<GameStatus>;
  checkGameInstallation: (gamePath: string) => Promise<GameStatus>;
  getDefaultInstallPath: () => Promise<string>;

  // Config
  updateWorker: (data: {
    path: string;
    updates: Record<string, any>;
  }) => Promise<{ success: boolean }>;
  createSecret: (data: Record<string, any>) => Promise<{ success: boolean }>;
  updateSecret: (data: Record<string, any>) => Promise<{ success: boolean }>;

  // Util
  openExternal: (url: string) => Promise<{ success: boolean }>;

  // Game download progress (separate from updater progress)
  onDownloadProgress: (callback: (progress: number) => void) => void;

  // Launcher auto-updater
  checkForUpdates: () => Promise<{
    success: boolean;
    updateInfo: { version: string } | null;
  }>;
  downloadUpdate: () => Promise<{ success: boolean; message?: string }>;
  installUpdate: () => Promise<{ success: boolean; message?: string }>;

  // ── Polling endpoint — the RELIABLE way to get update state ──────────────
  // Renderer calls this every 800ms. Main process always has correct state.
  getUpdateState: () => Promise<UpdateStatePayload>;

  // ── Push events — best-effort, may miss if renderer not mounted in time ──
  // onUpdateEvent subscribes to "update-state-changed" push from main process.
  // Always pair with getUpdateState polling as a fallback.
  onUpdateEvent: (callback: (channel: string, data: any) => void) => void;
  removeUpdateListeners: () => void;

  // Publish
  publishGameFull: (payload: PublishGamePayload) => Promise<IpcResponse>;

  // Live games
  downloadLiveGame: (params: {
    url: string;
    gameId: string;
    title: string;
  }) => Promise<{ success: boolean; path: string; error?: string }>;
  checkDownloadStatus: (
    gameIds: string[],
  ) => Promise<Record<string, { downloaded: boolean; path: string | null }>>;
  deleteLiveGame: (params: {
    gameId: string;
  }) => Promise<{ success: boolean; error?: string }>;
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

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6: Keep _listenerMap OUTSIDE the exposed object entirely.
// contextBridge cannot safely clone a Map — it serializes as {} in some
// Electron versions, making .get() throw "not a function" in the renderer.
// Keeping it in preload module scope (never exposed) avoids this entirely.
// ─────────────────────────────────────────────────────────────────────────────
const _listenerMap = new Map<
  string,
  (event: IpcRendererEvent, ...args: any[]) => void
>();

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2 + 4: ONLY the channels that main process actually sends as push events.
// Removed: "update-worker", "update-secret", "create-secret", "publish-game-full",
//          "download-live-game", "check-download-status", "delete-live-game",
//          "download-update" — these are invoke channels, not push channels.
// Removed: "download-progress" — used by game installer, NOT the updater.
//          Game progress = plain number. Update progress = UpdateStatePayload.
//          Mixing them corrupted update state.
// Added:   "update-state-changed" — the ONE channel our new main.ts uses.
// ─────────────────────────────────────────────────────────────────────────────
const UPDATE_PUSH_CHANNELS = [
  "update-state-changed", // ← the unified channel our main.ts sends
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// API object — only plain functions and plain values exposed here.
// ─────────────────────────────────────────────────────────────────────────────
const electronAPI: ElectronAPI = {
  // ── Game install ──────────────────────────────────────────────────────────
  getServerVersion: () => ipcRenderer.invoke("get-server-version"),

  chooseInstallPath: () => ipcRenderer.invoke("choose-install-path"),

  downloadGame: (params) => ipcRenderer.invoke("download-game", params),

  launchGame: () => ipcRenderer.invoke("launch-game"),

  getGameInstallationStatus: () => ipcRenderer.invoke("get-game-status"),

  checkGameInstallation: (gamePath) =>
    ipcRenderer.invoke("check-game-installation", gamePath),

  getDefaultInstallPath: () => ipcRenderer.invoke("get-default-install-path"),

  // ── Config ────────────────────────────────────────────────────────────────
  updateWorker: (data) => ipcRenderer.invoke("update-worker", data),

  createSecret: (data) => ipcRenderer.invoke("create-secret", data),

  updateSecret: (data) => ipcRenderer.invoke("update-secret", data),

  // ── Util ──────────────────────────────────────────────────────────────────
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // ── Game download progress ────────────────────────────────────────────────
  // FIX 4: Completely separate from update progress.
  // This receives plain numbers (0-100) from the game installer.
  onDownloadProgress: (callback) => {
    ipcRenderer.removeAllListeners("download-progress");
    ipcRenderer.on("download-progress", (_event, progress: number) => {
      callback(progress);
    });
  },

  // ── Launcher auto-updater (invoke) ────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),

  downloadUpdate: () => ipcRenderer.invoke("download-update"),

  installUpdate: () => ipcRenderer.invoke("install-update"),

  // ── Polling endpoint — RELIABLE fallback (always works) ──────────────────
  getUpdateState: () => ipcRenderer.invoke("get-update-state"),

  // ── Push event subscription ───────────────────────────────────────────────
  // FIX 1 + 2: Subscribes ONLY to "update-state-changed".
  // FIX 6: Uses module-scope _listenerMap (not exposed through contextBridge).
  // Safe to call multiple times — always removes previous listener first,
  // so only ONE listener per channel is ever active.
  onUpdateEvent: (callback) => {
    UPDATE_PUSH_CHANNELS.forEach((channel) => {
      // Remove previous listener for this channel if it exists
      const prev = _listenerMap.get(channel);
      if (prev) {
        ipcRenderer.removeListener(channel, prev);
        _listenerMap.delete(channel);
      }

      // Create and register new listener
      const listener = (_event: IpcRendererEvent, data: any) => {
        callback(channel, data);
      };
      ipcRenderer.on(channel, listener);
      _listenerMap.set(channel, listener);
    });
  },

  // ── Remove all push listeners ─────────────────────────────────────────────
  // FIX 5: Only removes actual push channels, not invoke channels.
  // Renamed from removeUpdateListener → removeUpdateListeners (plural) to
  // force a TypeScript error if old callers still exist.
  removeUpdateListeners: () => {
    UPDATE_PUSH_CHANNELS.forEach((channel) => {
      const listener = _listenerMap.get(channel);
      if (listener) {
        ipcRenderer.removeListener(channel, listener);
        _listenerMap.delete(channel);
      }
    });
  },

  // ── Publish ───────────────────────────────────────────────────────────────
  publishGameFull: (payload) =>
    ipcRenderer.invoke("publish-game-full", payload),

  // ── Live games ────────────────────────────────────────────────────────────
  downloadLiveGame: (data) => ipcRenderer.invoke("download-live-game", data),

  checkDownloadStatus: (gameIds) =>
    ipcRenderer.invoke("check-download-status", gameIds),

  deleteLiveGame: (data) => ipcRenderer.invoke("delete-live-game", data),

  getLocalLibraryGames: () => ipcRenderer.invoke("get-local-library-games"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Expose to renderer — wrapped in try/catch so preload errors are surfaced
// clearly in the log rather than silently breaking window.electronAPI.
// ─────────────────────────────────────────────────────────────────────────────
try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  console.log("electronAPI exposed to main world successfully");
} catch (error) {
  console.error("FATAL: Failed to expose electronAPI:", error);
}
