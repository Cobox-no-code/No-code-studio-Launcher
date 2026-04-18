import { ipcMain } from "electron";
import { IPC } from "@shared/types/ipc-contract";
import {
  cmdCheck,
  cmdDownload,
  cmdInstall,
  cmdGetState,
} from "@main/services/updater/updater.service";

export function registerUpdaterHandlers() {
  ipcMain.handle(IPC.updater.check, cmdCheck);
  ipcMain.handle(IPC.updater.download, cmdDownload);
  ipcMain.handle(IPC.updater.install, cmdInstall);
  ipcMain.handle(IPC.updater.getState, cmdGetState);
}
