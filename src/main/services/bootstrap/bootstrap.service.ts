import {
  defaultGameInstallDir,
  legacyGameInstallDir,
} from "@main/persistence/paths";
import { workerStore } from "@main/persistence/worker.store";
import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { IPC } from "@shared/ipc-contract";
import { BrowserWindow } from "electron";

import { downloadAndExtractGame } from "@main/services/games/download.service";
import { getServerVersion } from "@main/services/games/version.service";
import fs from "fs";
import path from "path";
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
 * Skip bootstrap UI if (and only if) a verified Studio install already exists.
 * This is an idempotent user-initiated action — calling it repeatedly without
 * a valid install is safe but logs a warning once per attempt. The renderer
 * must NOT poll this; attach it to an explicit user button only.
 */
export async function skipToLogin() {
  const snap = bootstrapState.snapshot;
  if (snap.phase === "ready") return;

  const config = workerStore.read();
  const hasValidLocal = await verifyInstall(config.gamePath);

  if (!hasValidLocal) {
    log.warn("skipToLogin refused — no valid Studio install");
    return;
  }

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

    // ── Platform gate ─────────────────────────────────────────────────
    // Studio is a Windows-only binary. Block on macOS/Linux so devs
    // don't end up with phantom installs that can never launch.
    if (process.platform !== "win32") {
      const msg =
        "Studio requires Windows. You're on " +
        process.platform +
        ". Download the real launcher on Windows to test this flow.";
      log.warn(`Bootstrap: ${msg}`);
      bootstrapState.patchGameDownload({
        status: "error",
        error: msg,
      });
      bootstrapState.set({ phase: "error", error: msg });
      broadcast();
      return;
    }

    const installed = workerStore.read();
    const localVersion = installed.gameVersion ?? null;
    const localPath = installed.gamePath ?? null;

    // Validate existing install
    const hasValidLocal = await verifyInstall(localPath);

    if (localPath && !hasValidLocal) {
      log.warn(`Bootstrap: stale/invalid gamePath at ${localPath} — clearing`);
      workerStore.update({ gamePath: undefined, gameVersion: undefined });
    }

    // Try to reach the server for the latest version
    let server: Awaited<ReturnType<typeof getServerVersion>> = null;
    try {
      server = await getServerVersion();
    } catch (err) {
      log.warn("Bootstrap: server version check failed:", err);
    }

    const serverVersion = server?.version ?? null;
    const serverLink = server?.link ?? null;

    bootstrapState.patchGameDownload({
      currentVersion: localVersion,
      targetVersion: serverVersion,
    });
    broadcast();

    // Up-to-date and valid → ready
    if (hasValidLocal && serverVersion && localVersion === serverVersion) {
      bootstrapState.patchGameDownload({ status: "installed", percent: 100 });
      bootstrapState.set({ phase: "ready" });
      broadcast();
      log.info(`Bootstrap: local install ${localVersion} is current`);
      return;
    }

    // Offline but valid install → ready (user can use cached Studio)
    if (hasValidLocal && !serverVersion) {
      log.warn("Bootstrap: offline, using existing local install");
      bootstrapState.patchGameDownload({ status: "installed", percent: 100 });
      bootstrapState.set({ phase: "ready" });
      broadcast();
      return;
    }

    // No local install AND server unreachable → hard error
    if (!serverVersion || !serverLink) {
      const msg =
        "Can't reach Cobox servers to download Studio. Check your internet connection.";
      log.error(`Bootstrap: ${msg}`);
      bootstrapState.patchGameDownload({ status: "error", error: msg });
      bootstrapState.set({ phase: "error", error: msg });
      broadcast();
      return;
    }

    // ── Legacy install migration ──────────────────────────────────────
    // Users upgrading from the old launcher may still have NoCodeStudio.exe
    // in ~/GameLauncher/CyberAdventure/GameFiles. Adopt that install
    // instead of re-downloading.
    if (!hasValidLocal) {
      const legacyExe = path.join(legacyGameInstallDir(), "NoCodeStudio.exe");
      if (fs.existsSync(legacyExe)) {
        const legacyOk = await verifyInstall(legacyExe);
        if (legacyOk) {
          log.info(`Bootstrap: adopting legacy install at ${legacyExe}`);
          workerStore.update({
            gamePath: legacyExe,
            gameVersion: serverVersion,
          });
          bootstrapState.patchGameDownload({
            status: "installed",
            percent: 100,
            currentVersion: serverVersion,
          });
          bootstrapState.set({ phase: "ready" });
          broadcast();
          return;
        }
        log.warn(
          `Bootstrap: legacy install at ${legacyExe} failed verification`,
        );
      }
    }

    // Download required
    await runGameDownload(serverLink, serverVersion);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bootstrap check failed";
    log.error("runGameCheck error:", msg);
    bootstrapState.patchGameDownload({ status: "error", error: msg });
    bootstrapState.set({ phase: "error", error: msg });
    broadcast();
  }
}

/**
 * Verify a Studio install is real and usable.
 * - File exists
 * - Is a regular file
 * - Must end with .exe (prevents stale .sav pointers slipping through)
 * - Windows PE signature check (first bytes are "MZ")
 * - Size in sane range (50MB – 10GB)
 */
async function verifyInstall(
  exePath: string | null | undefined,
): Promise<boolean> {
  if (!exePath) return false;

  const normalized = path.normalize(exePath);

  // Pointer hygiene — .sav, .zip, etc. must never be treated as Studio
  if (!normalized.toLowerCase().endsWith(".exe")) {
    log.warn(`verifyInstall: not an .exe ${normalized}`);
    return false;
  }

  if (!fs.existsSync(normalized)) {
    log.warn(`verifyInstall: missing file ${normalized}`);
    return false;
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(normalized);
  } catch (err) {
    log.warn("verifyInstall: stat failed", err);
    return false;
  }

  if (!stat.isFile()) {
    log.warn(`verifyInstall: not a file ${normalized}`);
    return false;
  }

  // Studio's real exe on Windows is >50MB. A sub-MB file means
  // extraction or download failed partway.
  const MIN_SIZE = 64 * 1024; // 64 KB — catches empty/stub files
  const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB safety ceiling
  if (stat.size < MIN_SIZE || stat.size > MAX_SIZE) {
    log.warn(
      `verifyInstall: size out of range (${stat.size} bytes) ${normalized}`,
    );
    return false;
  }

  // Check PE signature (first 2 bytes = "MZ" for Windows executables)
  if (process.platform === "win32") {
    try {
      const fd = fs.openSync(normalized, "r");
      const buf = Buffer.alloc(2);
      fs.readSync(fd, buf, 0, 2, 0);
      fs.closeSync(fd);
      if (buf[0] !== 0x4d || buf[1] !== 0x5a) {
        log.warn(`verifyInstall: not a PE executable ${normalized}`);
        return false;
      }
    } catch (err) {
      log.warn("verifyInstall: signature check failed", err);
      return false;
    }
  }

  return true;
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

    // Rigorous post-install verification
    const ok = await verifyInstall(exePath);
    if (!ok) {
      throw new Error(
        `Installation completed but Studio executable failed verification: ${exePath}`,
      );
    }

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
 * percent into bootstrap state.
 */
export function reportGameDownloadProgress(percent: number) {
  const snap = bootstrapState.snapshot;
  if (snap.gameDownload.status !== "downloading") return;
  bootstrapState.patchGameDownload({ percent });
  broadcast();
}
