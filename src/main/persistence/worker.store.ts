import { atomicWriteJson, readJsonOrEmpty } from "./atomic-write";
import { workerFilePath } from "./paths";

export interface WorkerConfig {
  gamePath?: string;
  version?: string;
  [key: string]: unknown;
}

export const workerStore = {
  read(): WorkerConfig {
    return readJsonOrEmpty<WorkerConfig>(workerFilePath());
  },

  /** Merge-write — preserves keys not in `updates`. */
  update(updates: Partial<WorkerConfig>): WorkerConfig {
    const merged = { ...this.read(), ...updates };
    atomicWriteJson(workerFilePath(), merged);
    return merged;
  },
};
