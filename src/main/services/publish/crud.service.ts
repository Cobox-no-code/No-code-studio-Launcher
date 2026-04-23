import { BrowserWindow } from "electron";
import FormData from "form-data";
import fs from "fs";
import path from "path";

import { authHeader } from "@main/http/auth-header";
import { http } from "@main/http/client";
import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { IPC } from "@shared/ipc-contract";
import type {
  PublishedGame,
  PublishResult,
  PublishVersionParams,
  UpdatePublishedGameParams,
  UploadProgressEvent,
} from "@shared/types/publish";
import { getPresignedUrl, uploadToS3 } from "./presigned.service";

function broadcastProgress(
  getWin: () => BrowserWindow | null,
  event: UploadProgressEvent,
) {
  safeSend(getWin(), IPC.publish.uploadProgress, event);
}

export async function listMyPublishedGames(): Promise<PublishedGame[]> {
  try {
    const res = await http.get("/published-games/my", {
      headers: authHeader(),
    });

    return (res.data as PublishedGame[]) ?? [];
  } catch (err) {
    log.error("listMyPublishedGames error:", err);
    return [];
  }
}

export async function updatePublishedGame(
  params: UpdatePublishedGameParams,
  getWin: () => BrowserWindow | null,
): Promise<PublishResult> {
  try {
    const { metadata, newThumbnailPath, gameId } = params;

    // 1. If a new thumbnail was picked, presign + upload to S3 first
    let thumbnailUrl: string | undefined;
    if (newThumbnailPath) {
      if (!fs.existsSync(newThumbnailPath)) {
        return { success: false, error: "New thumbnail not found" };
      }

      const ext = path.extname(newThumbnailPath).toLowerCase();
      const mimeType =
        ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".webp"
              ? "image/webp"
              : "image/png";

      const presign = await getPresignedUrl({
        folder: "thumbnails",
        filename: path.basename(newThumbnailPath),
        mime_type: mimeType,
      });
      const upload = await uploadToS3(
        {
          uploadUrl: presign.upload_url,
          filePath: newThumbnailPath,
          mimeType,
        },
        "thumbnail",
        // uploadToS3 needs getWin, so crud.service needs it too:
        getWin,
      );
      if (!upload.success) {
        return {
          success: false,
          error: upload.error ?? "Thumbnail upload failed",
        };
      }

      thumbnailUrl = presign.public_url;
    }

    // 2. Build JSON body for PUT — no multipart, no binary
    const body: Record<string, unknown> = {};
    if (metadata.title !== undefined) body.title = metadata.title;
    if (metadata.description !== undefined)
      body.description = metadata.description;
    if (metadata.genre !== undefined) body.genre = metadata.genre;
    if (metadata.categoryId !== undefined)
      body.category_id = metadata.categoryId;
    if (thumbnailUrl) body.thumbnail_url = thumbnailUrl;

    const res = await http.put(`/published-games/${gameId}`, body, {
      headers: {
        ...authHeader(),
        "Content-Type": "application/json",
      },
    });
    return { success: true, game: res.data?.game };
  } catch (err: unknown) {
    const backend = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    const msg =
      backend ?? (err instanceof Error ? err.message : "Update failed");
    log.error("updatePublishedGame error:", msg);
    return { success: false, error: msg };
  }
}

export async function deletePublishedGame(
  gameId: string,
): Promise<PublishResult> {
  try {
    await http.delete(`/published-games/${gameId}`, {
      headers: authHeader(),
    });
    return { success: true };
  } catch (err: unknown) {
    const backend = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    const msg =
      backend ?? (err instanceof Error ? err.message : "Delete failed");
    log.error("deletePublishedGame error:", msg);
    return { success: false, error: msg };
  }
}

export async function createGameVersion(
  params: PublishVersionParams,
  getWin: () => BrowserWindow | null,
): Promise<PublishResult> {
  try {
    if (!fs.existsSync(params.filePath)) {
      return { success: false, error: "Version file not found" };
    }

    const form = new FormData();
    form.append("game_file", fs.createReadStream(params.filePath));
    if (params.versionLabel) form.append("version_label", params.versionLabel);

    const total = fs.statSync(params.filePath).size;

    const res = await http.post(
      `/published-games/${params.gameId}/versions`,
      form,
      {
        headers: { ...form.getHeaders(), ...authHeader() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (e) => {
          const sent = e.loaded ?? 0;
          const percent = total > 0 ? Math.min(100, (sent / total) * 100) : 0;
          broadcastProgress(getWin, {
            kind: "version",
            percent,
            bytesTransferred: sent,
            bytesTotal: total,
          });
        },
      },
    );
    return { success: true, game: res.data?.game };
  } catch (err: unknown) {
    const backend = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    const msg =
      backend ?? (err instanceof Error ? err.message : "Version upload failed");
    log.error("createGameVersion error:", msg);
    return { success: false, error: msg };
  }
}
