import { getStoredTokens } from "@main/services/auth/token.service";

export function authHeader(): Record<string, string> {
  const t = getStoredTokens();
  if (!t) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${t.accessToken}` };
}
