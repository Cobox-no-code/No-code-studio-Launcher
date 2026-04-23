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
  PublishDirectParams,
  PublishResult,
  UploadProgressEvent,
} from "@shared/types/publish";

function broadcastProgress(
  getWin: () => BrowserWindow | null,
  event: UploadProgressEvent,
) {
  safeSend(getWin(), IPC.publish.uploadProgress, event);
}

/**
 * POST /api/published-games as multipart/form-data with the game file + thumbnail.
 * Used for small uploads that fit under backend body size limits.
 */
export async function publishDirect(
  params: PublishDirectParams,
  getWin: () => BrowserWindow | null,
): Promise<PublishResult> {
  try {
    if (!fs.existsSync(params.filePath)) {
      return { success: false, error: "Game file not found" };
    }

    const form = new FormData();

    // ── Game file ─────────────────────────────────────────────────────
    form.append("game_file", fs.createReadStream(params.filePath), {
      filename: path.basename(params.filePath),
    });

    // ── Thumbnail — prefer path, fall back to base64 for legacy callers ───
    if (params.thumbnailPath) {
      if (!fs.existsSync(params.thumbnailPath)) {
        return { success: false, error: "Thumbnail file not found" };
      }
      form.append("thumbnail", fs.createReadStream(params.thumbnailPath), {
        filename: path.basename(params.thumbnailPath),
      });
    } else if (params.thumbnailBase64) {
      const cleaned = params.thumbnailBase64.replace(
        /^data:image\/\w+;base64,/,
        "",
      );
      const buffer = Buffer.from(cleaned, "base64");
      form.append("thumbnail", buffer, {
        filename: `${params.metadata.title || "thumbnail"}.png`,
        contentType: "image/png",
      });
    } else {
      return { success: false, error: "Thumbnail required" };
    }

    // ── Text fields ───────────────────────────────────────────────────
    form.append("title", params.metadata.title);
    form.append("display_name", params.metadata.title);
    if (params.metadata.description)
      form.append("description", params.metadata.description);
    if (params.metadata.genre) form.append("genre", params.metadata.genre);
    if (params.metadata.categoryId)
      form.append("category_id", params.metadata.categoryId);

    // ── Total size for progress ───────────────────────────────────────
    const gameSize = fs.statSync(params.filePath).size;
    const thumbSize = params.thumbnailPath
      ? fs.statSync(params.thumbnailPath).size
      : 0;
    const total = gameSize + thumbSize;

    // ── POST ──────────────────────────────────────────────────────────
    const res = await http.post("/published-games", form, {
      headers: { ...form.getHeaders(), ...authHeader() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (e) => {
        const sent = e.loaded ?? 0;
        const percent = total > 0 ? Math.min(100, (sent / total) * 100) : 0;
        safeSend(getWin(), IPC.publish.uploadProgress, {
          kind: "game",
          percent,
          bytesTransferred: sent,
          bytesTotal: total,
        });
      },
    });
    log.info("[publishDirect] file sizes:", {
      gamePath: params.filePath,
      gameExists: fs.existsSync(params.filePath),
      gameSize: fs.existsSync(params.filePath)
        ? fs.statSync(params.filePath).size
        : -1,
      thumbPath: params.thumbnailPath,
      thumbSize:
        params.thumbnailPath && fs.existsSync(params.thumbnailPath)
          ? fs.statSync(params.thumbnailPath).size
          : -1,
    });
    return { success: true, game: res.data?.game };
  } catch (err: unknown) {
    const backend = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    const msg =
      backend ?? (err instanceof Error ? err.message : "Direct publish failed");
    log.error("publishDirect error:", msg);
    return { success: false, error: msg };
  }
}
