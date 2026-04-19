import { BrowserWindow } from "electron";
import { IPC } from "@shared/ipc-contract";
import { safeSend } from "@main/utils/safe-send";
import { log } from "@main/utils/logger";
import { workerStore } from "@main/persistence/worker.store";
import { defaultGameInstallDir } from "@main/persistence/paths";

import { bootstrapState } from "./bootstrap.state";
import { getServerVersion } from "@main/services/games/version.service";
import { downloadAndExtractGame } from "@main/services/games/download.service";
import fs from "fs";

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
  // Only meaningful if we're on a phase that waits for user input.
  // We don't actually "stop" anything — we just fast-forward the UI signal.
  const snap = bootstrapState.snapshot;
  if (snap.phase === "ready") return;

  // If we have a game download active, let it keep going; mark UI as ready.
  if (
    snap.gameDownload.status === "downloading" ||
    snap.gameDownload.status === "extracting" ||
    snap.gameDownload.status === "installed" ||
    snap.gameDownload.status === "idle" ||
    snap.gameDownload.status === "checking"
  ) {
    bootstrapState.set({ phase: "ready" });
    broadcast();
  }
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

    const server = await getServerVersion();
    const installed = workerStore.read();

    const serverVersion = server?.version ?? null;
    const serverLink = server?.link ?? null;
    const localVersion = installed.gameVersion ?? null;
    const localPath = installed.gamePath ?? null;

    bootstrapState.patchGameDownload({
      currentVersion: localVersion,
      targetVersion: serverVersion,
    });
    broadcast();

    // Already have this version and the binary is present — we're done.
    if (
      serverVersion &&
      localVersion === serverVersion &&
      localPath &&
      fs.existsSync(localPath)
    ) {
      bootstrapState.patchGameDownload({ status: "installed", percent: 100 });
      bootstrapState.set({ phase: "ready" });
      broadcast();
      return;
    }

    // Server didn't respond — not fatal, user may be offline. Let them through.
    if (!serverVersion || !serverLink) {
      log.warn("Bootstrap: no server version; skipping auto-download");
      bootstrapState.patchGameDownload({ status: "idle" });
      bootstrapState.set({ phase: "ready" });
      broadcast();
      return;
    }

    // Download is needed — kick it off.
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

  // The download.service pushes progress via IPC.games.downloadProgress.
  // We mirror it into bootstrap state by hooking the same window send —
  // simplest approach: listen from here.
  // For v1: just await the download; progress is shown by the download.service
  // via the existing IPC.games.downloadProgress channel, which the renderer
  // already knows how to read.
  //
  // To keep bootstrap state in sync, we also update it when the download
  // completes. Fine-grained mirroring happens in step 1.6 below.

  try {
    const exePath = await downloadAndExtractGame({ url, targetDir }, _getWin);

    // Persist version + path
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
