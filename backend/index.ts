// main.ts
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import extract from "extract-zip";
import fs from "fs";
import https from "https";
import { spawn } from "node:child_process";
import { join } from "node:path";
import os from "os";
import path from "path";
import { initLogs, isDev, prepareNext } from "./utils";

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const preloadPath = join(__dirname, "preload.js");
  console.log("Preload script path:", preloadPath);
  console.log("Preload script exists:", fs.existsSync(preloadPath));

  const win = new BrowserWindow({
    width: 1250,
    height: 750,
    resizable: false,
    fullscreen: false,
    fullscreenable: false,
    maximizable: false,
    frame: true,
    titleBarStyle: "default",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: !isDev, // Only disable in dev mode
    },
  });

  // Store reference to main window
  mainWindow = win;

  if (isDev) {
    win.loadURL("http://localhost:3000/");
    win.maximize();
    win.setMenu(null);
  } else {
    win.loadFile(join(__dirname, "..", "frontend", "out", "index.html"));
    win.setMenu(null);
  }

  win.webContents.on("did-finish-load", () => {
    console.log("Page finished loading");
  });

  win.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      console.log(`Renderer console [${level}]: ${message}`);
    }
  );

  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}

app.whenReady().then(async () => {
  await prepareNext("./frontend", 3000);
  await initLogs();
  createWindow();

  // Don't auto-check for updates on startup - let user trigger it
  // autoUpdater.checkForUpdates();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Configure auto-updater logging
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = "info";

// Helper function to send update events to renderer
function sendUpdateEvent(channel: string, data?: any) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

// Listen for update events and forward them to renderer
autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
  sendUpdateEvent("checking-for-update");
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info);
  sendUpdateEvent("update-available", info);
});

autoUpdater.on("update-not-available", (info) => {
  log.info("No updates available:", info);
  sendUpdateEvent("update-not-available", info);
});

autoUpdater.on("error", (err) => {
  log.error("Error in auto-updater:", err);
  sendUpdateEvent("update-error", { message: err.message });
});

autoUpdater.on("download-progress", (progressObj) => {
  log.info(`Download speed: ${progressObj.bytesPerSecond}`);
  log.info(`Downloaded ${progressObj.percent}%`);
  sendUpdateEvent("download-progress", progressObj);
});

autoUpdater.on("update-downloaded", () => {
  log.info("Update downloaded. Ready to install.");
  sendUpdateEvent("update-downloaded");
});

app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  }
);

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper function to validate file paths
function isValidPath(filePath: string): boolean {
  try {
    const normalizedPath = path.normalize(filePath);
    return !normalizedPath.includes("..");
  } catch {
    return false;
  }
}

// ==================== EXISTING IPC HANDLERS ====================

