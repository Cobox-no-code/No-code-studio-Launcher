import { v4 as uuidv4 } from "uuid";
import { shell } from "electron";

import { http } from "@main/http/client";
import { log } from "@main/utils/logger";
import type {
  AuthTokens,
  AuthUser,
  StartLoginResult,
} from "@shared/types/auth";

import { authState } from "./auth.state";
import { saveSession } from "./token.service";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes, then auto-cancel

// Where the web login lives. If you move it behind an env var later, swap here.
const WEB_LOGIN_BASE = "https://cobox.games/login";

let activePoll: {
  tokenId: string;
  interval: NodeJS.Timeout;
  timeout: NodeJS.Timeout;
} | null = null;

type Broadcast = () => void;

function isSafeExternalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function openExternal(url: string): Promise<boolean> {
  if (!isSafeExternalUrl(url)) {
    log.warn("openExternal blocked (non-http):", url);
    return false;
  }
  await shell.openExternal(url);
  return true;
}

/**
 * Start the launcher login flow:
 *  - mint a one-time UUID
 *  - open the web login URL in the user's browser
 *  - begin polling verify-launcher every 3s
 *
 * broadcast() is injected so the service doesn't depend on the IPC layer —
 * keeps unit testing cheap.
 */
export async function startLogin(
  broadcast: Broadcast,
): Promise<StartLoginResult> {
  // If a previous login is in-flight, cancel it first
  cancelLogin(broadcast);

  const tokenId = uuidv4();
  const browserUrl = `${WEB_LOGIN_BASE}?tokenId=${encodeURIComponent(tokenId)}`;

  authState.set({
    status: "awaiting-browser",
    tokenId,
    user: null,
    error: null,
  });
  broadcast();

  const opened = await openExternal(browserUrl);
  if (!opened) {
    authState.setError("Could not open browser for login");
    broadcast();
    return { success: false, error: "Could not open browser" };
  }

  const timeout = setTimeout(() => {
    log.warn("Login poll timed out");
    cancelLogin(broadcast);
    authState.setError("Login timed out. Please try again.");
    broadcast();
  }, POLL_TIMEOUT_MS);

  const interval = setInterval(async () => {
    try {
      const res = await http.post("/auth/verify-launcher", {
        verificationToken: tokenId,
      });

      const body = res.data as {
        success?: boolean;
        user?: AuthUser;
        tokens?: AuthTokens;
      };

      if (body?.success && body.user && body.tokens) {
        // Success — stop polling, persist, broadcast
        log.info("Launcher verified for user:", body.user.email);
        saveSession(body.user, body.tokens);
        clearPoll();
        authState.setSignedIn(body.user);
        broadcast();
      }
      // Otherwise keep polling silently; backend returns 401/404 until ready.
    } catch (err: unknown) {
      // 401/404 during polling is expected — only log, don't break the loop
      const status =
        (err as { response?: { status?: number } })?.response?.status ?? 0;
      if (status !== 401 && status !== 404) {
        log.warn("verify-launcher poll error:", err);
      }
    }
  }, POLL_INTERVAL_MS);

  activePoll = { tokenId, interval, timeout };
  return { success: true, tokenId, browserUrl };
}

export function cancelLogin(broadcast: Broadcast): void {
  if (!activePoll) return;
  clearPoll();
  if (authState.snapshot.status === "awaiting-browser") {
    authState.setSignedOut();
    broadcast();
  }
}

function clearPoll(): void {
  if (!activePoll) return;
  clearInterval(activePoll.interval);
  clearTimeout(activePoll.timeout);
  activePoll = null;
}
