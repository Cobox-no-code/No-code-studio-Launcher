import { atomicWriteJson, readJsonOrEmpty } from "./atomic-write";
import { workerFilePath } from "./paths";

export interface WorkerConfig {
  gamePath?: string;
  gameVersion?: string; // what's installed locally
  version?: string;
  firstRunCompleted?: boolean;
  intent?: "world" | "game" | "play" | null;
  intentWrittenAt?: string; // ← new
  lastBootstrapAt?: string;
  [key: string]: unknown;
}

export const workerStore = {
  read(): WorkerConfig {
    return readJsonOrEmpty<WorkerConfig>(workerFilePath());
  },

  update(updates: Partial<WorkerConfig>): WorkerConfig {
    const merged = { ...this.read(), ...updates };
    atomicWriteJson(workerFilePath(), merged);
    return merged;
  },

  isFirstRun(): boolean {
    return !this.read().firstRunCompleted;
  },

  markFirstRunComplete(): void {
    this.update({
      firstRunCompleted: true,
      lastBootstrapAt: new Date().toISOString(),
    });
  },
};
