// main.ts
import axios from "axios";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import extract from "extract-zip";
import FormData from "form-data";
import fs from "fs";
import https from "https";
import { ChildProcess, spawn } from "node:child_process";
import { join } from "node:path";
import os from "os";
import path from "path";
import semver from "semver";
import { initLogs, isDev, prepareNext } from "./utils";
// ✅ Replace with
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.cobox.games/api";

const appDataPath = app.getPath("userData");
let mainWindow: BrowserWindow | null = null;
let activeGameProcess: ChildProcess | null = null;
// main.ts — add these lines before any autoUpdater usage
autoUpdater.autoDownload = false; // don't download without user consent
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false; // only stable releases

// Force it to always check GitHub even in edge cases
autoUpdater.setFeedURL({
  provider: "github",
  owner: "Cobox-no-code",
  repo: "No-code-studio-Launcher",
});
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
  } else {
    // Use app.getAppPath() instead of __dirname — survives asar updates
    const indexPath = join(app.getAppPath(), "frontend", "out", "index.html");
    win.loadFile(indexPath);
  }

  win.webContents.on("did-finish-load", () => {
    console.log("Page finished loading");
  });

  win.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      console.log(`Renderer console [${level}]: ${message}`);
    },
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
ipcMain.handle("download-update", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    log.error("Download update error:", error);
    return { success: false, message: error.message };
  }
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
  },
);

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isValidPath(filePath: string): boolean {
  try {
    const normalizedPath = path.normalize(filePath);
    return !normalizedPath.includes("..");
  } catch {
    return false;
  }
}

function readWorkerConfig(): Record<string, any> {
  const secretFile = path.join(appDataPath, "worker.json");
  let currentData = {};
  if (fs.existsSync(secretFile)) {
    try {
      currentData = JSON.parse(fs.readFileSync(secretFile, "utf-8"));
    } catch (err) {
      console.warn("Failed to parse existing worker.json.");
    }
  }
  return currentData;
}

function saveWorkerConfig(data: Record<string, any>) {
  const secretFile = path.join(appDataPath, "worker.json");
  const current = readWorkerConfig();
  const newData = { ...current, ...data };
  ensureDirectoryExists(appDataPath);
  fs.writeFileSync(secretFile, JSON.stringify(newData, null, 2));
  return newData;
}
ipcMain.handle("publish-game-full", async (event, payload) => {
  const { filePath, thumbnailBase64, metadata } = payload;
  console.log("Publishing game with payload:", payload);
  try {
    const form = new FormData();

    // 1. Handle the Game File from System Path
    if (fs.existsSync(filePath)) {
      form.append("gameFile", fs.createReadStream(filePath));
    } else {
      throw new Error("Game file not found at the provided path.");
    }

    // 2. Handle Thumbnail (Base64 to Buffer)
    // Remove the data:image/png;base64, prefix
    const base64Data = thumbnailBase64.replace(/^data:image\/\w+;base64,/, "");
    const thumbBuffer = Buffer.from(base64Data, "base64");
    form.append("thumbnail", thumbBuffer, {
      filename: `${metadata.title}.png`,
    });
    form.append("id", metadata.id);
    form.append("title", metadata.title);
    form.append("authorName", metadata.authorName);
    form.append("description", metadata.description);

    // 4. Send to your EC2 API
    const response = await axios.post(BACKEND_URL + "/published-games", form, {
      headers: {
        ...form.getHeaders(),
        // Add your JWT here if required
        Authorization: `Bearer ${metadata.token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("IPC Main Error:", error);
    return { success: false, error: error.message };
  }
});
// ==================== NEW IPC HANDLERS FOR FLOW ====================

// 1. Get Server Version (Called first on click)
ipcMain.handle("get-server-version", async () => {
  return new Promise((resolve, reject) => {
    // Replace with your actual API endpoint
    const url = "https://api.cobox.games/api/game-version/1";

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.version);
            console.log("Server version data:", parsed.version);
          } catch (e) {
            // If JSON parse fails, return null or mock for dev
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        console.error("API Fetch Error:", err);
        resolve(null);
      });
  });
});

// 2. Download Game
ipcMain.handle("download-game", async (event, params) => {
  const url = params?.url;
  const targetDir = params?.targetDir;

  if (!url || !targetDir) throw new Error("Invalid arguments");

  const zipPath = path.join(targetDir, "Archive.zip");
  const extractPath = path.join(targetDir, "GameFiles");

  ensureDirectoryExists(targetDir);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);
    const request = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download status: ${res.statusCode}`));
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
          // Extract
          await extract(zipPath, { dir: extractPath });
          fs.unlinkSync(zipPath);

          // Find EXE
          const findExe = (dir: string): string | null => {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const file of files) {
              const full = path.join(dir, file.name);
              if (file.isDirectory()) {
                const found = findExe(full);
                if (found) return found;
              } else if (file.name === "NoCodeStudio.exe") {
                return full;
              }
            }
            return null;
          };

          const exePath = findExe(extractPath);
          if (!exePath) throw new Error("NoCodeStudio.exe not found");

          // ✅ AUTOMATICALLY SAVE PATH TO WORKER.JSON
          saveWorkerConfig({ gamePath: exePath });
          console.log("Game installed and path saved:", exePath);

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
  });
});

