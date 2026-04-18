import fs from "fs";
import path from "path";
import axios from "axios";

import type {
  DeleteLiveGameResult,
  DownloadLiveGameParams,
  LiveGameDownloadResult,
  LiveGameDownloadStatus,
  LocalLibraryGame,
} from "@shared/types/game";

import {
  liveGamesDir,
  localSaveRoot,
  ensureDir,
} from "@main/persistence/paths";
import { log } from "@main/utils/logger";

function safeName(s: string): string {
  return String(s ?? "game")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

export async function downloadLiveGame(
  params: DownloadLiveGameParams,
): Promise<LiveGameDownloadResult> {
  const dir = liveGamesDir();
  const filePath = path.join(
    dir,
    `${params.gameId}_${safeName(params.title)}.sav`,
  );

  try {
    const response = await axios.get(params.url, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return await new Promise<LiveGameDownloadResult>((resolve) => {
      writer.on("finish", () => resolve({ success: true, path: filePath }));
      writer.on("error", (err) =>
        resolve({ success: false, error: err.message }),
      );
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Download failed";
    return { success: false, error: msg };
  }
}

export function checkDownloadStatus(
  gameIds: string[],
): Record<string, LiveGameDownloadStatus> {
  const dir = liveGamesDir();
  const out: Record<string, LiveGameDownloadStatus> = {};

  try {
    const files = fs.readdirSync(dir);
    for (const id of gameIds) {
      const found = files.find((f) => f.startsWith(`${id}_`));
      out[id] = found
        ? { downloaded: true, path: path.join(dir, found) }
        : { downloaded: false, path: null };
    }
  } catch (err) {
    log.error("checkDownloadStatus error:", err);
    for (const id of gameIds) out[id] = { downloaded: false, path: null };
  }
  return out;
}

export function deleteLiveGame(gameId: string): DeleteLiveGameResult {
  try {
    const dir = liveGamesDir();
    const target = fs.readdirSync(dir).find((f) => f.startsWith(`${gameId}_`));
    if (target) fs.unlinkSync(path.join(dir, target));
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Delete failed";
    return { success: false, error: msg };
  }
}

export function getLocalLibrary(): LocalLibraryGame[] {
  try {
    const root = localSaveRoot();
    ensureDir(root);

    return fs
      .readdirSync(root)
      .filter((f) => f.endsWith(".sav"))
      .map((file): LocalLibraryGame => {
        const full = path.join(root, file);
        const stat = fs.statSync(full);
        const base = file.replace(".sav", "");
        const parts = base.split("_");
        return {
          id: `${base}_${stat.birthtime.getTime()}`,
          name: parts.length > 1 ? parts.slice(1).join(" ") : base,
          fileName: file,
          path: full,
          createdAt: stat.birthtime,
          size: stat.size,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    log.error("getLocalLibrary error:", error);
    return [];
  }
}
