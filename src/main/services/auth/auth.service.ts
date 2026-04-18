import { BrowserWindow } from "electron";

import { http } from "@main/http/client";
import { log } from "@main/utils/logger";
import { safeSend } from "@main/utils/safe-send";
import { IPC } from "@shared/ipc-contract";
import type { AuthState, AuthUser } from "@shared/types/auth";

import { authState } from "./auth.state";
import { refreshAccessToken } from "./refresh.service";
import { clearSession, getStoredTokens, getStoredUser } from "./token.service";

let _getMainWindow: () => BrowserWindow | null = () => null;

export function broadcastAuth() {
  safeSend(_getMainWindow(), IPC.auth.stateChanged, authState.snapshot);
}

/**
 * Called once at startup.
 * If a valid session is stored, tries to validate it with /users/me.
 * If the token is expired, attempts refresh.
 * On total failure, leaves state as signed-out.
 */
export async function initAuthService(
  getMainWindow: () => BrowserWindow | null,
): Promise<void> {
  _getMainWindow = getMainWindow;

  const tokens = getStoredTokens();
  const user = getStoredUser();
  if (!tokens) {
    log.info("Auth: no stored session");
    authState.setSignedOut();
    return;
  }

  // Optimistically mark signed-in from cache so the UI doesn't flash login
  if (user?.id) {
    authState.set({
      status: "signed-in",
      user: user as AuthUser,
      tokenId: null,
      error: null,
    });
  }

  // Validate in the background
  try {
    const res = await http.get("/users/me", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    const fresh = res.data as AuthUser;
    if (fresh?.id) {
      authState.setSignedIn(fresh);
      log.info("Auth: session validated for", fresh.email);
    }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;

    if (status === 401) {
      log.info("Auth: access token expired, attempting refresh");
      const refreshed = await refreshAccessToken(broadcastAuth);
      if (!refreshed) return; // refresh.service handled the state transition

      try {
        const retry = await http.get("/users/me", {
          headers: { Authorization: `Bearer ${refreshed.accessToken}` },
        });
        const fresh = retry.data as AuthUser;
        if (fresh?.id) authState.setSignedIn(fresh);
      } catch (retryErr) {
        const retryStatus = (retryErr as { response?: { status?: number } })
          ?.response?.status;
        if (retryStatus && [400, 401, 403].includes(retryStatus)) {
          clearSession();
          authState.setSignedOut();
        }
        // else: keep cached state, let user retry later
      }
    } else {
      log.warn(
        `Auth: /users/me failed (status=${status ?? "none"}) — keeping cached session`,
      );
      // Don't sign out on network/5xx — offline-tolerant
    }
  } finally {
    broadcastAuth();
  }
}

export function logout(): AuthState {
  clearSession();
  authState.setSignedOut();
  broadcastAuth();
  return authState.snapshot;
}