// ─── ADD THIS BLOCK right after the "check-download-status" ipcMain.handle ───
// Place it between check-download-status and get-local-library-games

ipcMain.handle(
  "delete-live-game",
  async (_event, { gameId }: { gameId: string }) => {
    ensureLiveGamesDir();

    try {
      const files = fs.readdirSync(liveGamesDir);

      // Find the file that starts with this gameId (format: gameId_safeTitle.sav)
      const targetFile = files.find((file) => file.startsWith(`${gameId}_`));

      if (!targetFile) {
        // File not found on disk — treat as already deleted, return success
        return { success: true };
      }

      const targetPath = path.join(liveGamesDir, targetFile);
      fs.unlinkSync(targetPath);
      console.log("Deleted live game file:", targetPath);

      return { success: true };
    } catch (err: any) {
      console.error("delete-live-game error:", err);
      return { success: false, error: err.message };
    }
  },
);
// 3. Launch Game (No Arguments - Reads worker.json)
// main.ts

ipcMain.handle("launch-game", async () => {
  try {
    // 2️⃣ CHECK IF ALREADY RUNNING
    if (activeGameProcess && !activeGameProcess.killed) {
      console.log("⚠️ Blocked launch: Game is already running.");
      return { success: false, error: "Game is already running" };
    }

    const config = readWorkerConfig();
    let exePath = config.gamePath;

    if (!exePath) {
      throw new Error("Game path not found in configuration.");
    }

    // 1️⃣.5️⃣ NORMALIZE PATH (The Fix)
    // This fixes "C:/Games//Build/Game.exe" -> "C:\Games\Build\Game.exe"
    exePath = path.normalize(exePath);

    if (!fs.existsSync(exePath)) {
      throw new Error(`Game file missing at path: ${exePath}`);
    }

    const exeDir = path.dirname(exePath);

    console.log(`Launching game from: ${exePath}`);

    const child = spawn(exePath, [], {
      cwd: exeDir,
      detached: true,
      stdio: "ignore",
      shell: false,
    });

    // 3️⃣ STORE THE PROCESS REFERENCE
    activeGameProcess = child;

    // 4️⃣ LISTEN FOR EXIT
    child.on("close", (code) => {
      console.log(`Game process closed with code ${code}`);
      activeGameProcess = null;
    });

    child.on("error", (err) => {
      console.error("Game process error:", err);
      activeGameProcess = null;
    });

    child.unref();
    return { success: true };
  } catch (error: any) {
    console.error("Launch error:", error);
    activeGameProcess = null;
    return { success: false, error: error.message };
  }
});

// ==================== UTILITY HANDLERS ====================

ipcMain.handle("choose-install-path", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.filePaths?.[0] || null;
});

