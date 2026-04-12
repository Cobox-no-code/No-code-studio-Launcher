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
import { v4 as uuidv4 } from "uuid";
import { initLogs, isDev, prepareNext } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STATE — owned entirely by main process
// Renderer polls this via get-update-state IPC (immune to timing race)
// ─────────────────────────────────────────────────────────────────────────────
type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "error";

interface UpdateStateShape {
  status: UpdateStatus;
  version: string | null;
  percent: number;
  error: string | null;
}

let updateState: UpdateStateShape = {
  status: "idle",
  version: null,
  percent: 0,
  error: null,
};

// Track whether checkForUpdates has successfully found an update.
// Prevents downloadUpdate() being called before a valid update is confirmed.
let updateAvailableConfirmed = false;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.cobox.games/api";

// FIX 1: appDataPath lazy-initialised inside app.whenReady() — never at
// module load time, which can throw on some Windows setups.
let appDataPath = "";

let mainWindow: BrowserWindow | null = null;
let activeGameProcess: ChildProcess | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-UPDATER CONFIG
// ─────────────────────────────────────────────────────────────────────────────
autoUpdater.autoDownload = false; // user must explicitly trigger download
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;

autoUpdater.setFeedURL({
  provider: "github",
  owner: "Cobox-no-code",
  repo: "No-code-studio-Launcher",
});

autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = "info";

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW
// ─────────────────────────────────────────────────────────────────────────────
function createWindow(): BrowserWindow {
  const preloadPath = join(__dirname, "preload.js");
  log.info("Preload path:", preloadPath, "exists:", fs.existsSync(preloadPath));

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
      webSecurity: !isDev,
    },
  });

  mainWindow = win;

  if (isDev) {
    win.loadURL("http://localhost:3000/");
  } else {
    const indexPath = join(app.getAppPath(), "frontend", "out", "index.html");
    win.loadFile(indexPath);
  }

  win.webContents.on("did-finish-load", () =>
    log.info("Page finished loading"),
  );
  win.webContents.on("console-message", (_e, level, message) => {
    log.info(`Renderer [${level}]: ${message}`);
  });
  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}

app.whenReady().then(async () => {
  // FIX 1: initialise appDataPath only after app is ready
  appDataPath = app.getPath("userData");
  ensureDirectoryExists(appDataPath);

  await prepareNext("./frontend", 3000);
  await initLogs();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("certificate-error", (event, _wc, _url, _err, _cert, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else callback(false);
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — safe IPC send (checks window is alive before sending)
// ─────────────────────────────────────────────────────────────────────────────
function sendUpdateEvent(channel: string, data?: any) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-UPDATER EVENTS
// ─────────────────────────────────────────────────────────────────────────────
autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
  updateAvailableConfirmed = false;
  updateState = { status: "checking", version: null, percent: 0, error: null };
  sendUpdateEvent("update-state-changed", updateState);
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info.version);
  updateAvailableConfirmed = true; // now safe to call downloadUpdate()
  updateState = {
    status: "available",
    version: info.version,
    percent: 0,
    error: null,
  };
  sendUpdateEvent("update-state-changed", updateState);
});

autoUpdater.on("update-not-available", () => {
  log.info("No update available");
  updateAvailableConfirmed = false;
  updateState = { status: "idle", version: null, percent: 0, error: null };
  sendUpdateEvent("update-state-changed", updateState);
});

autoUpdater.on("error", (err) => {
  log.error("Auto-updater error:", err);
  // Reset confirmation — user must re-check before downloading
  updateAvailableConfirmed = false;
  updateState = {
    status: "error",
    version: updateState.version,
    percent: 0,
    error: err?.message ?? "Unknown updater error",
  };
  sendUpdateEvent("update-state-changed", updateState);
});

autoUpdater.on("download-progress", (progressObj) => {
  // FIX: electron-updater percent can arrive as string or be absent entirely
  const raw =
    typeof progressObj?.percent === "number"
      ? progressObj.percent
      : parseFloat(String(progressObj?.percent ?? "0"));
  const percent = isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));

  log.info(`Download progress: ${percent.toFixed(1)}%`);
  updateState = {
    status: "downloading",
    version: updateState.version,
    percent,
    error: null,
  };
  sendUpdateEvent("update-state-changed", updateState);
});

