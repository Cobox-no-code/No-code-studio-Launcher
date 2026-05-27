import type {
  UnavailableReason,
  UpdateUsernameResponse,
  UserIdentityStatus,
  UsernameAvailabilityResponse,
} from "../../shared/types/username";
import { BACKEND_URL_PUBLIC } from "./config";
import { cobox } from "./electron";

/**
 * Username service lives under the same `/api` gateway as the rest of the
 * launcher. `BACKEND_URL_PUBLIC` already includes `/api`, e.g.
 * `https://api.cobox.games/api`.
 */
const API_BASE = BACKEND_URL_PUBLIC; // → https://api.cobox.games/api

// ────────────────────────────────────────────────────────────────────────────
// Client-side validation — instant feedback before any network call
// ────────────────────────────────────────────────────────────────────────────

/** Must start with a letter, end with letter or digit, only [a-z0-9_] in between. */
const USERNAME_REGEX = /^[a-z][a-z0-9_]*[a-z0-9]$/;

export interface LocalValidationResult {
  valid: boolean;
  reason?: UnavailableReason;
}

export function validateUsername(input: string): LocalValidationResult {
  if (input.length < 3) return { valid: false, reason: "too_short" };
  if (input.length > 20) return { valid: false, reason: "too_long" };
  if (!USERNAME_REGEX.test(input))
    return { valid: false, reason: "invalid_format" };
  if (/__/.test(input))
    return { valid: false, reason: "consecutive_underscores" };
  return { valid: true };
}

