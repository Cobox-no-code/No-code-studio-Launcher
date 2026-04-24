import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import path from "path";

import { workerStore } from "@main/persistence/worker.store";
import { log } from "@main/utils/logger";
import type {
  LaunchResult,
  LaunchWithIntentResult,
  StudioIntent,
} from "@shared/types/game";

let activeProcess: ChildProcess | null = null;

/**
 * Launch the No Code Studio executable.
 *
 * Contract (matches the original launcher):
 *   - worker.json.gamePath ALWAYS points to NoCodeStudio.exe
 *   - Studio itself finds save files by scanning its local Saved/SaveGames dir
 *   - We never pass save paths or args to Studio — it's self-directed
 *
 * The intent flag (world/game/play) is written to worker.json for Studio
 * to read on its own boot, but the .sav path is NEVER written to gamePath.
 */
export function launchGame(): LaunchResult {
  try {
    if (activeProcess && !activeProcess.killed) {
      return { success: false, error: "Studio is already running" };
    }

    const config = workerStore.read();
    const exePath = config.gamePath ? path.normalize(config.gamePath) : null;

    log.info("[launchGame] pre-spawn check:", {
      gamePath: config.gamePath,
      exists: exePath ? fs.existsSync(exePath) : false,
      platform: process.platform,
    });

    if (!exePath) {
      return {
        success: false,
        error: "Studio is not installed. Please complete setup.",
      };
    }

    if (!fs.existsSync(exePath)) {
      return {
        success: false,
        error: `Studio executable missing: ${exePath}`,
      };
    }

    // Safety net — if gamePath is somehow pointing to a non-exe (e.g. a .sav
    // left over from a previous buggy launcher version), refuse to spawn it.
    if (!exePath.toLowerCase().endsWith(".exe")) {
      return {
        success: false,
        error: `gamePath is not an .exe: ${exePath}. Run bootstrap again.`,
      };
    }

    const stat = fs.statSync(exePath);
    if (!stat.isFile()) {
      return {
        success: false,
        error: `Studio path is not a file: ${exePath}`,
      };
    }

    const child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      detached: true,
      stdio: "ignore",
      shell: false,
      windowsHide: false,
    });

    activeProcess = child;

    child.on("spawn", () => {
      log.info(`[launchGame] Studio spawned, pid=${child.pid}`);
    });
    child.on("close", (code, signal) => {
      log.info(`[launchGame] Studio closed, code=${code} signal=${signal}`);
      activeProcess = null;
    });
    child.on("error", (err) => {
      log.error("[launchGame] process error:", err);
      activeProcess = null;
    });

    child.unref();
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Launch failed";
    log.error("[launchGame] error:", msg);
    activeProcess = null;
    return { success: false, error: msg };
  }
}

export function isGameRunning(): boolean {
  return !!(activeProcess && !activeProcess.killed);
}

/**
 * World-/game-creation flows. Writes intent to worker.json so Studio knows
 * which editor to open, then launches Studio.
 *
 * DOES NOT touch gamePath.
 */
export function launchWithIntent(intent: StudioIntent): LaunchWithIntentResult {
  try {
    workerStore.update({
      intent,
      intentWrittenAt: new Date().toISOString(),
      // Clear any stale play-mode fields
      playingGameId: undefined,
      playSavPath: undefined,
    });

    const result = launchGame();
    if (!result.success) return { success: false, error: result.error };
    return { success: true, intent };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Launch with intent failed";
    log.error("[launchWithIntent] error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Play an installed game.
 *
 * CRITICAL: we do NOT write savPath into gamePath. The old launcher never
 * did, and Studio reads .sav files on its own from Saved/SaveGames.
 *
 * The .sav is already on disk (downloaded by download-live-game). All we
 * do is launch Studio — it handles game selection itself.
 */
export function launchPlayGame(params: {
  gameId: string;
  savPath: string;
}): LaunchResult {
  try {
    if (!params.savPath) {
      return { success: false, error: "Save file path missing" };
    }
    if (!fs.existsSync(params.savPath)) {
      return {
        success: false,
        error: `Save file not found: ${params.savPath}`,
      };
    }

    // Record intent + which game the user picked, for Studio to read
    // if it wants to auto-open that save. We do NOT overwrite gamePath.
    workerStore.update({
      intent: "play",
      playingGameId: params.gameId,
      playSavPath: params.savPath,
      intentWrittenAt: new Date().toISOString(),
    });

    return launchGame();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Launch failed";
    log.error("[launchPlayGame] error:", msg);
    return { success: false, error: msg };
  }
}
