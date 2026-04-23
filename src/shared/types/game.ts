export interface GameStatus {
  installed: boolean;
  path: string | null;
  version: string | null;
}

export interface DownloadGameParams {
  url: string;
  targetDir: string;
}

export interface DownloadLiveGameParams {
  url: string;
  gameId: string;
  title: string;
}

export interface LiveGameDownloadStatus {
  downloaded: boolean;
  path: string | null;
}

export interface LaunchResult {
  success: boolean;
  error?: string;
}

export interface LiveGameDownloadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface DeleteLiveGameResult {
  success: boolean;
  error?: string;
}

export interface ServerVersionData {
  id?: number;
  title?: string;
  version: string;
  link: string;
  created_at?: string;
}
export type StudioIntent = "world" | "game";

export interface LaunchWithIntentParams {
  intent: StudioIntent;
}

export interface LaunchWithIntentResult {
  success: boolean;
  intent?: StudioIntent;
  error?: string;
}

export interface LiveGameDownloadParams {
  url: string;
  gameId: string;
  title: string;
}

export interface LiveGameDownloadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface LiveGameDownloadProgress {
  gameId: string;
  percent: number;
}

export interface LiveGameStatus {
  downloaded: boolean;
  path: string | null;
}

export interface PlayLiveGameParams {
  gameId: string;
  savPath: string;
}

export interface PlayLiveGameResult {
  success: boolean;
  error?: string;
}

export interface LocalLibraryGame {
  id: string;
  name: string;
  fileName: string;
  path: string;
  createdAt: string;
  size: number;
}
