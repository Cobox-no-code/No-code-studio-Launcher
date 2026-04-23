import type {
  PublishCategory,
  PublishedGame,
} from "../../shared/types/publish";
import { BACKEND_URL_PUBLIC } from "./config";
import { cobox } from "./electron";

const API_BASE = BACKEND_URL_PUBLIC;

async function authHeaders(): Promise<Record<string, string>> {
  const token = await cobox.auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCategories(): Promise<PublishCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch {
    return [];
  }
}

export async function fetchMyPublished(): Promise<PublishedGame[]> {
  const res = await fetch(`${API_BASE}/published-games/my`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function fetchPublishedGame(
  gameId: string,
): Promise<PublishedGame> {
  const res = await fetch(`${API_BASE}/published-games/${gameId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log("fetchPublishedGame response:", data);
  return data?.data ?? data;
}
