import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import semver from "semver";

import { IPC } from "@shared/types/ipc-contract";
import type { UpdateCheckResult } from "@shared/types/update";
import type { IpcResponse } from "@shared/types/ipc";

import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { GITHUB_OWNER, GITHUB_REPO } from "@main/utils/env";

import { updaterState } from "./state";
import { safePercent } from "./safe-percent";

let _mainWindowRef: () => BrowserWindow | null = () => null;

function broadcast() {
  safeSend(_mainWindowRef(), IPC.updater.stateChanged, updaterState.snapshot);
}

export function initUpdaterService(getMainWindow: () => BrowserWindow | null) {
  _mainWindowRef = getMainWindow;

  autoUpdater.autoDownload = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = log;

  autoUpdater.setFeedURL({
    provider: "github",
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  });

  autoUpdater.on("checking-for-update", () => {
    log.info("Updater: checking...");
    updaterState.setAvailableConfirmed(false);
    updaterState.set({
      status: "checking",
      version: null,
      percent: 0,
      error: null,
    });
    broadcast();
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Updater: available", info.version);
    updaterState.setAvailableConfirmed(true);
    updaterState.set({
      status: "available",
      version: info.version,
      percent: 0,
      error: null,
    });
    broadcast();
  });

  autoUpdater.on("update-not-available", () => {
    log.info("Updater: not available");
    updaterState.reset();
    broadcast();
  });

  autoUpdater.on("error", (err) => {
    log.error("Updater: error", err);
    updaterState.setAvailableConfirmed(false);
    updaterState.set({
      status: "error",
      percent: 0,
      error: err?.message ?? "Unknown updater error",
    });
    broadcast();
  });

  autoUpdater.on("download-progress", (progressObj) => {
    const percent = safePercent(progressObj);
    updaterState.set({ status: "downloading", percent, error: null });
    broadcast();
  });

  autoUpdater.on("update-downloaded", () => {
    log.info("Updater: downloaded — ready to install");
    updaterState.set({ status: "downloaded", percent: 100, error: null });
    broadcast();
  });

  log.info("Updater service initialised");
}

// ── Commands exposed to IPC layer ────────────────────────────────────────────

export async function cmdCheck(): Promise<UpdateCheckResult> {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result?.updateInfo) return { success: true, updateInfo: null };

    const latest = result.updateInfo.version;
    if (!semver.gt(latest, app.getVersion())) {
      return { success: true, updateInfo: null };
    }
    return { success: true, updateInfo: { version: latest } };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Network error — could not check for updates";
    log.error("cmdCheck failed:", msg);
    updaterState.set({ status: "error", percent: 0, error: msg });
    broadcast();
    return { success: false, updateInfo: null, message: msg };
  }
}

export async function cmdDownload(): Promise<IpcResponse> {
  if (!updaterState.availableConfirmed) {
    log.warn("cmdDownload: no confirmed update, ignoring");
    return { success: false, message: "No update available to download." };
  }
  const snap = updaterState.snapshot;
  if (snap.status === "downloading" || snap.status === "downloaded") {
    return { success: true };
  }
  try {
    updaterState.set({ status: "downloading", percent: 0, error: null });
    broadcast();
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Download failed";
    log.error("cmdDownload failed:", msg);
    updaterState.setAvailableConfirmed(false);
    updaterState.set({ status: "error", percent: 0, error: msg });
    broadcast();
    return { success: false, message: msg };
  }
}

export async function cmdInstall(): Promise<IpcResponse> {
  if (updaterState.snapshot.status !== "downloaded") {
    return { success: false, message: "Update not ready to install." };
  }
  try {
    log.info("Quitting and installing update");
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Install failed";
    log.error("cmdInstall failed:", msg);
    return { success: false, message: msg };
  }
}

export function cmdGetState() {
  return updaterState.snapshot;
}
