import { BACKEND_URL_PUBLIC } from "./config";

export interface PlayerGame {
  game_id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  genre: string | null;
  tags: string[];
  rating_avg: string | number;
  rating_count: number;
  install_count: number;
  total_sessions_played: string | number;
  total_unique_players: string | number;
  is_reward_eligible: boolean;
  is_featured: boolean;
  current_version: string | null;
  display_name: string | null;
  published_at: string | null;
  created_at: string;
  creator_name: string;
  creator_avatar: string | null;
}

export interface GamesResponse {
  total: number;
  limit: number;
  offset: number;
  data: PlayerGame[];
}

export interface GameCategory {
  category_id: string;
  name: string;
  slug: string;
  game_count: number;
}

export const API_BASE = BACKEND_URL_PUBLIC;

// ── Seeded pseudo-random helpers (ported from web) ──────────────────────────
function seededRand(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(hash % 1000) / 1000;
  return Math.floor(min + norm * (max - min));
}

export function displayRating(game: PlayerGame): number {
  const api = parseFloat(String(game.rating_avg ?? "0")) || 0;
  if (api >= 3.0) return api;
  return 3.1 + seededRand(game.game_id + "r", 0, 180) / 100;
}

export function displayInstalls(game: PlayerGame): number {
  const api = game.install_count || 0;
  if (api > 0) return api;
  return seededRand(game.game_id + "i", 80, 4000);
}

export function displayPlayers(game: PlayerGame): number {
  const api = parseInt(String(game.total_unique_players ?? "0")) || 0;
  if (api > 0) return api;
  const installs = displayInstalls(game);
  const pct = 0.3 + seededRand(game.game_id + "p", 0, 40) / 100;
  return Math.floor(installs * pct);
}

export function gameThumb(game: PlayerGame, fallback: string): string {
  return game.thumbnail_url || game.banner_url || fallback;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}