/** Human-readable copy for each `reason` code. */
export function reasonToMessage(reason: UnavailableReason): string {
  switch (reason) {
    case "too_short":
      return "Username must be at least 3 characters";
    case "too_long":
      return "Username must be 20 characters or fewer";
    case "invalid_format":
      return "Use lowercase letters, numbers, and underscores. Must start with a letter and end with a letter or number.";
    case "consecutive_underscores":
      return "Username cannot contain consecutive underscores";
    case "reserved":
      return "This username is reserved";
    case "taken":
      return "Username already taken";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Token retrieval with retry
// ────────────────────────────────────────────────────────────────────────────

/**
 * `cobox.auth.getToken()` can briefly return null right after `auth.status`
 * flips to "signed-in" — the session is set in main process a tick or two
 * after the status broadcast reaches the renderer. We retry up to 4 times
 * with backoff (~350ms total) before giving up.
 *
 * All logs use console.log so DevTools log-level filters can't hide them.
 */
async function getTokenWithRetry(maxAttempts = 4): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let token: string | null = null;
    try {
      token = await cobox.auth.getToken();
      console.log(
        `[username-api] getToken attempt ${attempt}: got token of length ${
          token ? token : "null"
        }`,
      );
    } catch (err) {
      console.log(
        `[username-api] getToken THREW (attempt ${attempt}/${maxAttempts}):`,
        err,
      );
    }
    if (token) {
      console.log(
        `[username-api] getToken OK on attempt ${attempt} (length=${token.length})`,
      );
      return token;
    }
    console.log(
      `[username-api] getToken returned null on attempt ${attempt}/${maxAttempts}` +
        (attempt < maxAttempts ? " — retrying after delay" : " — giving up"),
    );
    if (attempt < maxAttempts) {
      // 50, 100, 200ms backoff — total under 350ms
      await new Promise((r) => setTimeout(r, 50 * attempt));
    }
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Network calls — every step logged
// ────────────────────────────────────────────────────────────────────────────

/**
 * Public endpoint. Rate-limited to 30 req/min/IP — caller MUST debounce.
 * Returns null on network/HTTP errors so callers can treat as "unknown".
 */
export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameAvailabilityResponse | null> {
  const url = `${API_BASE}/users/username/check?username=${encodeURIComponent(username)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.log(
        `[username-api] check failed: ${res.status} ${res.statusText} url=${url} body=${body}`,
      );
      return null;
    }
    return (await res.json()) as UsernameAvailabilityResponse;
  } catch (err) {
    console.log("[username-api] check threw:", err, "url=", url);
    return null;
  }
}

/**
 * Synthesised "no identity yet" response — used when /me 404s. Per the API
 * doc, /me should return 200 with `username: null` for users without a
 * username yet. A 404 means the username service's v_user_identity view
 * doesn't include this user (a backend sync issue between auth service
 * and username service). We treat it as "no identity yet" so the picker
 * still opens and the user can try claiming a username.
 */
const SYNTHETIC_UNMINTED_IDENTITY: UserIdentityStatus = {
  username: null,
  identityStatus: "unminted",
  identityTokenId: null,
  identityContractAddress: null,
  identityChainId: null,
  identityMintedAt: null,
  canChangeUsername: true,
};

/**
 * Get current user's identity status. Returns null if request fails.
 * Heavily logged — if you don't see "ENTERED" in console, this isn't the
 * loaded version of the file (do a hard reload, Cmd+Shift+R).
 *
 * Special case: backend returns 404 when the user record isn't in the
 * username service's view. We treat that as "no username yet" so the
 * picker still opens (see SYNTHETIC_UNMINTED_IDENTITY above).
 */
export async function getMyIdentity(): Promise<UserIdentityStatus | null> {
  const url = `${API_BASE}/users/username/me`;
  console.log("[username-api] getMyIdentity: ENTERED, url=", url);

  try {
    console.log("[username-api] getMyIdentity: requesting JWT (with retry)…");
    const token = await getTokenWithRetry();
    if (!token) {
      console.log(
        "[username-api] getMyIdentity: ABORTING — no JWT after all retries.",
      );
      return null;
    }

    console.log("[username-api] getMyIdentity: fetching…");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(
      `[username-api] getMyIdentity: response status=${res.status} ${res.statusText}`,
    );

    if (res.status === 404) {
      const body = await res.text().catch(() => "<no body>");
      console.warn(
        "[username-api] /me returned 404. Backend's v_user_identity view " +
          "doesn't include this user — likely a sync gap between auth " +
          "service and username service. Treating as 'no username yet' so " +
          "the picker can still open. Body=",
        body,
      );
      return SYNTHETIC_UNMINTED_IDENTITY;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.log(
        `[username-api] getMyIdentity: NON-OK status=${res.status} body=`,
        body,
      );
      return null;
    }

    const data = (await res.json()) as UserIdentityStatus;
    console.log("[username-api] getMyIdentity: OK, data=", data);
    return data;
  } catch (err) {
    console.log("[username-api] getMyIdentity: THREW:", err);
    return null;
  }
}

/**
 * Submit a new username. Throws an Error with a user-friendly message on
 * failure so the modal can display it directly.
 */
export async function setMyUsername(
  username: string,
): Promise<UpdateUsernameResponse> {
  const url = `${API_BASE}/users/username`;
  console.log(
    "[username-api] setMyUsername: PATCH",
    url,
    "username=",
    username,
  );

  const token = await getTokenWithRetry();
  if (!token) {
    throw new Error("You're signed out. Please log in again.");
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* response had no JSON body */
  }

  console.log(`[username-api] setMyUsername: status=${res.status} body=`, body);

  if (!res.ok) {
    const msg = extractErrorMessage(body, res.status);
    throw new Error(msg);
  }

  return body as UpdateUsernameResponse;
}

function extractErrorMessage(body: unknown, status: number): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof (body as { message: unknown }).message !== "undefined"
  ) {
    const m = (body as { message: unknown }).message;
    if (typeof m === "string" && m !== "User not found") return m;
    if (Array.isArray(m) && m.length > 0 && typeof m[0] === "string")
      return m[0];
  }
  if (status === 401) return "You're signed out. Please log in again.";
  if (status === 403)
    return "Username can't be changed right now (mint in progress or already minted).";
  if (status === 404)
    return "Your account isn't fully set up yet. Please contact support — the username service can't find your record.";
  if (status === 409) return "Username has just been taken — try another.";
  return "Couldn't update username. Please try again.";
}
