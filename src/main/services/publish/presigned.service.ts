import fs from "fs";
import { BrowserWindow } from "electron";

import { http } from "@main/http/client";
import { authHeader } from "@main/http/auth-header";
import { safeSend } from "@main/utils/safe-send";
import { log } from "@main/utils/logger";
import { IPC } from "@shared/ipc-contract";
import type {
  PresignParams,
  PresignResponse,
  UploadToS3Params,
  UploadToS3Result,
  PublishPresignedParams,
  PublishResult,
  UploadProgressEvent,
} from "@shared/types/publish";
import axios from "axios";

function broadcastProgress(
  getWin: () => BrowserWindow | null,
  event: UploadProgressEvent,
) {
  safeSend(getWin(), IPC.publish.uploadProgress, event);
}

/** Ask backend for a one-time S3 PUT URL. */
export async function getPresignedUrl(
  params: PresignParams,
): Promise<PresignResponse> {
  const res = await http.post("/published-games/presign", params, {
    headers: authHeader(),
  });
  const body = res.data as PresignResponse;
  if (!body?.upload_url || !body?.public_url) {
    throw new Error("Invalid presign response");
  }
  return body;
}

/**
 * Stream a local file straight to S3 via PUT on the presigned URL.
 * We use a *separate* axios instance here (not the `http` client) because
 * S3 doesn't want our Authorization header or baseURL.
 */
export async function uploadToS3(
  params: UploadToS3Params,
  kind: UploadProgressEvent["kind"],
  getWin: () => BrowserWindow | null,
): Promise<UploadToS3Result> {
  try {
    if (!fs.existsSync(params.filePath)) {
      return { success: false, error: "File not found for upload" };
    }

    const stat = fs.statSync(params.filePath);
    const stream = fs.createReadStream(params.filePath);

    await axios.put(params.uploadUrl, stream, {
      headers: {
        "Content-Type": params.mimeType,
        "Content-Length": stat.size,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (e) => {
        const sent = e.loaded ?? 0;
        const percent =
          stat.size > 0 ? Math.min(100, (sent / stat.size) * 100) : 0;
        broadcastProgress(getWin, {
          kind,
          percent,
          bytesTransferred: sent,
          bytesTotal: stat.size,
        });
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "S3 upload failed";
    log.error("uploadToS3 error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * After thumbnail + game file are already on S3 (via presigned PUTs),
 * create the DB record pointing at the public URLs.
 */
export async function publishPresigned(
  params: PublishPresignedParams,
): Promise<PublishResult> {
  try {
    const res = await http.post(
      "/published-games",
      {
        title: params.metadata.title,
        description: params.metadata.description,
        genre: params.metadata.genre,
        thumbnail_url: params.thumbnailUrl,
        file_url: params.fileUrl,
      },
      { headers: { ...authHeader(), "Content-Type": "application/json" } },
    );
    return { success: true, game: res.data?.game };
  } catch (err: unknown) {
    const backend = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    const msg =
      backend ?? (err instanceof Error ? err.message : "Publish record failed");
    log.error("publishPresigned error:", msg);
    return { success: false, error: msg };
  }
}
