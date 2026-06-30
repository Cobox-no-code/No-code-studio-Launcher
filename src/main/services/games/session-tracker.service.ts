import { app } from "electron";
import { randomUUID } from "crypto";

import { http } from "@main/http/client";
import { workerStore } from "@main/persistence/worker.store";
import { getStoredTokens } from "@main/services/auth/token.service";
import { log } from "@main/utils/logger";

/**
 * Engagement tracker — fires the Cobox backend tracking endpoints.
 *
 *   POST /games/:id/view        (no auth)   ← game detail opened
 *   POST /games/:id/install     (Bearer)    ← download finished
 *   POST /games/:id/launch      (Bearer)    ← game process spawned
 *   POST /games/:id/uninstall   (Bearer)    ← game removed
 *   POST /sessions/start        (Bearer)    ← gameplay starts → { session_id }
 *   POST /sessions/:id/end      (Bearer)    ← gameplay ends (duration + score)
 *
 * Design rules:
 *   - 100% fire-and-forget. Tracking must NEVER block or fail a launch/install.
 *   - Session = wall-clock time a game is the active "play" intent in a running
 *     Studio process. Approximate (includes idle/menu time) — fine for
 *     engagement metrics. Unreal-reported sessions remain the source of truth.
 *   - Only ONE play session is active at a time (single shared Studio process).
 *   - Open session is persisted to worker.json so a launcher crash doesn't lose
 *     it — recoverAbandonedSession() closes it on next startup.
 *
 * ⚠️  SESSION BODY FIELD NAMES: this uses { game_id, platform } for start and
 *     { score, duration_seconds, metadata } for end (REST-consistent). If your
 *     new /sessions endpoints expect { gameId } / { raw_score, metrics }, flip
 *     the three marked lines below.
 */

const MAX_SESSION_SECONDS = 6 * 60 * 60; // 6h cap → avoids abuse-check rejects

interface OpenSession {
  sessionId: string;
  gameId: string;
  startedAtMs: number;
}

let active: OpenSession | null = null;

function platformLabel(): string {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    default:
      return process.platform;
  }
}

function appVersion(): string {
  try {
    return app.getVersion();
  } catch {
    return "0.0.0";
  }
}

function osVersion(): string | undefined {
  // Electron augments process with getSystemVersion()
  return (
    process as NodeJS.Process & { getSystemVersion?: () => string }
  ).getSystemVersion?.();
}

/** One stable per-device id, persisted in worker.json (feeds per-device installs + abuse detection). */
function deviceFingerprint(): string {
  try {
    const existing = workerStore.read().deviceFingerprint as string | undefined;
    if (existing) return existing;
    const fp = randomUUID();
    workerStore.update({ deviceFingerprint: fp });
    return fp;
  } catch {
    return "unknown-device";
  }
}

/** Bearer header or null — never throws. */
function bearer(): Record<string, string> | null {
  const t = getStoredTokens();
  if (!t?.accessToken) return null;
  return { Authorization: `Bearer ${t.accessToken}` };
}

function persistOpen(s: OpenSession | null): void {
  try {
    workerStore.update({ openPlaySession: s ?? undefined });
  } catch (err) {
    log.warn("[tracker] failed to persist open session:", err);
  }
}

function logFail(label: string, err: unknown): void {
  const status = (err as { response?: { status?: number } })?.response?.status;
  log.warn(`[tracker] ${label} failed (${status ?? "no-response"})`);
}

// ── View (no auth) ──────────────────────────────────────────────────────────
export async function trackView(gameId: string): Promise<void> {
  try {
    await http.post(`/games/${gameId}/view`, {
      device_fingerprint: deviceFingerprint(),
      source: "launcher",
    });
    log.info(`[tracker] view ${gameId} ok`);
  } catch (err) {
    logFail(`view ${gameId}`, err);
  }
}

// ── Install (Bearer) ────────────────────────────────────────────────────────
export async function trackInstall(gameId: string): Promise<void> {
  const headers = bearer();
  if (!headers) {
    log.info(`[tracker] install ${gameId} skipped — not authenticated`);
    return;
  }
  try {
    const res = await http.post(
      `/games/${gameId}/install`,
      {
        platform: platformLabel(),
        device_fingerprint: deviceFingerprint(),
        install_source: "launcher",
        app_version: appVersion(),
        os_version: osVersion(),
      },
      { headers },
    );
    log.info(
      `[tracker] install ${gameId} ok — install_count=${res.data?.install_count}`,
    );
  } catch (err) {
    logFail(`install ${gameId}`, err);
  }
}

