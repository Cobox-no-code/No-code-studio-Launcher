import {
  cmdCheck,
  cmdDownload,
  cmdGetState,
  cmdInstall,
} from "@main/services/updater/updater.service";
import { IPC } from "@shared/ipc-contract";
import { ipcMain } from "electron";

export function registerUpdaterHandlers() {
  ipcMain.handle(IPC.updater.check, cmdCheck);
  ipcMain.handle(IPC.updater.download, cmdDownload);
  ipcMain.handle(IPC.updater.install, cmdInstall);
  ipcMain.handle(IPC.updater.getState, cmdGetState);
}
