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

/**
 * Where Studio gets installed.
 *
 * Original launcher: ~/GameLauncher/CyberAdventure — hardcoded, Windows-centric.
 * New launcher: use Electron's userData, which is per-OS and per-app correct.
 *   - Windows: %APPDATA%\cobox-launcher\Studio
 *   - macOS:   ~/Library/Application Support/cobox-launcher/Studio
 *   - Linux:   ~/.config/cobox-launcher/Studio
 *
 * For backwards-compat with old installs, we still check the legacy path
 * before downloading fresh.
 */
export function defaultGameInstallDir(): string {
  return path.join(app.getPath("userData"), "Studio");
}

export function legacyGameInstallDir(): string {
  return path.join(os.homedir(), "GameLauncher", "CyberAdventure", "GameFiles");
}

export function isPathSafe(p: string): boolean {
  try {
    return !path.normalize(p).includes("..");
  } catch {
    return false;
  }
}