ipcMain.handle("choose-install-path", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Choose Installation Directory",
    });
    return result.filePaths?.[0] || null;
  } catch (error) {
    console.error("Error choosing install path:", error);
    return null;
  }
});
const appDataPath = app.getPath("userData");
// ==================== DOWNLOAD GAME ====================
ipcMain.handle("download-game", async (event, params) => {
  const url = params?.url;
  const targetDir = params?.targetDir;

  if (!url || !targetDir || !isValidPath(targetDir)) {
    throw new Error("Invalid download URL or target directory");
  }
  // Helper to find .exe file recursively
  function findExeFile(dir: string, exeName: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findExeFile(fullPath, exeName);
        if (found) return found;
      } else if (entry.name === exeName) {
        return fullPath;
      }
    }
    return null;
  }

  // Try to locate the .exe

  const zipPath = path.join(targetDir, "Archive.zip");
  const extractPath = path.join(targetDir, "ARCHIVE");

  ensureDirectoryExists(targetDir);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);

    const request = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed with status: ${res.statusCode}`));
        return;
      }

      const totalSize = parseInt(res.headers["content-length"] || "0", 10);
      let downloadedSize = 0;

      res.on("data", (chunk) => {
        downloadedSize += chunk.length;
        const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
        event.sender.send("download-progress", progress);
      });

      res.pipe(file);

      file.on("finish", async () => {
        file.close();
        try {
          // Extract zip
          await extract(zipPath, { dir: extractPath });
          fs.unlinkSync(zipPath);

          // Find NoCodeStudio.exe
          const exePath = findExeFile(extractPath, "NoCodeStudio.exe");
          if (!exePath) {
            throw new Error("NoCodeStudio.exe not found after extraction");
          }

          // Create default worker.json
          const secretFilePath = path.join(appDataPath, "worker.json");
          const defaultData = {
            mode: "create", // default mode
            type: "creategame", // default type
          };
          fs.writeFileSync(
            secretFilePath,
            JSON.stringify(defaultData, null, 2)
          );
          console.log("Created default worker.json at:", exePath);

          resolve(exePath);
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on("error", (err) => {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error("Download timeout"));
    });
  });
});

// ==================== UPDATE SECRET ====================
ipcMain.handle(
  "update-worker",
  async (_, data: { path: string; updates: Record<string, any> }) => {
    try {
      const secretFile = path.join(appDataPath, "worker.json");

      let currentData = {};
      if (fs.existsSync(secretFile)) {
        try {
          currentData = JSON.parse(fs.readFileSync(secretFile, "utf-8"));
        } catch (err) {
          console.warn("Failed to parse existing worker.json, overwriting");
        }
      }

      const newData = { ...currentData, ...data.updates };
      fs.writeFileSync(secretFile, JSON.stringify(newData, null, 2));

      return { success: true, filePath: secretFile };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("create-secret", async (_, content: Record<string, any>) => {
  try {
    const secretFile = path.join(appDataPath, "secret.json");

    if (fs.existsSync(secretFile)) {
      throw new Error(`secret.json already exists at ${secretFile}`);
    }

    ensureDirectoryExists(appDataPath);
    fs.writeFileSync(secretFile, JSON.stringify(content, null, 2));
    return { success: true, filePath: secretFile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("update-secret", async (_, updates: Record<string, any>) => {
  try {
    const secretFile = path.join(appDataPath, "secret.json");

    let currentData = {};
    if (fs.existsSync(secretFile)) {
      try {
        currentData = JSON.parse(fs.readFileSync(secretFile, "utf-8"));
      } catch (err) {
        console.warn(
          "Failed to parse existing secret.json, it will be overwritten."
        );
      }
    }

    const newData = { ...currentData, ...updates };

    ensureDirectoryExists(appDataPath);
    fs.writeFileSync(secretFile, JSON.stringify(newData, null, 2));

    return { success: true, filePath: secretFile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("launch-game", async (_, exePath) => {
  try {
    if (!exePath || !isValidPath(exePath)) {
      throw new Error("Invalid executable path");
    }

    const executable = path.join(exePath);

    // Check if executable exists
    if (!fs.existsSync(executable)) {
      throw new Error(`Executable not found at: ${executable}`);
    }

    console.log("Launching game:", executable);
    const child = spawn(executable, [], {
      detached: true,
      stdio: "ignore",
      cwd: exePath, // Set working directory to game folder
    });

    child.unref();
    return { success: true };
  } catch (error) {
    console.error("Launch game error:", error);
    throw error;
  }
});

ipcMain.handle("open-external", async (_, url) => {
  console.log("Main process: opening external URL:", url);
  try {
    // Basic URL validation
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    // Only allow http/https URLs
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Only HTTP/HTTPS URLs are allowed");
    }

    await shell.openExternal(url);
    console.log("Successfully opened external URL");
    return { success: true };
  } catch (error) {
    console.error("Error opening external URL:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("check-game-installation", async (_, gamePath) => {
  try {
    if (!gamePath || !isValidPath(gamePath)) {
      return { installed: false };
    }

    const executable = path.join(gamePath, "NoCodeStudio.exe");
    const exists = fs.existsSync(executable);

    return { installed: exists, path: gamePath };
  } catch (error) {
    console.error("Error checking game installation:", error);
    return { installed: false };
  }
});

ipcMain.handle("get-default-install-path", async () => {
  const defaultPath = path.join(os.homedir(), "GameLauncher", "CyberAdventure");
  return defaultPath;
});

// ==================== NEW UPDATE IPC HANDLERS ====================

ipcMain.handle("check-for-updates", async () => {
  try {
    log.info("Manual update check triggered");
    const result = await autoUpdater.checkForUpdates();

    // Extract only serializable data
    return {
      success: true,
      updateInfo: {
        version: result?.updateInfo?.version,
        releaseName: result?.updateInfo?.releaseName,
        releaseNotes: result?.updateInfo?.releaseNotes,
        files: result?.updateInfo?.files,
      },
    };
  } catch (error) {
    log.error("Error checking for updates:", error);
    sendUpdateEvent("update-error", { message: error.message });
    return {
      success: false,
      message: error.message,
    };
  }
});

ipcMain.handle("install-update", async () => {
  try {
    log.info("Manual update installation triggered");
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    log.error("Error installing update:", error);
    throw error;
  }
});

export { createWindow };
