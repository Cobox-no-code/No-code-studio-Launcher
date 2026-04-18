export interface PublishedGame {
  game_id: string;
  title: string;
  description?: string;
  genre?: string;
  status?: string;
  thumbnail_url?: string;
  file_url?: string;
  version_count?: number;
  install_count?: number;
  created_at?: string;
}

export interface PublishMetadata {
  title: string;
  description?: string;
  genre?: string;
  authorName?: string;
}

export interface PublishDirectParams {
  filePath: string; // absolute path to the game file
  thumbnailBase64: string; // data-URL or raw base64
  metadata: PublishMetadata;
}

export interface PresignParams {
  folder: "thumbnails" | "games";
  filename: string;
  mime_type: string;
}

export interface PresignResponse {
  upload_url: string;
  s3_key: string;
  public_url: string;
}

export interface UploadToS3Params {
  uploadUrl: string;
  filePath: string; // absolute local path
  mimeType: string;
}

export interface UploadToS3Result {
  success: boolean;
  error?: string;
}

export interface PublishPresignedParams {
  metadata: PublishMetadata;
  thumbnailUrl: string; // public_url from presign + PUT flow
  fileUrl: string; // public_url from presign + PUT flow
}

export interface UpdatePublishedGameParams {
  gameId: string;
  metadata: Partial<PublishMetadata>;
  // If user picked a new thumbnail, provide it as a local file path
  newThumbnailPath?: string;
}

export interface PublishVersionParams {
  gameId: string;
  filePath: string; // new version's game file
  versionLabel?: string; // optional user-provided label
}

export interface PublishResult {
  success: boolean;
  game?: PublishedGame;
  error?: string;
}

export interface UploadProgressEvent {
  kind: "thumbnail" | "game" | "version";
  percent: number;
  bytesTransferred?: number;
  bytesTotal?: number;
}
