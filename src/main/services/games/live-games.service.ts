import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { IPC } from "@shared/ipc-contract";
import { BrowserWindow } from "electron";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Where No Code Studio looks for user "live games" (.sav files).
 * Mirrors what the studio expects on disk.
 */
function liveGamesDir(): string {
  // Windows: %LOCALAPPDATA%\NoCodeStudio\Saved\SaveGames\live_games
  // macOS/Linux: ~/NoCodeStudio/Saved/SaveGames/live_games  (dev convenience)
  const base =
    process.env.LOCALAPPDATA ||
    (process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Local")
      : path.join(os.homedir(), ".cobox"));
  return path.join(base, "NoCodeStudio", "Saved", "SaveGames", "live_games");
}

function ensureDir() {
  const dir = liveGamesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeSlug(input: string): string {
  return String(input ?? "game")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()
    .slice(0, 64);
}

/**
 * Streams a .sav file for a specific game to disk.
 * Pushes 0-100 progress via IPC.games.liveGameDownloadProgress.
 */
export async function downloadLiveGame(
  params: { url: string; gameId: string; title: string },
  getWin: () => BrowserWindow | null,
): Promise<{ success: boolean; path?: string; error?: string }> {
  const { url, gameId, title } = params;
  ensureDir();

  const fileName = `${gameId}_${safeSlug(title)}.sav`;
  const targetPath = path.join(liveGamesDir(), fileName);
  const tmpPath = `${targetPath}.part`;

  try {
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}`);
    }

    const total = Number(res.headers.get("content-length") ?? 0);
    let downloaded = 0;
    let lastPct = -1;

    const writer = fs.createWriteStream(tmpPath);

    for await (const chunk of res.body) {
      writer.write(chunk);
      downloaded += chunk.length;
      if (total > 0) {
        const pct = Math.floor((downloaded / total) * 100);
        if (pct !== lastPct) {
          lastPct = pct;
          safeSend(getWin(), IPC.games.liveGameDownloadProgress, {
            gameId,
            percent: pct,
          });
        }
      }
    }
    await new Promise<void>((resolve, reject) => {
      writer.end((err: any) => (err ? reject(err) : resolve()));
    });

    // Atomic swap
    fs.renameSync(tmpPath, targetPath);
    safeSend(getWin(), IPC.games.liveGameDownloadProgress, {
      gameId,
      percent: 100,
    });

    log.info(`Downloaded live game ${gameId} -> ${targetPath}`);
    return { success: true, path: targetPath };
  } catch (err) {
    // Cleanup the .part file on failure
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      /* best-effort */
    }
    const msg = err instanceof Error ? err.message : "Download failed";
    log.error(`downloadLiveGame ${gameId} failed:`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Given a list of game_ids, returns a map of { [id]: { downloaded, path } }.
 * Used by the renderer to show correct button state on each card.
 */
export function checkDownloadStatus(
  gameIds: string[],
): Record<string, { downloaded: boolean; path: string | null }> {
  const dir = ensureDir();
  const out: Record<string, { downloaded: boolean; path: string | null }> = {};
  try {
    const files = fs.readdirSync(dir);
    for (const id of gameIds) {
      const match = files.find(
        (f) => f.startsWith(`${id}_`) && f.endsWith(".sav"),
      );
      out[id] = match
        ? { downloaded: true, path: path.join(dir, match) }
        : { downloaded: false, path: null };
    }
  } catch (err) {
    log.error("checkDownloadStatus error:", err);
    for (const id of gameIds) out[id] = { downloaded: false, path: null };
  }
  return out;
}

/**
 * Deletes a downloaded live game's .sav file.
 */
export function deleteLiveGame(gameId: string): {
  success: boolean;
  error?: string;
} {
  const dir = ensureDir();
  try {
    const files = fs.readdirSync(dir);
    const match = files.find((f) => f.startsWith(`${gameId}_`));
    if (match) fs.unlinkSync(path.join(dir, match));
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return { success: false, error: msg };
  }
}
export interface LocalLibraryGame {
  id: string;
  name: string;
  fileName: string;
  path: string;
  createdAt: string; // ISO string — Date doesn't serialize cleanly over IPC
  size: number;
}

/**
 * Scan the NoCodeStudio SaveGames folder for all .sav files
 * (both live_games/ downloads AND user-authored saves in SaveGames/ root).
 * Used to populate the player's local Library page.
 */
export function getLocalLibrary(): LocalLibraryGame[] {
  const parent = path.dirname(liveGamesDir()); // SaveGames/
  try {
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(parent).filter((f) => f.endsWith(".sav"));
    return files
      .map((file) => {
        const fullPath = path.join(parent, file);
        const stats = fs.statSync(fullPath);
        const nameNoExt = file.replace(".sav", "");
        const timestamp = stats.birthtime.getTime();
        const parts = nameNoExt.split("_");
        const displayName =
          parts.length > 1 ? parts.slice(1).join(" ") : nameNoExt;
        return {
          id: `${nameNoExt}_${timestamp}`,
          name: displayName,
          fileName: file,
          path: fullPath,
          createdAt: stats.birthtime.toISOString(),
          size: stats.size,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch (err) {
    log.error("getLocalLibrary error:", err);
    return [];
  }
}
