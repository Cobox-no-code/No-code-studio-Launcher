import { BrowserWindow } from "electron";
import extract from "extract-zip";
import fs from "fs";
import https from "https";
import path from "path";

import { ensureDir } from "@main/persistence/paths";
import { workerStore } from "@main/persistence/worker.store";
import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { IPC } from "@shared/types/ipc-contract";

const EXE_NAME = "NoCodeStudio.exe";

function findExeRecursive(dir: string): string | null {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      const r = findExeRecursive(full);
      if (r) return r;
    } else if (f.name === EXE_NAME) {
      return full;
    }
  }
  return null;
}

/**
 * Download a game archive, extract, locate the exe, persist its path.
 * Pushes progress to renderer via IPC.games.downloadProgress channel.
 */
export function downloadAndExtractGame(
  params: { url: string; targetDir: string },
  getWin: () => BrowserWindow | null,
): Promise<string> {
  const { url, targetDir } = params;
  if (!url || !targetDir) {
    return Promise.reject(new Error("download: missing url or targetDir"));
  }

  const zipPath = path.join(targetDir, "Archive.zip");
  const extractPath = path.join(targetDir, "GameFiles");
  ensureDir(targetDir);

  return new Promise<string>((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);

    const cleanup = (err?: Error) => {
      try {
        file.destroy();
      } catch {
        /* noop */
      }
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch {
        /* best-effort */
      }
      if (err) reject(err);
    };

    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        cleanup(new Error(`Download failed: HTTP ${res.statusCode}`));
        return;
      }

      const total = parseInt(res.headers["content-length"] || "0", 10);
      let downloaded = 0;

      res.on("data", (chunk) => {
        downloaded += chunk.length;
        const pct = total > 0 ? (downloaded / total) * 100 : 0;
        safeSend(getWin(), IPC.games.downloadProgress, pct);
      });

      res.pipe(file);

      file.on("finish", () => {
        file.close(async (closeErr) => {
          if (closeErr) return cleanup(closeErr);
          try {
            await extract(zipPath, { dir: extractPath });
            try {
              fs.unlinkSync(zipPath);
            } catch {
              /* best-effort */
            }

            const exePath = findExeRecursive(extractPath);
            if (!exePath) {
              throw new Error(`${EXE_NAME} not found after extraction`);
            }

            workerStore.update({ gamePath: exePath });
            log.info("Game installed at:", exePath);
            resolve(exePath);
          } catch (err) {
            cleanup(err instanceof Error ? err : new Error(String(err)));
          }
        });
      });

      file.on("error", cleanup);
      res.on("error", cleanup);
    });

    req.on("error", cleanup);
  });
}
