import { app } from "electron";
import fs from "fs";
import os from "os";
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

export function localSaveRoot(): string {
  return path.join(
    process.env["LOCALAPPDATA"] || path.join(os.homedir(), "AppData", "Local"),
    "NoCodeStudio",
    "Saved",
    "SaveGames",
  );
}

export function liveGamesDir(): string {
  const dir = path.join(localSaveRoot(), "live_games");
  ensureDir(dir);
  return dir;
}

export function defaultGameInstallDir(): string {
  return path.join(os.homedir(), "GameLauncher", "CyberAdventure");
}

export function isPathSafe(p: string): boolean {
  try {
    return !path.normalize(p).includes("..");
  } catch {
    return false;
  }
}
