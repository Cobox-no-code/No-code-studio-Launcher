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

export function launchGame(): LaunchResult {
  try {
    if (activeProcess && !activeProcess.killed) {
      return { success: false, error: "Game is already running" };
    }

    const config = workerStore.read();
    if (!config.gamePath) throw new Error("Game path not found");

    const exePath = path.normalize(config.gamePath);
    if (!fs.existsSync(exePath)) {
      throw new Error(`Game file missing: ${exePath}`);
    }

    const child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      detached: true,
      stdio: "ignore",
      shell: false,
    });

    activeProcess = child;
    child.on("close", () => (activeProcess = null));
    child.on("error", (err) => {
      log.error("Game process error:", err);
      activeProcess = null;
    });
    child.unref();

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Launch failed";
    log.error("launchGame error:", msg);
    activeProcess = null;
    return { success: false, error: msg };
  }
}

export function isGameRunning(): boolean {
  return !!(activeProcess && !activeProcess.killed);
}

/**
 * Write intent to worker.json then spawn the studio.
 * The studio reads worker.json on startup to know which flow to show.
 */
export function launchWithIntent(intent: StudioIntent): LaunchWithIntentResult {
  try {
    workerStore.update({
      intent,
      intentWrittenAt: new Date().toISOString(),
    });

    const result = launchGame();
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, intent };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Launch with intent failed";
    log.error("launchWithIntent error:", msg);
    return { success: false, error: msg };
  }
}

export function launchPlayGame(params: { gameId: string; savPath: string }): {
  success: boolean;
  error?: string;
} {
  try {
    workerStore.update({
      intent: "play",
      gamePath: params.savPath, // studio reads this
      intentWrittenAt: new Date().toISOString(),
      // We don't set gameId in the official schema — keep it in a sidecar field
      playingGameId: params.gameId,
    });

    const result = launchGame();
    if (!result.success) return { success: false, error: result.error };

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Launch failed";
    log.error("launchPlayGame error:", msg);
    return { success: false, error: msg };
  }
}
