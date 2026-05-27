import { BACKEND_URL_PUBLIC } from "./config";
import { cobox } from "./electron";

/**
 * Cobox SSO — launcher → marketplace handoff via one-time tokens (OTT).
 *
 * Per cobox-sso-api-reference.docx, the launcher does NOT pass its JWT in the
 * URL. Instead it asks the backend for a short-lived OTT (128-bit random,
 * 2-minute TTL, single-use) wrapped in a fully-formed `redirect_url`. The
 * launcher just opens that URL — the backend handles consume + cookie setting
 * via Nginx proxy at cobox.games/auth/sso.
 *
 * Threat model addressed:
 *  - URL/referer leakage: OTT is meaningless after one consume
 *  - History attacks: even if URL is logged, OTT is dead within 2 minutes
 *  - Replay: SELECT FOR UPDATE atomic delete prevents double-consume
 *  - XSS exfiltration: cookies are HttpOnly so JS can't read them
 *
 * ── URL patterns ──────────────────────────────────────────────────────────
 *
 *  PROD (cobox.games):
 *    SSO lands at:   https://cobox.games/auth/sso?token=xxx&mode=player&next=/p/sarthak
 *    After consume:  https://sarthak.cobox.games/              (player)
 *                    https://sarthak.cobox.games/?view=creator  (creator)
 *    Cookie domain:  .cobox.games — shared across all subdomains ✓
 *
 *  DEV (localhost):
 *    SSO lands at:   http://localhost:3000/auth/sso?token=xxx&mode=player&next=/p/sarthak
 *    After consume:  http://localhost:3000/dashboard?_u=sarthak&_mode=player
 *    NOTE: Browsers don't allow cookie sharing across .localhost subdomains,
 *    so dev uses path-based routing instead of subdomains.
 *    Set VITE_SSO_BROWSER_OVERRIDE=http://localhost:3000 in launcher .env
 */

export type SSOMode = "player" | "creator" | "admin";

export interface CreateSSORequest {
  mode: SSOMode;
  /** Free-text audit tag, optional. Backend logs it for tracing. */
  purpose?: string;
  /**
   * Post-login redirect path within cobox.games. RELATIVE PATH ONLY —
   * backend rejects absolute URLs to prevent open-redirect attacks.
   *
   * Format:
   *   player  → "/p/<username>"
   *   creator → "/c/<username>"
   *   admin   → "/admin"
   *
   * Middleware on marketplace reads this to build the final subdomain URL.
   */
  next?: string;
}

export interface CreateSSOResponse {
  /** The OTT itself — launcher doesn't need to send this anywhere. */
  ott: string;
  /** Seconds until the OTT expires. Currently 120. */
  expires_in: number;
  /**
   * Pre-built browser URL:
   *   https://cobox.games/auth/sso?token=<ott>&mode=<mode>&next=<encoded-path>
   *
   * In dev with VITE_SSO_BROWSER_OVERRIDE, host is rewritten to localhost:3000.
   * Open with shell.openExternal.
   */
  redirect_url: string;
}

/**
 * Request a one-time SSO token and the browser URL to open.
 * Throws with a user-facing message on failure.
 * Rate-limited to 10 req/min/JWT — don't poll this.
 */
export async function createSSOToken(
  params: CreateSSORequest,
): Promise<CreateSSOResponse> {
  const url = `${BACKEND_URL_PUBLIC}/auth/sso/create`;
  console.log("[sso-api] createSSOToken: POST", url, "params=", params);

  const token = await cobox.auth.getToken();
  if (!token) {
    throw new Error("You're signed out. Please log in again.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* no JSON body */
  }

  console.log(`[sso-api] createSSOToken: status=${res.status} body=`, body);

  if (!res.ok) {
    throw new Error(extractErrorMessage(body, res.status));
  }

  const r = body as Partial<CreateSSOResponse> | null;
  if (!r || typeof r.redirect_url !== "string" || !r.redirect_url) {
    throw new Error("Unexpected response from server. Please try again.");
  }

  // ── Dev redirect override ─────────────────────────────────────────────
  //
  // Backend builds redirect_url pointing to cobox.games.
  // In dev we rewrite the host to localhost:3000 so the marketplace
  // dev server handles the SSO consume.
  //
  // Set in launcher .env:
  //   VITE_SSO_BROWSER_OVERRIDE=http://localhost:3000
  //
  // After consuming, middleware routes:
  //   PROD → https://sarthak.cobox.games/
  //   DEV  → http://localhost:3000/dashboard?_u=sarthak&_mode=player
  //
  // (.localhost subdomains can't share cookies — dev uses path routing)
  //
  const override = import.meta.env.DEV
    ? (import.meta.env.VITE_SSO_BROWSER_OVERRIDE as string | undefined)
    : undefined;

  if (override) {
    try {
      const original = new URL(r.redirect_url);
      const target = new URL(override);

      original.protocol = target.protocol;
      original.host = target.host; // includes port if present

      const rewritten = original.toString();
      console.log(
        "[sso-api] DEV override. original=",
        r.redirect_url,
        "→ rewritten=",
        rewritten,
      );
      r.redirect_url = rewritten;
    } catch (err) {
      console.warn("[sso-api] override failed — using server URL.", err);
    }
  }

  return r as CreateSSOResponse;
}

// ── Error message extraction ──────────────────────────────────────────────

function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
    if (Array.isArray(m) && m.length > 0 && typeof m[0] === "string")
      return m[0];
  }
  if (status === 401) return "Your session expired. Please log in again.";
  if (status === 403)
    return "Your account is banned or inactive. Contact support.";
  if (status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  return "Couldn't open dashboard. Please try again.";
}
