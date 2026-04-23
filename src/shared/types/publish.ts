export interface PublishCategory {
  category_id: string;
  name: string;
  slug: string;
  game_count?: number;
}

export type PublishedStatus =
  | "live"
  | "pending"
  | "rejected"
  | "draft"
  | "suspended";

export interface PublishedGame {
  game_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  category_name: string | null;
  status: PublishedStatus;
  is_featured: boolean;
  is_reward_eligible: boolean;
  install_count: number;
  rating_avg: string | number;
  created_at: string;
  published_at: string | null;
  current_version: string | null;
  file_url?: string | null;
}
export interface PublishGamePayload {
  sourceSavPath: string;
  title: string;
  description: string;
  categoryId: string;
  thumbnailBase64: string;
  localGameId: string;
}

export interface UpdatePublishedGamePayload {
  gameId: string;
  title?: string;
  description?: string;
  categoryId?: string;
  thumbnailBase64?: string | null;
}

export interface PublishResult {
  success: boolean;
  data?: PublishedGame;
  error?: string;
}

export interface DeletePublishedResult {
  success: boolean;
  error?: string;
}

export interface PublishMetadata {
  title: string;
  description?: string;
  genre?: string;
  authorName?: string;
  categoryId?: string;
}

export interface PublishDirectParams {
  filePath: string;
  thumbnailBase64?: string; // legacy — kept for backwards compat
  thumbnailPath?: string; // preferred — absolute path to a staged thumbnail
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
