import fs from "fs";
import path from "path";
import { ChildProcess, spawn } from "child_process";

import type { LaunchResult } from "@shared/types/game";
import { workerStore } from "@main/persistence/worker.store";
import { log } from "@main/utils/logger";

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
