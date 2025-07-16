// main.ts
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import https from "https";
import fs from "fs";
import { join } from "node:path";
import { initLogs, isDev, prepareNext } from "./utils";
import path from "path";
import os from "os";
import { spawn } from "node:child_process";
import extract from "extract-zip";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

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
    win.webContents.openDevTools();
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

ipcMain.handle("download-game", async (event, params) => {
  console.log("download-game called with params:", params);
  console.log("params type:", typeof params);
  console.log("params keys:", params ? Object.keys(params) : "null");

  // Handle both object and separate parameter formats
  let url, targetDir;

  if (params && typeof params === "object" && !Array.isArray(params)) {
    url = params.url;
    targetDir = params.targetDir;
  } else if (typeof params === "string") {
    // Handle legacy format if needed
  }

  console.log("Extracted - url:", url, "targetDir:", targetDir);

  // Validate inputs
  if (!url || !targetDir) {
    console.error("Missing parameters - url:", url, "targetDir:", targetDir);
    throw new Error("URL and target directory are required");
  }

  if (!isValidPath(targetDir)) {
    throw new Error("Invalid target directory path");
  }

  const zipPath = path.join(targetDir, "Archive.zip");
  const extractPath = path.join(targetDir, "ARCHIVE");

  try {
    // Ensure target directory exists
    ensureDirectoryExists(targetDir);

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(zipPath);

      const request = https.get(url, (res) => {
        // Check if response is successful
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status: ${res.statusCode}`));
          return;
        }

        const totalSize = parseInt(res.headers["content-length"] || "0", 10);
        let downloadedSize = 0;

        res.on("data", (chunk) => {
          downloadedSize += chunk.length;
          const progress =
            totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
          // You can emit progress events here if needed
        });

        res.pipe(file);

        file.on("finish", async () => {
          file.close();
          try {
            console.log("Extracting archive...");
            await extract(zipPath, { dir: extractPath });

            // Clean up zip file
            if (fs.existsSync(zipPath)) {
              fs.unlinkSync(zipPath);
            }

            resolve(extractPath);
          } catch (extractError) {
            console.error("Extraction error:", extractError);
            reject(extractError);
          }
        });
      });

      request.on("error", (err) => {
        console.error("Download error:", err);
        // Clean up partial download
        if (fs.existsSync(zipPath)) {
          fs.unlink(zipPath, () => {});
        }
        reject(err);
      });

      // Set timeout for download
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error("Download timeout"));
      });
    });
  } catch (error) {
    console.error("Download game error:", error);
    throw error;
  }
});

ipcMain.handle("launch-game", async (_, exePath) => {
  try {
    if (!exePath || !isValidPath(exePath)) {
      throw new Error("Invalid executable path");
    }

    const executable = path.join(exePath, "NoCodeStudio.exe");

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
