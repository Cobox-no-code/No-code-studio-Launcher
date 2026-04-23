import {
  AppVersionInfo,
  ProfileUpdateParams,
  ProfileUpdateResult,
} from "./app";
import type { AuthState, StartLoginResult } from "./auth";
import { BootstrapState } from "./bootstrap";
import type {
  DeleteLiveGameResult,
  DownloadGameParams,
  DownloadLiveGameParams,
  GameStatus,
  LaunchResult,
  LaunchWithIntentParams,
  LaunchWithIntentResult,
  LiveGameDownloadParams,
  LiveGameDownloadProgress,
  LiveGameDownloadResult,
  LiveGameDownloadStatus,
  LiveGameStatus,
  LocalLibraryGame,
  PlayLiveGameParams,
  PlayLiveGameResult,
  ServerVersionData,
} from "./game";
import type { IpcResponse } from "./ipc";
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
} from "./publish";
import type { UpdateCheckResult, UpdateStatePayload } from "./update";

/**
 * The full shape of `window.cobox` — the single source of truth for what
 * the preload exposes and what the renderer can call.
 *
 * Lives in `shared/` so both the preload (which implements it) and the
 * renderer (which consumes it) can import it without crossing TS project
 * boundaries.
 */
export interface CoboxAPI {
  updater: {
    check(): Promise<UpdateCheckResult>;
    download(): Promise<IpcResponse>;
    install(): Promise<IpcResponse>;
    getState(): Promise<UpdateStatePayload>;
    onStateChanged(cb: (s: UpdateStatePayload) => void): () => void;
  };

  games: {
    getServerVersion(): Promise<ServerVersionData | null>;
    getDefaultInstallPath(): Promise<string>;
    chooseInstallPath(): Promise<string | null>;

    download(params: DownloadGameParams): Promise<string>;
    onDownloadProgress(cb: (percent: number) => void): () => void;

    launch(): Promise<LaunchResult>;
    getStatus(): Promise<GameStatus>;
    checkInstallation(gamePath: string): Promise<GameStatus>;

    downloadLive(
      params: DownloadLiveGameParams,
    ): Promise<LiveGameDownloadResult>;
    checkDownloadStatus(
      ids: string[],
    ): Promise<Record<string, LiveGameDownloadStatus>>;
    deleteLive(gameId: string): Promise<DeleteLiveGameResult>;
    getLibrary(): Promise<LocalLibraryGame[]>;
    launchWithIntent(
      params: LaunchWithIntentParams,
    ): Promise<LaunchWithIntentResult>;
    getLibrary(): Promise<LocalLibraryGame[]>;
    liveGames: {
      download(params: LiveGameDownloadParams): Promise<LiveGameDownloadResult>;
      checkStatus(gameIds: string[]): Promise<Record<string, LiveGameStatus>>;
      delete(gameId: string): Promise<{ success: boolean; error?: string }>;
      play(params: PlayLiveGameParams): Promise<PlayLiveGameResult>;
      onDownloadProgress(
        cb: (data: LiveGameDownloadProgress) => void,
      ): () => void;
    };
  };

  auth: {
    getState(): Promise<AuthState>;
    onStateChanged(cb: (s: AuthState) => void): () => void;
    getToken(): Promise<string | null>;
    startLogin(): Promise<StartLoginResult>;
    cancelLogin(): Promise<IpcResponse>;
    refresh(): Promise<IpcResponse>;
    logout(): Promise<IpcResponse>;
    openExternal(url: string): Promise<IpcResponse>;
  };

  publish: {
    listMine(): Promise<PublishedGame[]>;
    publishDirect(params: PublishDirectParams): Promise<PublishResult>;
    stageThumbnail(params: {
      bytes: Uint8Array;
      originalName: string;
      mimeType: string;
    }): Promise<{ filePath: string; mimeType: string; size: number }>;

    presign(params: PresignParams): Promise<PresignResponse>;
    uploadToS3(
      params: UploadToS3Params & { kind: UploadProgressEvent["kind"] },
    ): Promise<UploadToS3Result>;
    publishPresigned(params: PublishPresignedParams): Promise<PublishResult>;

    update(params: UpdatePublishedGameParams): Promise<PublishResult>;
    delete(gameId: string): Promise<PublishResult>;
    createVersion(params: PublishVersionParams): Promise<PublishResult>;

    onUploadProgress(cb: (e: UploadProgressEvent) => void): () => void;
  };
  bootstrap: {
    getState(): Promise<BootstrapState>;
    onStateChanged(cb: (s: BootstrapState) => void): () => void;
    markIntroDone(): Promise<IpcResponse>;
    skipToLogin(): Promise<IpcResponse>;
    retry(): Promise<IpcResponse>;
    markFirstRunComplete(): Promise<IpcResponse>;
  };
  app: {
    getVersion(): Promise<AppVersionInfo>;
    openDataFolder(): Promise<IpcResponse>;
    clearCache(): Promise<IpcResponse>;
  };
  profile: {
    update(params: ProfileUpdateParams): Promise<ProfileUpdateResult>;
  };
}