autoUpdater.on("update-downloaded", () => {
  log.info("Update downloaded — ready to install");
  updateState = {
    status: "downloaded",
    version: updateState.version,
    percent: 100,
    error: null,
  };
  sendUpdateEvent("update-state-changed", updateState);
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE IPC HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

// Polling endpoint — renderer calls every 800ms as a reliable fallback
ipcMain.handle("get-update-state", () => updateState);

// Check for updates — handles offline / network errors gracefully
ipcMain.handle("check-for-updates", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();

    if (!result?.updateInfo) {
      return { success: true, updateInfo: null };
    }

    const currentVersion = app.getVersion();
    const latestVersion = result.updateInfo.version;

    if (!semver.gt(latestVersion, currentVersion)) {
      return { success: true, updateInfo: null };
    }

    return { success: true, updateInfo: { version: latestVersion } };
  } catch (error: any) {
    log.error("check-for-updates failed:", error);
    // Don't let the updater sit in a broken state
    updateState = {
      status: "error",
      version: null,
      percent: 0,
      error: error?.message ?? "Network error — could not check for updates",
    };
    sendUpdateEvent("update-state-changed", updateState);
    return { success: false, message: updateState.error };
  }
});

// Download update — FIX 2: guard against calling before update is confirmed
ipcMain.handle("download-update", async () => {
  // FIX 2: if no update was confirmed, silently bail instead of throwing
  if (!updateAvailableConfirmed) {
    log.warn(
      "download-update called but no update has been confirmed. Ignoring.",
    );
    return { success: false, message: "No update available to download." };
  }

  // Already downloading or downloaded — don't start a second download
  if (
    updateState.status === "downloading" ||
    updateState.status === "downloaded"
  ) {
    log.info(
      "download-update: already in progress or complete, ignoring duplicate call.",
    );
    return { success: true };
  }

  try {
    // Set state immediately so polling catches it before the first event fires
    updateState = {
      status: "downloading",
      version: updateState.version,
      percent: 0,
      error: null,
    };
    sendUpdateEvent("update-state-changed", updateState);

    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: any) {
    log.error("download-update failed:", error);
    updateAvailableConfirmed = false;
    updateState = {
      status: "error",
      version: updateState.version,
      percent: 0,
      error: error?.message ?? "Download failed",
    };
    sendUpdateEvent("update-state-changed", updateState);
    return { success: false, message: updateState.error };
  }
});