ipcMain.handle("get-game-status", async () => {
  const config = readWorkerConfig();

  // Check if path exists AND file exists
  if (config.gamePath && fs.existsSync(config.gamePath)) {
    return {
      installed: true,
      path: config.gamePath,
      // 👇 ADD THIS: Return the local version so frontend can compare
      version: config.version || "0.0.0",
    };
  }
  return { installed: false, path: null, version: null };
});

ipcMain.handle("update-worker", async (_, data) => {
  try {
    const res = saveWorkerConfig(data.updates); // Merges updates
    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

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
          "Failed to parse existing secret.json, it will be overwritten.",
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
    const result = await autoUpdater.checkForUpdates();

    if (!result || !result.updateInfo) {
      return { success: true, updateInfo: null };
    }

    const currentVersion = app.getVersion();
    const latestVersion = result.updateInfo.version;

    // 🔥 Check if latest version is greater than current version
    if (!semver.gt(latestVersion, currentVersion)) {
      return { success: true, updateInfo: null }; // Not higher → No update
    }

    return {
      success: true,
      updateInfo: {
        version: latestVersion,
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
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

// Live games logic
const LOCAL_SAVE_PATH = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
  "NoCodeStudio",
  "Saved",
  "SaveGames",
);
const liveGamesDir = path.join(LOCAL_SAVE_PATH, "live_games");

// Helper function to ensure directory exists
function ensureLiveGamesDir() {
  if (!fs.existsSync(liveGamesDir)) {
    fs.mkdirSync(liveGamesDir, { recursive: true });
    console.log("Created directory:", liveGamesDir);
  }
}

ipcMain.handle("download-live-game", async (event, { url, gameId, title }) => {
  ensureLiveGamesDir(); // Safety check

  const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const fileName = `${gameId}_${safeTitle}.sav`;
  const filePath = path.join(liveGamesDir, fileName);

  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve({ success: true, path: filePath }));
      writer.on("error", (err) =>
        reject({ success: false, error: err.message }),
      );
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("check-download-status", async (event, gameIds: string[]) => {
  ensureLiveGamesDir(); // Safety check

  const statusMap: Record<
    string,
    { downloaded: boolean; path: string | null }
  > = {};

  try {
    const files = fs.readdirSync(liveGamesDir);

    gameIds.forEach((id) => {
      // Find file starting with the specific ID
      const foundFile = files.find((file) => file.startsWith(`${id}_`));

      if (foundFile) {
        statusMap[id] = {
          downloaded: true,
          path: path.join(liveGamesDir, foundFile),
        };
      } else {
        statusMap[id] = { downloaded: false, path: null };
      }
    });

    return statusMap;
  } catch (err) {
    return {};
  }
});

ipcMain.handle("get-local-library-games", async () => {
  try {
    if (!fs.existsSync(LOCAL_SAVE_PATH)) {
      fs.mkdirSync(LOCAL_SAVE_PATH, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(LOCAL_SAVE_PATH);

    const localGames = files
      .filter((file) => file.endsWith(".sav"))
      .map((file) => {
        const fullPath = path.join(LOCAL_SAVE_PATH, file);
        const stats = fs.statSync(fullPath);

        const nameWithoutExt = file.replace(".sav", "");

        // --- IMPROVED ID GENERATION ---
        // We use the filename + the unix timestamp of creation
        // Format: "MyGame_1734556800000"
        const timestamp = stats.birthtime.getTime();
        const generatedId = `${nameWithoutExt}_${timestamp}`;

        // If your files already use the "ID_Name" format, we can still parse the name
        const parts = nameWithoutExt.split("_");
        const displayName =
          parts.length > 1 ? parts.slice(1).join(" ") : nameWithoutExt;

        return {
          id: generatedId, // Unique combined ID
          name: displayName, // Clean display name
          fileName: file, // Original filename for system operations
          path: fullPath,
          createdAt: stats.birthtime,
          size: stats.size,
        };
      });

    // Sort by newest first using the date object
    return localGames.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  } catch (error) {
    console.error("Failed to read local library:", error);
    return [];
  }
});
export { createWindow };
