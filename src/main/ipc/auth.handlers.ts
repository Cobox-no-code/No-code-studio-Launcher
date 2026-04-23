import { IPC } from "@shared/ipc-contract";
import { ipcMain } from "electron";

import { authHeader } from "@main/http/auth-header";
import { http } from "@main/http/client";
import { broadcastAuth, logout } from "@main/services/auth/auth.service";
import { authState } from "@main/services/auth/auth.state";
import { refreshAccessToken } from "@main/services/auth/refresh.service";
import {
  cancelLogin,
  openExternal,
  startLogin,
} from "@main/services/auth/verify-launcher.service";
import type {
  ProfileUpdateParams,
  ProfileUpdateResult,
} from "@shared/types/app";
import { log } from "three/src/nodes/tsl/TSLBase.js";

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
  ipcMain.handle(IPC.auth.getToken, () => {
    return authState.getCurrentSession()?.accessToken ?? null;
  });

  ipcMain.handle(
    IPC.profile.update,
    async (_e, params: ProfileUpdateParams): Promise<ProfileUpdateResult> => {
      try {
        const body: Record<string, unknown> = {};
        if (params.displayName !== undefined) body.name = params.displayName;

        await http.put("/users/me", body, {
          headers: { ...authHeader(), "Content-Type": "application/json" },
        });

        // Refresh the auth state so UI updates with new name
        // (your auth service should have a refresh method; call it here)
        return { success: true };
      } catch (err: unknown) {
        const backend = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        const msg =
          backend ?? (err instanceof Error ? err.message : "Update failed");

        return { success: false, error: msg };
      }
    },
  );
}
