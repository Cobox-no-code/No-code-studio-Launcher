import { AuthState, StartLoginResult } from "@shared/types/auth";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { IPC } from "../shared/ipc-contract";
import type {
  DeleteLiveGameResult,
  DownloadGameParams,
  DownloadLiveGameParams,
  GameStatus,
  LaunchResult,
  LiveGameDownloadResult,
  LiveGameDownloadStatus,
  LocalLibraryGame,
  ServerVersionData,
} from "../shared/types/game";
import type { IpcResponse } from "../shared/types/ipc";
import type {
  PresignParams,
  PresignResponse,
  PublishDirectParams,
  PublishedGame,
  PublishPresignedParams,
  PublishResult,
  PublishVersionParams,
  UpdatePublishedGameParams,
  UploadProgressEvent,
  UploadToS3Params,
  UploadToS3Result,
} from "../shared/types/publish";
import type {
  UpdateCheckResult,
  UpdateStatePayload,
} from "../shared/types/update";
const _listenerMap = new Map<
  string,
  (event: IpcRendererEvent, ...args: unknown[]) => void
>();

function subscribe(
  channel: string,
  handler: (data: unknown) => void,
): () => void {
  const prev = _listenerMap.get(channel);
  if (prev) ipcRenderer.removeListener(channel, prev);

  const listener = (_e: IpcRendererEvent, data: unknown) => handler(data);
  ipcRenderer.on(channel, listener);
  _listenerMap.set(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
    _listenerMap.delete(channel);
  };
}

const api = {
  updater: {
    check: (): Promise<UpdateCheckResult> =>
      ipcRenderer.invoke(IPC.updater.check),
    download: (): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC.updater.download),
    install: (): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC.updater.install),
    getState: (): Promise<UpdateStatePayload> =>
      ipcRenderer.invoke(IPC.updater.getState),
    onStateChanged: (cb: (s: UpdateStatePayload) => void): (() => void) =>
      subscribe(IPC.updater.stateChanged, (d) => cb(d as UpdateStatePayload)),
  },

  games: {
    getServerVersion: (): Promise<ServerVersionData | null> =>
      ipcRenderer.invoke(IPC.games.getServerVersion),
    getDefaultInstallPath: (): Promise<string> =>
      ipcRenderer.invoke(IPC.games.getDefaultInstallPath),
    chooseInstallPath: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC.games.chooseInstallPath),

    download: (params: DownloadGameParams): Promise<string> =>
      ipcRenderer.invoke(IPC.games.download, params),
    onDownloadProgress: (cb: (percent: number) => void): (() => void) =>
      subscribe(IPC.games.downloadProgress, (d) => cb(d as number)),

    launch: (): Promise<LaunchResult> => ipcRenderer.invoke(IPC.games.launch),
    getStatus: (): Promise<GameStatus> =>
      ipcRenderer.invoke(IPC.games.getStatus),
    checkInstallation: (gamePath: string): Promise<GameStatus> =>
      ipcRenderer.invoke(IPC.games.checkInstallation, gamePath),

    downloadLive: (
      params: DownloadLiveGameParams,
    ): Promise<LiveGameDownloadResult> =>
      ipcRenderer.invoke(IPC.games.downloadLive, params),
    checkDownloadStatus: (
      ids: string[],
    ): Promise<Record<string, LiveGameDownloadStatus>> =>
      ipcRenderer.invoke(IPC.games.checkDownloadStatus, ids),
    deleteLive: (gameId: string): Promise<DeleteLiveGameResult> =>
      ipcRenderer.invoke(IPC.games.deleteLive, { gameId }),
    getLocalLibrary: (): Promise<LocalLibraryGame[]> =>
      ipcRenderer.invoke(IPC.games.getLocalLibrary),
  },

  auth: {
    getState: (): Promise<AuthState> => ipcRenderer.invoke(IPC.auth.getState),
    onStateChanged: (cb: (s: AuthState) => void): (() => void) =>
      subscribe(IPC.auth.stateChanged, (d) => cb(d as AuthState)),

    startLogin: (): Promise<StartLoginResult> =>
      ipcRenderer.invoke(IPC.auth.startLogin),
    cancelLogin: (): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC.auth.cancelLogin),
    refresh: (): Promise<IpcResponse> => ipcRenderer.invoke(IPC.auth.refresh),
    logout: (): Promise<IpcResponse> => ipcRenderer.invoke(IPC.auth.logout),

    openExternal: (url: string): Promise<IpcResponse> =>
      ipcRenderer.invoke(IPC.auth.openExternal, url),
  },

  publish: {
    listMine: (): Promise<PublishedGame[]> =>
      ipcRenderer.invoke(IPC.publish.listMine),

    publishDirect: (params: PublishDirectParams): Promise<PublishResult> =>
      ipcRenderer.invoke(IPC.publish.publishDirect, params),

    presign: (params: PresignParams): Promise<PresignResponse> =>
      ipcRenderer.invoke(IPC.publish.presign, params),

    uploadToS3: (
      params: UploadToS3Params & { kind: UploadProgressEvent["kind"] },
    ): Promise<UploadToS3Result> =>
      ipcRenderer.invoke(IPC.publish.uploadToS3, params),

    publishPresigned: (
      params: PublishPresignedParams,
    ): Promise<PublishResult> =>
      ipcRenderer.invoke(IPC.publish.publishPresigned, params),

    update: (params: UpdatePublishedGameParams): Promise<PublishResult> =>
      ipcRenderer.invoke(IPC.publish.update, params),

    delete: (gameId: string): Promise<PublishResult> =>
      ipcRenderer.invoke(IPC.publish.delete, gameId),

    createVersion: (params: PublishVersionParams): Promise<PublishResult> =>
      ipcRenderer.invoke(IPC.publish.createVersion, params),

    onUploadProgress: (cb: (e: UploadProgressEvent) => void): (() => void) =>
      subscribe(IPC.publish.uploadProgress, (d) =>
        cb(d as UploadProgressEvent),
      ),
  },
};

export type CoboxAPI = typeof api;

try {
  contextBridge.exposeInMainWorld("cobox", api);
  console.log("cobox API exposed (updater + games + auth + publish)");
} catch (err) {
  console.error("FATAL: preload exposure failed:", err);
}
