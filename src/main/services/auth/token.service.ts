import { secretStore } from "@main/persistence/secret.store";
import type { AuthTokens, AuthUser } from "@shared/types/auth";
import { log } from "@main/utils/logger";

export function saveSession(user: AuthUser, tokens: AuthTokens): void {
  secretStore.upsert({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  });
}

export function clearSession(): void {
  secretStore.upsert({
    accessToken: undefined,
    refreshToken: undefined,
    userId: undefined,
    userEmail: undefined,
    userName: undefined,
  });
  log.info("Auth session cleared");
}

export function getStoredTokens(): AuthTokens | null {
  const s = secretStore.read();
  if (!s.accessToken || !s.refreshToken) return null;
  return {
    accessToken: String(s.accessToken),
    refreshToken: String(s.refreshToken),
  };
}

export function getStoredUser(): Partial<AuthUser> | null {
  const s = secretStore.read();
  if (!s.userId) return null;
  return {
    id: s.userId as number | string,
    email: String(s.userEmail ?? ""),
    name: String(s.userName ?? ""),
  };
}
