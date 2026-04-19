import { ipcMain } from "electron";
import { IPC } from "@shared/ipc-contract";
import { bootstrapState } from "@main/services/bootstrap/bootstrap.state";
import {
  markIntroCompleted,
  skipToLogin,
  retryBootstrap,
} from "@main/services/bootstrap/bootstrap.service";
import { workerStore } from "@main/persistence/worker.store";

export function registerBootstrapHandlers() {
  ipcMain.handle(IPC.bootstrap.getState, () => bootstrapState.snapshot);

  ipcMain.handle(IPC.bootstrap.markIntroDone, () => {
    markIntroCompleted();
    return { success: true };
  });

  ipcMain.handle(IPC.bootstrap.skipToLogin, () => {
    skipToLogin();
    return { success: true };
  });

  ipcMain.handle(IPC.bootstrap.retry, async () => {
    await retryBootstrap();
    return { success: true };
  });

  // Used by home route once it mounts after first successful login
  ipcMain.handle("bootstrap:mark-first-run-complete", () => {
    workerStore.markFirstRunComplete();
    return { success: true };
  });
}
