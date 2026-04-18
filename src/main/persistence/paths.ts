import { app } from "electron";
import fs from "fs";
import path from "path";

let _appDataPath: string | null = null;

/** Lazy-initialised — must be called only after app.whenReady(). */
export function getAppDataPath(): string {
  if (_appDataPath) return _appDataPath;
  _appDataPath = app.getPath("userData");
  ensureDir(_appDataPath);
  return _appDataPath;
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function workerFilePath(): string {
  return path.join(getAppDataPath(), "worker.json");
}

export function secretFilePath(): string {
  return path.join(getAppDataPath(), "secret.json");
}
