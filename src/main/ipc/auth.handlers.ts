import { ipcMain } from "electron";
import { IPC } from "@shared/ipc-contract";

import { authState } from "@main/services/auth/auth.state";
import { broadcastAuth, logout } from "@main/services/auth/auth.service";
import {
  startLogin,
  cancelLogin,
  openExternal,
} from "@main/services/auth/verify-launcher.service";
import { refreshAccessToken } from "@main/services/auth/refresh.service";

export function registerAuthHandlers() {
  ipcMain.handle(IPC.auth.getState, () => authState.snapshot);

  ipcMain.handle(IPC.auth.startLogin, () => startLogin(broadcastAuth));

  ipcMain.handle(IPC.auth.cancelLogin, () => {
    cancelLogin(broadcastAuth);
    return { success: true };
  });

  ipcMain.handle(IPC.auth.refresh, async () => {
    const tokens = await refreshAccessToken(broadcastAuth);
    return { success: !!tokens };
  });

  ipcMain.handle(IPC.auth.logout, () => {
    logout();
    return { success: true };
  });

  ipcMain.handle(IPC.auth.openExternal, async (_e, url: string) => {
    const ok = await openExternal(url);
    return { success: ok };
  });
}
