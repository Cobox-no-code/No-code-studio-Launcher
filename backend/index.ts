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

  return win;
}

app.whenReady().then(async () => {
  await prepareNext("./frontend", 3000);
  await initLogs();
  createWindow();
  autoUpdater.checkForUpdates();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = "info";

// Listen for update events
autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info);
});

autoUpdater.on("update-not-available", (info) => {
  log.info("No updates available:", info);
});

autoUpdater.on("error", (err) => {
  log.error("Error in auto-updater:", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  log.info(`Download speed: ${progressObj.bytesPerSecond}`);
  log.info(`Downloaded ${progressObj.percent}%`);
});

autoUpdater.on("update-downloaded", () => {
  log.info("Update downloaded. Will install silently on quit.");
  autoUpdater.quitAndInstall(); // 🔇 Silently installs update now
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

// IPC Handlers
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

// Add the open-external IPC handler
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

// Add handler to check if game is installed
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

// Add handler to get default install path
ipcMain.handle("get-default-install-path", async () => {
  const defaultPath = path.join(os.homedir(), "GameLauncher", "CyberAdventure");
  return defaultPath;
});

export { createWindow };