// ── Launch (Bearer) ─────────────────────────────────────────────────────────
export async function trackLaunch(gameId: string): Promise<void> {
  const headers = bearer();
  if (!headers) {
    log.info(`[tracker] launch ${gameId} skipped — not authenticated`);
    return;
  }
  try {
    await http.post(
      `/games/${gameId}/launch`,
      { device_fingerprint: deviceFingerprint() },
      { headers },
    );
    log.info(`[tracker] launch ${gameId} ok`);
  } catch (err) {
    logFail(`launch ${gameId}`, err);
  }
}

// ── Uninstall (Bearer) ──────────────────────────────────────────────────────
export async function trackUninstall(gameId: string): Promise<void> {
  const headers = bearer();
  if (!headers) {
    log.info(`[tracker] uninstall ${gameId} skipped — not authenticated`);
    return;
  }
  try {
    await http.post(`/games/${gameId}/uninstall`, {}, { headers });
    log.info(`[tracker] uninstall ${gameId} ok`);
  } catch (err) {
    logFail(`uninstall ${gameId}`, err);
  }
}

// ── Sessions (Bearer) ───────────────────────────────────────────────────────

/**
 * Begin a play session.
 *   - Same game already active → no-op (keep counting).
 *   - Different game active     → end the old one first, then start new.
 *   - Nothing active            → start fresh.
 */
export async function beginPlaySession(gameId: string): Promise<void> {
  if (active && active.gameId === gameId) return;
  if (active) await endActivePlaySession("switched-game");

  const headers = bearer();
  if (!headers) {
    log.info(`[tracker] session start ${gameId} skipped — not authenticated`);
    return;
  }

  try {
    const res = await http.post(
      `/sessions/start`,
      // ⚠️ flip to { gameId, ... } if your backend expects camelCase
      {
        game_id: gameId,
        platform: platformLabel(),
        device_fingerprint: deviceFingerprint(),
      },
      { headers },
    );
    const sessionId: string | undefined = res.data?.session_id;
    if (!sessionId) {
      log.warn(`[tracker] session start ${gameId} returned no session_id`);
      return;
    }
    active = { sessionId, gameId, startedAtMs: Date.now() };
    persistOpen(active);
    log.info(`[tracker] session started ${sessionId} for game ${gameId}`);
  } catch (err) {
    logFail(`session start ${gameId}`, err);
  }
}

export async function endActivePlaySession(reason: string): Promise<void> {
  const s = active;
  active = null;
  persistOpen(null);
  if (!s) return;

  const headers = bearer();
  if (!headers) return;

  const durationSeconds = Math.max(
    1,
    Math.min(
      MAX_SESSION_SECONDS,
      Math.round((Date.now() - s.startedAtMs) / 1000),
    ),
  );

  try {
    await http.post(
      `/sessions/${s.sessionId}/end`,
      // ⚠️ flip to { raw_score, metrics } if your backend expects those keys
      {
        score: 0,
        duration_seconds: durationSeconds,
        metadata: { source: "launcher", reason },
      },
      { headers },
    );
    log.info(
      `[tracker] session ended ${s.sessionId} (${durationSeconds}s, ${reason})`,
    );
  } catch (err) {
    logFail(`session end ${s.sessionId}`, err);
  }
}

/** Startup: close out any session left open by a previous crash. */
export async function recoverAbandonedSession(): Promise<void> {
  let saved: OpenSession | undefined;
  try {
    saved = workerStore.read().openPlaySession as OpenSession | undefined;
  } catch {
    return;
  }
  if (!saved?.sessionId) return;

  persistOpen(null);
  active = null;

  const headers = bearer();
  if (!headers) {
    log.info(
      "[tracker] abandoned session found but not authenticated — dropped",
    );
    return;
  }

  const durationSeconds = Math.max(
    1,
    Math.min(
      MAX_SESSION_SECONDS,
      Math.round((Date.now() - saved.startedAtMs) / 1000),
    ),
  );

  try {
    await http.post(
      `/sessions/${saved.sessionId}/end`,
      {
        score: 0,
        duration_seconds: durationSeconds,
        metadata: { source: "launcher", reason: "recovered" },
      },
      { headers },
    );
    log.info(
      `[tracker] recovered + ended session ${saved.sessionId} (${durationSeconds}s)`,
    );
  } catch (err) {
    logFail(`recovery end ${saved.sessionId}`, err);
  }
}

/** Best-effort flush for app quit (recovery is the safety net). */
export function flushOnQuit(): void {
  if (active) void endActivePlaySession("app-quit");
}
