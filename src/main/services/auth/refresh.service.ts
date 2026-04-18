import { http } from "@main/http/client";
import { log } from "@main/utils/logger";
import type { AuthTokens, AuthUser } from "@shared/types/auth";

import { authState } from "./auth.state";
import { clearSession, getStoredTokens, saveSession } from "./token.service";

type Broadcast = () => void;

/** HTTP codes that mean "the token is definitively invalid — clear it". */
const AUTH_FAILURE_CODES = new Set([400, 401, 403]);

export async function refreshAccessToken(
  broadcast: Broadcast,
): Promise<AuthTokens | null> {
  const stored = getStoredTokens();
  if (!stored) return null;

  try {
    const res = await http.post("/token/refresh", {
      refresh_token: stored.refreshToken,
    });
    const body = res.data as { success?: boolean; tokens?: AuthTokens };
    if (!body?.success || !body.tokens) throw new Error("Refresh rejected");

    const existing = authState.snapshot.user;
    if (existing) {
      saveSession(existing, body.tokens);
    } else {
      saveSession({ id: "", name: "", email: "" } as AuthUser, body.tokens);
    }
    log.info("Access token refreshed");
    return body.tokens;
  } catch (err: unknown) {
    const status =
      (err as { response?: { status?: number } })?.response?.status ?? 0;

    if (AUTH_FAILURE_CODES.has(status)) {
      // Token definitively invalid — clear and force re-login
      log.info(
        `Refresh rejected by server (${status}) — user must sign in again`,
      );
      clearSession();
      authState.setSignedOut();
      broadcast();
      return null;
    }

    // Network error, timeout, 5xx — keep cached session, user can retry later
    const msg = err instanceof Error ? err.message : String(err);
    log.warn(`Refresh failed transiently (status=${status || "none"}): ${msg}`);
    return null;
  }
}
