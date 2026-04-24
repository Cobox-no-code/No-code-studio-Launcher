import { defaultGameInstallDir } from "@main/persistence/paths";
import { workerStore } from "@main/persistence/worker.store";
import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { IPC } from "@shared/ipc-contract";
import { BrowserWindow } from "electron";

import { downloadAndExtractGame } from "@main/services/games/download.service";
import { getServerVersion } from "@main/services/games/version.service";
import fs from "fs";
import { bootstrapState } from "./bootstrap.state";

let _getWin: () => BrowserWindow | null = () => null;

function broadcast() {
  safeSend(_getWin(), IPC.bootstrap.stateChanged, bootstrapState.snapshot);
}

/**
 * Called once at startup, after window is ready.
 * - Figures out first-run vs. returning user
 * - Kicks game-version check + download (if needed) in background
 * - Runs through phases, emitting state at each transition
 *
 * Does NOT block main — the renderer drives the UI flow, we just emit truth.
 */
export async function initBootstrapService(
  getWin: () => BrowserWindow | null,
): Promise<void> {
  _getWin = getWin;

  const firstRun = workerStore.isFirstRun();
  bootstrapState.set({
    firstRun,
    phase: firstRun ? "intro-videos" : "checking",
  });
  broadcast();

  // On subsequent runs, start checking immediately.
  // On first run, wait for renderer to signal intros finished.
  if (!firstRun) {
    void runGameCheck();
  }
}

/**
 * Called by renderer when intro videos have completed (first run only).
 */
export function markIntroCompleted() {
  if (bootstrapState.snapshot.introCompleted) return;
  bootstrapState.set({ introCompleted: true, phase: "checking" });
  broadcast();
  void runGameCheck();
}

/**
 * Non-first-run users can skip the bootstrap screen to reach login faster.
 * Downloads keep running in the background.
 */
export function skipToLogin() {
  const snap = bootstrapState.snapshot;
  if (snap.phase === "ready") return;

  // Only skip if we already have a valid local install.
  const config = workerStore.read();
  const hasValidLocal =
    !!config.gamePath &&
    fs.existsSync(config.gamePath) &&
    fs.statSync(config.gamePath).isFile();

  if (!hasValidLocal) {
    log.warn("skipToLogin refused — no valid Studio install");
    return;
  }

  // Valid install exists — download may still be running as an update.
  // Let user proceed to login; background update continues.
  bootstrapState.set({ phase: "ready" });
  broadcast();
}

export async function retryBootstrap() {
  bootstrapState.set({ phase: "checking", error: null });
  bootstrapState.patchGameDownload({
    status: "checking",
    error: null,
    percent: 0,
  });
  broadcast();
  await runGameCheck();
}

// ── Internal: check + download game files ────────────────────────────────────

async function runGameCheck() {
  try {
    bootstrapState.patchGameDownload({ status: "checking" });
    broadcast();

    const installed = workerStore.read();
    const localVersion = installed.gameVersion ?? null;
    const localPath = installed.gamePath ?? null;

    // Is there a usable existing install?
    const hasValidLocal =
      !!localPath &&
      fs.existsSync(localPath) &&
      fs.statSync(localPath).isFile();

    // If the stored path is invalid, wipe the stale pointer now.
    if (localPath && !hasValidLocal) {
      log.warn(`Bootstrap: stale gamePath at ${localPath} — clearing`);
      workerStore.update({ gamePath: undefined, gameVersion: undefined });
    }

    // Try to hit the server
    let server: Awaited<ReturnType<typeof getServerVersion>> = null;
    try {
      server = await getServerVersion();
    } catch (err) {
      log.warn("Bootstrap: server version check failed:", err);
      // Fall through — we'll handle based on whether local install exists
    }

    const serverVersion = server?.version ?? null;
    const serverLink = server?.link ?? null;

    bootstrapState.patchGameDownload({
      currentVersion: localVersion,
      targetVersion: serverVersion,
    });
    broadcast();

    // ── Case 1: valid local install AND up to date ────────────────────
    if (hasValidLocal && serverVersion && localVersion === serverVersion) {
      bootstrapState.patchGameDownload({ status: "installed", percent: 100 });
      bootstrapState.set({ phase: "ready" });
      broadcast();
      log.info(`Bootstrap: local install ${localVersion} is current`);
      return;
    }

    // ── Case 2: server unreachable but local install present ──────────
    // Let offline users with an existing install through.
    if (hasValidLocal && !serverVersion) {
      log.warn("Bootstrap: offline, using existing local install");
      bootstrapState.patchGameDownload({ status: "installed", percent: 100 });
      bootstrapState.set({ phase: "ready" });
      broadcast();
      return;
    }

    // ── Case 3: server unreachable AND no local install ───────────────
    // This is the failure case. Don't let users proceed — they'll hit
    // "Studio not installed" errors for every action.
    if (!serverVersion || !serverLink) {
      const msg =
        "Can't reach Cobox servers to download Studio. Check your internet connection.";
      log.error(`Bootstrap: ${msg}`);
      bootstrapState.patchGameDownload({ status: "error", error: msg });
      bootstrapState.set({ phase: "error", error: msg });
      broadcast();
      return;
    }

    // ── Case 4: download required (first run OR update available) ─────
    await runGameDownload(serverLink, serverVersion);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bootstrap check failed";
    log.error("runGameCheck error:", msg);
    bootstrapState.patchGameDownload({ status: "error", error: msg });
    bootstrapState.set({ phase: "error", error: msg });
    broadcast();
  }
}

async function runGameDownload(url: string, targetVersion: string) {
  const targetDir = defaultGameInstallDir();
  bootstrapState.patchGameDownload({
    status: "downloading",
    percent: 0,
    error: null,
  });
  bootstrapState.set({ phase: "game-downloading" });
  broadcast();

  try {
    const exePath = await downloadAndExtractGame(
      { url, targetDir, targetVersion },
      _getWin,
    );

    // ── Final verification ─────────────────────────────────────────────
    if (!exePath || !fs.existsSync(exePath)) {
      throw new Error(
        `Installation finished but Studio executable is missing: ${exePath}`,
      );
    }
    const stat = fs.statSync(exePath);
    if (!stat.isFile() || stat.size < 1024 * 1024) {
      throw new Error(
        `Studio executable invalid (${stat.size} bytes): ${exePath}`,
      );
    }

    // Persist only after verification passes
    workerStore.update({ gameVersion: targetVersion, gamePath: exePath });

    bootstrapState.patchGameDownload({
      status: "installed",
      percent: 100,
      currentVersion: targetVersion,
    });
    bootstrapState.set({ phase: "ready" });
    broadcast();
    log.info(`Game ${targetVersion} installed at ${exePath}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Download failed";
    log.error("Game download failed:", msg);
    bootstrapState.patchGameDownload({ status: "error", error: msg });
    bootstrapState.set({ phase: "error", error: msg });
    broadcast();
  }
}

/**
 * Hook for the game download.service progress — call from there to mirror
 * percent into bootstrap state. We'll wire it in step 1.6.
 */
export function reportGameDownloadProgress(percent: number) {
  const snap = bootstrapState.snapshot;
  if (snap.gameDownload.status !== "downloading") return;
  bootstrapState.patchGameDownload({ percent });
  broadcast();
}
