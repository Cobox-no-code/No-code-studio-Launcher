import { app, ipcMain, shell } from "electron";
import fs from "fs";
import path from "path";
import { IPC } from "@shared/ipc-contract";
import { log } from "@main/utils/logger";
import type { AppVersionInfo } from "@shared/types/app";

export function registerAppHandlers() {
  ipcMain.handle(IPC.app.getVersion, (): AppVersionInfo => {
    // Electron provides the version from package.json automatically
    const version = app.getVersion();
    // Build date from the main bundle's mtime
    let buildDate = "Unknown";
    try {
      const mainPath = app.getAppPath();
      const stat = fs.statSync(mainPath);
      buildDate = stat.mtime.toISOString();
    } catch {
      /* noop */
    }
    return {
      version,
      buildDate,
      platform: process.platform,
    };
  });

  ipcMain.handle(IPC.app.openDataFolder, async () => {
    try {
      const dir = app.getPath("userData");
      await shell.openPath(dir);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Open failed";
      return { success: false, error: msg };
    }
  });

  ipcMain.handle(IPC.app.clearCache, async () => {
    try {
      // Only wipe things safe to wipe. DON'T touch worker.json, secret.json,
      // or installed-games folder. Limit to temp thumbs + renderer cache.
      const tempDir = path.join(app.getPath("temp"), "cobox-launcher");
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      // Clear Electron's renderer cache too
      const session = require("electron").session.defaultSession;
      await session.clearCache();
      log.info("Cache cleared");
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Clear failed";
      log.error("clearCache error:", msg);
      return { success: false, error: msg };
    }
  });
}
