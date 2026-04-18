import fs from "fs";
import { log } from "@main/utils/logger";

/**
 * Atomic JSON write: write to .tmp, then rename.
 * Rename is atomic on both POSIX and NTFS, so a crash mid-write
 * leaves either the old file intact or the fully-written new file.
 */
export function atomicWriteJson(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

export function readJsonOrEmpty<T extends object>(filePath: string): T {
  if (!fs.existsSync(filePath)) return {} as T;
  try {
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw) return {} as T;
    return JSON.parse(raw) as T;
  } catch (err) {
    log.warn(`Corrupt JSON at ${filePath} — backing up and resetting.`);
    try {
      fs.copyFileSync(filePath, `${filePath}.corrupt.${Date.now()}`);
    } catch {
      /* best-effort */
    }
    return {} as T;
  }
}
