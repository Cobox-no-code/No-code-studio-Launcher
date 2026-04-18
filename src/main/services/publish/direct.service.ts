import fs from "fs";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import { BrowserWindow } from "electron";

import { http } from "@main/http/client";
import { authHeader } from "@main/http/auth-header";
import { safeSend } from "@main/utils/safe-send";
import { log } from "@main/utils/logger";
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
  const { filePath, thumbnailBase64, metadata } = params;

  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "Game file not found" };
    }

    const form = new FormData();
    const gameId = uuidv4();
    form.append("game_id", gameId);
    form.append("display_name", metadata.title);
    form.append("title", metadata.title);
    if (metadata.description) form.append("description", metadata.description);
    if (metadata.genre) form.append("genre", metadata.genre);

    form.append("game_file", fs.createReadStream(filePath));

    const b64 = thumbnailBase64.replace(/^data:image\/\w+;base64,/, "");
    const thumbBuffer = Buffer.from(b64, "base64");
    form.append("thumbnail", thumbBuffer, {
      filename: `${metadata.title}.png`,
      contentType: "image/png",
    });

    const totalBytes = fs.statSync(filePath).size + thumbBuffer.byteLength;
    let sentBytes = 0;

    const res = await http.post("/published-games", form, {
      headers: {
        ...form.getHeaders(),
        ...authHeader(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (e) => {
        sentBytes = e.loaded ?? sentBytes;
        const percent =
          totalBytes > 0 ? Math.min(100, (sentBytes / totalBytes) * 100) : 0;
        broadcastProgress(getWin, {
          kind: "game",
          percent,
          bytesTransferred: sentBytes,
          bytesTotal: totalBytes,
        });
      },
    });

    log.info("publishDirect success:", res.data?.game?.game_id);
    return { success: true, game: res.data?.game };
  } catch (err: unknown) {
    const backend = (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    const msg =
      backend ?? (err instanceof Error ? err.message : "Publish failed");
    log.error("publishDirect error:", msg);
    return { success: false, error: msg };
  }
}