// Install update — only valid when status === "downloaded"
ipcMain.handle("install-update", async () => {
  if (updateState.status !== "downloaded") {
    log.warn("install-update called but update is not downloaded yet.");
    return { success: false, message: "Update not ready to install." };
  }
  try {
    log.info("Quitting and installing update...");
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error: any) {
    log.error("install-update failed:", error);
    return { success: false, message: error?.message };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isValidPath(filePath: string): boolean {
  try {
    return !path.normalize(filePath).includes("..");
  } catch {
    return false;
  }
}

// FIX 5 + 6: Atomic write pattern — write to temp file then rename.
// This prevents corrupt reads if the process crashes mid-write.
// Also acts as a soft file lock since rename() is atomic on most OS.
function readWorkerConfig(): Record<string, any> {
  const file = path.join(appDataPath, "worker.json");
  if (!fs.existsSync(file)) return {};
  try {
    const raw = fs.readFileSync(file, "utf-8").trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    log.warn(
      "worker.json parse failed — backing up corrupt file and resetting.",
    );
    // Back up the corrupt file so it can be inspected; don't silently discard
    try {
      fs.copyFileSync(file, file + ".corrupt." + Date.now());
    } catch {
      /* best-effort */
    }
    return {};
  }
}

function saveWorkerConfig(data: Record<string, any>): Record<string, any> {
  const file = path.join(appDataPath, "worker.json");
  const tmp = file + ".tmp";
  const current = readWorkerConfig();
  const merged = { ...current, ...data };
  ensureDirectoryExists(appDataPath);
  // Atomic write: write tmp then rename (rename is atomic on Windows + POSIX)
  fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), "utf-8");
  fs.renameSync(tmp, file);
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME IPC HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle("publish-game-full", async (_event, payload) => {
  const { filePath, thumbnailBase64, metadata } = payload;
  log.info("Publishing game:", metadata?.title);
  try {
    const form = new FormData();
    const gameId = uuidv4();
    form.append("game_id", gameId);
    form.append("display_name", metadata.title ?? "");
    form.append("title", metadata.title ?? "");
    form.append("description", metadata.description ?? "");
    form.append("genre", metadata.genre ?? "");

    if (!fs.existsSync(filePath)) throw new Error("Game file not found.");
    form.append("game_file", fs.createReadStream(filePath));

    const base64Data = thumbnailBase64.replace(/^data:image\/\w+;base64,/, "");
    const thumbBuffer = Buffer.from(base64Data, "base64");
    form.append("thumbnail", thumbBuffer, {
      filename: `${metadata.title}.png`,
      contentType: "image/png",
    });

    const response = await axios.post(BACKEND_URL + "/published-games", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${metadata.token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    log.info("Publish success:", response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    const backendError = error?.response?.data;
    log.error(
      "publish-game-full error:",
      JSON.stringify(backendError ?? error.message),
    );
    return { success: false, error: backendError?.message ?? error.message };
  }
});

ipcMain.handle("get-server-version", async () => {
  return new Promise((resolve) => {
    const url = "https://api.cobox.games/api/game-version/1";
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data).version ?? null);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", (err) => {
        log.error("get-server-version network error:", err);
        resolve(null);
      });
  });
});

// FIX 4: properly close the write stream on all reject paths
ipcMain.handle("download-game", async (event, params) => {
  const { url, targetDir } = params ?? {};
  if (!url || !targetDir)
    throw new Error("download-game: missing url or targetDir");

  const zipPath = path.join(targetDir, "Archive.zip");
  const extractPath = path.join(targetDir, "GameFiles");
  ensureDirectoryExists(targetDir);

  return new Promise<string>((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);

    // FIX 4: centralised cleanup — always destroys stream and removes partial file
    const cleanup = (err?: Error) => {
      file.destroy();
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch {
        /* best-effort */
      }
      if (err) reject(err);
    };

    const request = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        cleanup(new Error(`Download failed with HTTP ${res.statusCode}`));
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
        file.close(async (closeErr) => {
          if (closeErr) {
            cleanup(closeErr);
            return;
          }
          try {
            await extract(zipPath, { dir: extractPath });
            try {
              fs.unlinkSync(zipPath);
            } catch {
              /* best-effort */
            }

            const findExe = (dir: string): string | null => {
              for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, f.name);
                if (f.isDirectory()) {
                  const r = findExe(full);
                  if (r) return r;
                } else if (f.name === "NoCodeStudio.exe") return full;
              }
              return null;
            };

            const exePath = findExe(extractPath);
            if (!exePath)
              throw new Error("NoCodeStudio.exe not found after extraction");

            saveWorkerConfig({ gamePath: exePath });
            log.info("Game installed at:", exePath);
            resolve(exePath);
          } catch (err: any) {
            cleanup(err);
          }
        });
      });

      file.on("error", (err) => cleanup(err));
      res.on("error", (err) => cleanup(err));
    });

    request.on("error", (err) => cleanup(err));
  });
});

ipcMain.handle("launch-game", async () => {
  try {
    if (activeGameProcess && !activeGameProcess.killed) {
      return { success: false, error: "Game is already running" };
    }

    const config = readWorkerConfig();
    let exePath = config.gamePath;
    if (!exePath) throw new Error("Game path not found in configuration.");

    exePath = path.normalize(exePath);
    if (!fs.existsSync(exePath))
      throw new Error(`Game file missing: ${exePath}`);

    const child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      detached: true,
      stdio: "ignore",
      shell: false,
    });

    activeGameProcess = child;
    child.on("close", () => {
      activeGameProcess = null;
    });
    child.on("error", (err) => {
      log.error("Game process error:", err);
      activeGameProcess = null;
    });
    child.unref();

    return { success: true };
  } catch (error: any) {
    log.error("launch-game error:", error);
    activeGameProcess = null;
    return { success: false, error: error.message };
  }
});

ipcMain.handle("choose-install-path", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.filePaths?.[0] ?? null;
});

ipcMain.handle("get-game-status", async () => {
  try {
    const config = readWorkerConfig();
    if (config.gamePath && fs.existsSync(config.gamePath)) {
      return {
        installed: true,
        path: config.gamePath,
        version: config.version ?? "0.0.0",
      };
    }
    return { installed: false, path: null, version: null };
  } catch {
    return { installed: false, path: null, version: null };
  }
});

