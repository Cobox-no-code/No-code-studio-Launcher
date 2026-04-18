import fs from "fs";
import FormData from "form-data";
import path from "path";
import { BrowserWindow } from "electron";

import { http } from "@main/http/client";
import { authHeader } from "@main/http/auth-header";
import { safeSend } from "@main/utils/safe-send";
import { log } from "@main/utils/logger";
import { IPC } from "@shared/ipc-contract";
import type {
  PublishedGame,
  PublishResult,
  UpdatePublishedGameParams,
  PublishVersionParams,
  UploadProgressEvent,
} from "@shared/types/publish";

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
): Promise<PublishResult> {
  try {
    const form = new FormData();
    const { metadata, newThumbnailPath, gameId } = params;

    if (metadata.title) form.append("title", metadata.title);
    if (metadata.description) form.append("description", metadata.description);
    if (metadata.genre) form.append("genre", metadata.genre);

    if (newThumbnailPath) {
      if (!fs.existsSync(newThumbnailPath)) {
        return { success: false, error: "New thumbnail not found" };
      }
      form.append("thumbnail", fs.createReadStream(newThumbnailPath), {
        filename: path.basename(newThumbnailPath),
      });
    }

    const res = await http.put(`/published-games/${gameId}`, form, {
      headers: { ...form.getHeaders(), ...authHeader() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
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
