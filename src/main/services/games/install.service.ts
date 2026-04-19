import { dialog } from "electron";
import fs from "fs";
import path from "path";

import { defaultGameInstallDir, isPathSafe } from "@main/persistence/paths";
import { workerStore } from "@main/persistence/worker.store";
import type { GameStatus } from "@shared/types/game";

const EXE_NAME = "NoCodeStudio.exe";

export async function chooseInstallPath(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths?.[0] ?? null;
}

export function getDefaultInstallPath(): string {
  return defaultGameInstallDir();
}

export function getGameStatus(): GameStatus {
  try {
    const config = workerStore.read();
    if (config.gamePath && fs.existsSync(config.gamePath)) {
      return {
        installed: true,
        path: config.gamePath,
        version: (config.gameVersion ?? config.version ?? "0.0.0") as string,
      };
    }
  } catch {
    /* fall through */
  }
  return { installed: false, path: null, version: null };
}

export function checkInstallationAt(gamePath: string): GameStatus {
  if (!gamePath || !isPathSafe(gamePath)) {
    return { installed: false, path: null, version: null };
  }
  const exe = path.join(gamePath, EXE_NAME);
  return {
    installed: fs.existsSync(exe),
    path: gamePath,
    version: null,
  };
}