ipcMain.handle("update-worker", async (_, data) => {
  try {
    return { success: true, data: saveWorkerConfig(data.updates) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});

// FIX 7: create-secret now UPSERTS instead of throwing on existing file.
// Users who reinstall the app no longer get stuck at login.
ipcMain.handle("create-secret", async (_, content: Record<string, any>) => {
  try {
    const secretFile = path.join(appDataPath, "secret.json");
    ensureDirectoryExists(appDataPath);

    let existing: Record<string, any> = {};
    if (fs.existsSync(secretFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(secretFile, "utf-8"));
      } catch {
        /* corrupt — overwrite */
      }
    }

    const merged = { ...existing, ...content };
    const tmp = secretFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), "utf-8");
    fs.renameSync(tmp, secretFile);

    return { success: true, filePath: secretFile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("update-secret", async (_, updates: Record<string, any>) => {
  try {
    const secretFile = path.join(appDataPath, "secret.json");
    ensureDirectoryExists(appDataPath);

    let current: Record<string, any> = {};
    if (fs.existsSync(secretFile)) {
      try {
        current = JSON.parse(fs.readFileSync(secretFile, "utf-8"));
      } catch {
        /* corrupt — overwrite */
      }
    }

    const merged = { ...current, ...updates };
    const tmp = secretFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), "utf-8");
    fs.renameSync(tmp, secretFile);

    return { success: true, filePath: secretFile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("open-external", async (_, url: string) => {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL");
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol))
      throw new Error("Only HTTP/HTTPS allowed");
    await shell.openExternal(url);
    return { success: true };
  } catch (error: any) {
    log.error("open-external error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("check-game-installation", async (_, gamePath: string) => {
  try {
    if (!gamePath || !isValidPath(gamePath)) return { installed: false };
    const exe = path.join(gamePath, "NoCodeStudio.exe");
    return { installed: fs.existsSync(exe), path: gamePath };
  } catch {
    return { installed: false };
  }
});

ipcMain.handle("get-default-install-path", async () =>
  path.join(os.homedir(), "GameLauncher", "CyberAdventure"),
);

// ─────────────────────────────────────────────────────────────────────────────
// LIVE GAMES
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_SAVE_PATH = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
  "NoCodeStudio",
  "Saved",
  "SaveGames",
);
const liveGamesDir = path.join(LOCAL_SAVE_PATH, "live_games");

function ensureLiveGamesDir() {
  if (!fs.existsSync(liveGamesDir))
    fs.mkdirSync(liveGamesDir, { recursive: true });
}

ipcMain.handle("download-live-game", async (_event, { url, gameId, title }) => {
  ensureLiveGamesDir();
  const safeTitle = String(title ?? "game")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const filePath = path.join(liveGamesDir, `${gameId}_${safeTitle}.sav`);
  try {
    const response = await axios({
      method: "get",
      url,
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

ipcMain.handle("check-download-status", async (_event, gameIds: string[]) => {
  ensureLiveGamesDir();
  const statusMap: Record<
    string,
    { downloaded: boolean; path: string | null }
  > = {};
  try {
    const files = fs.readdirSync(liveGamesDir);
    for (const id of gameIds) {
      const found = files.find((f) => f.startsWith(`${id}_`));
      statusMap[id] = found
        ? { downloaded: true, path: path.join(liveGamesDir, found) }
        : { downloaded: false, path: null };
    }
  } catch {
    /* return empty map on fs error */
  }
  return statusMap;
});

ipcMain.handle(
  "delete-live-game",
  async (_event, { gameId }: { gameId: string }) => {
    ensureLiveGamesDir();
    try {
      const target = fs
        .readdirSync(liveGamesDir)
        .find((f) => f.startsWith(`${gameId}_`));
      if (target) fs.unlinkSync(path.join(liveGamesDir, target));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
);

ipcMain.handle("get-local-library-games", async () => {
  try {
    ensureDirectoryExists(LOCAL_SAVE_PATH);
    const games = fs
      .readdirSync(LOCAL_SAVE_PATH)
      .filter((f) => f.endsWith(".sav"))
      .map((file) => {
        const fullPath = path.join(LOCAL_SAVE_PATH, file);
        const stats = fs.statSync(fullPath);
        const base = file.replace(".sav", "");
        const parts = base.split("_");
        return {
          id: `${base}_${stats.birthtime.getTime()}`,
          name: parts.length > 1 ? parts.slice(1).join(" ") : base,
          fileName: file,
          path: fullPath,
          createdAt: stats.birthtime,
          size: stats.size,
        };
      });
    return games.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    log.error("get-local-library-games error:", error);
    return [];
  }
});

export { createWindow };
