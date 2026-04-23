import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownRoot,
  DropdownTrigger,
} from "@renderer/components/ui/DropdownMenu";
import { usePlayerGames } from "@renderer/hooks/usePlayerGames";
import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import {
  API_BASE,
  type GameCategory,
  type GamesResponse,
  type PlayerGame,
} from "@renderer/lib/games-api";
import { ChevronDown, Filter, Gamepad2, Search, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LauncherHandoff } from "../studio/LauncherHandoff";
import { GameCard } from "./GameCard";
import { ShareModal } from "./ShareModal";

const LIMIT = 12;

const SORT_OPTIONS = [
  { value: "install_count", label: "Most Installed" },
  { value: "rating_avg", label: "Top Rated" },
  { value: "created_at", label: "Newest First" },
  { value: "total_sessions_played", label: "Most Played" },
];

export function PlayerHome() {
  const [games, setGames] = useState<PlayerGame[]>([]);
  const [categories, setCategories] = useState<GameCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<{
    slug: string;
    name: string;
  }>({ slug: "all", name: "All games" });
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [shareGame, setShareGame] = useState<PlayerGame | null>(null);
  const gameIds = useMemo(() => games.map((g) => g.game_id), [games]);
  const { getState, setState, refresh } = usePlayerGames(gameIds);
  const [playingNow, setPlayingNow] = useState(false);
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
        sort_by: sortBy.value,
        ...(search && { search }),
        ...(activeCategory.slug !== "all" && { category: activeCategory.slug }),
      });
      const res = await fetch(`${API_BASE}/games?${params}`);
      const data = (await res.json()) as GamesResponse;
      setGames(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setGames([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, sortBy, activeCategory]);

  useEffect(() => {
    void fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const goToPage = (p: number) => setOffset((p - 1) * LIMIT);

  const allCategories = useMemo(
    () => [
      { slug: "all", name: "All games", game_count: total },
      ...categories,
    ],
    [categories, total],
  );
  // Install flow: fetch detail → call live-games download
  const handleInstall = useCallback(
    async (game: PlayerGame) => {
      setState(game.game_id, {
        phase: "downloading",
        percent: 0,
        error: null,
      });

      try {
        const res = await fetch(`${API_BASE}/games/${game.game_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const detail = await res.json();

        const fileUrl: string | undefined =
          detail?.file_url ?? detail?.data?.file_url;
        if (!fileUrl) throw new Error("No download URL returned");

        const dl = await cobox.games.liveGames.download({
          url: fileUrl,
          gameId: game.game_id,
          title: game.title,
        });

        if (!dl.success || !dl.path) {
          throw new Error(dl.error ?? "Download failed");
        }

        setState(game.game_id, {
          phase: "installed",
          percent: 100,
          savPath: dl.path,
          error: null,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Install failed";
        setState(game.game_id, {
          phase: "error",
          percent: 0,
          error: msg,
        });
      }
    },
    [setState],
  );

  const handlePlay = useCallback(
    async (game: PlayerGame) => {
      const s = getState(game.game_id);
      if (!s.savPath) {
        // Shouldn't happen — install flow sets savPath. Refresh and retry.
        await refresh();
        const s2 = getState(game.game_id);
        if (!s2.savPath) return;
      }

      setPlayingNow(true);
      const res = await cobox.games.liveGames.play({
        gameId: game.game_id,
        savPath: s.savPath as string,
      });
      if (!res.success) {
        setState(game.game_id, {
          phase: "error",
          error: res.error ?? "Launch failed",
        });
      }
      // Studio takes focus; keep modal up briefly then dismiss
      setTimeout(() => setPlayingNow(false), 2_000);
    },
    [getState, refresh, setState],
  );

  const handleRetry = useCallback(
    (game: PlayerGame) => handleInstall(game),
    [handleInstall],
  );

  return (
    <div className="h-full overflow-auto bg-[#080609]">
      {/* Compact page header — title + search + category + sort */}
      <header className="sticky top-0 z-20  backdrop-blur-lg border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl leading-none">
              Games
            </h1>
            <p className="mt-1 text-xs text-text-muted">
              {loading
                ? "Loading…"
                : total > 0
                  ? `${total} game${total !== 1 ? "s" : ""}${activeCategory.slug !== "all" ? ` in ${activeCategory.name}` : ""}`
                  : "No games found"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search games…"
                className="w-64 h-9 bg-bg border border-border-strong rounded-md text-white placeholder:text-text-muted pl-9 pr-8 text-xs focus:outline-none focus:border-brand-700/70 transition"
                data-no-drag
                data-selectable
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition"
                  data-no-drag
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category dropdown */}
            <DropdownRoot>
              <DropdownTrigger className="h-9 px-3 flex items-center gap-1.5 rounded-md bg-bg border border-border-strong text-xs text-text-secondary hover:text-white hover:border-brand-700/60 transition min-w-[140px]">
                <Filter size={12} />
                <span className="truncate flex-1 text-left">
                  {activeCategory.name}
                </span>
                <ChevronDown size={12} className="text-text-muted" />
              </DropdownTrigger>
              <DropdownContent className="max-h-[360px] overflow-auto">
                <DropdownLabel>Category</DropdownLabel>
                {allCategories.map((cat) => (
                  <DropdownItem
                    key={cat.slug}
                    active={cat.slug === activeCategory.slug}
                    onSelect={() => {
                      setActiveCategory({ slug: cat.slug, name: cat.name });
                      setOffset(0);
                    }}
                  >
                    <span className="truncate">{cat.name}</span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </DropdownRoot>

            {/* Sort dropdown */}
            <DropdownRoot>
              <DropdownTrigger className="h-9 px-3 flex items-center gap-1.5 rounded-md bg-bg border border-border-strong text-xs text-text-secondary hover:text-white hover:border-brand-700/60 transition min-w-[160px]">
                <Zap size={12} />
                <span className="truncate flex-1 text-left">
                  {sortBy.label}
                </span>
                <ChevronDown size={12} className="text-text-muted" />
              </DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Sort by</DropdownLabel>
                {SORT_OPTIONS.map((opt) => (
                  <DropdownItem
                    key={opt.value}
                    active={opt.value === sortBy.value}
                    onSelect={() => {
                      setSortBy(opt);
                      setOffset(0);
                    }}
                  >
                    {opt.label}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </DropdownRoot>
          </div>
        </div>
      </header>

      {/* Grid */}
      <section className="px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {loading ? (
            Array.from({ length: LIMIT }).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : games.length > 0 ? (
            games.map((game) => (
              <GameCard
                key={game.game_id}
                game={game}
                state={getState(game.game_id)}
                onShare={setShareGame}
                onOpen={() => {
                  // TODO: navigate to game detail page
                }}
                onInstall={handleInstall}
                onPlay={handlePlay}
                onRetry={handleRetry}
              />
            ))
          ) : (
            <EmptyState
              searchActive={!!searchInput}
              onClearSearch={() => setSearchInput("")}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <PageBtn
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              ←
            </PageBtn>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <PageBtn
                  key={p}
                  active={currentPage === p}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </PageBtn>
              );
            })}
            <PageBtn
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              →
            </PageBtn>
          </div>
        )}
      </section>
      <LauncherHandoff
        open={playingNow}
        intent={playingNow ? "game" : null}
        onClose={() => setPlayingNow(false)}
      />
      {shareGame && (
        <ShareModal game={shareGame} onClose={() => setShareGame(null)} />
      )}
    </div>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-no-drag
      className={cn(
        "min-w-8 h-8 px-2 text-xs font-semibold rounded-md border transition",
        active
          ? "bg-brand-700 border-brand-700 text-white"
          : "bg-bg border-border-strong text-text-muted hover:text-white hover:border-brand-700/60",
        "disabled:opacity-30 disabled:cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({
  searchActive,
  onClearSearch,
}: {
  searchActive: boolean;
  onClearSearch: () => void;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <Gamepad2 size={36} className="text-text-muted/40 mb-3" />
      <h3 className="text-text-secondary font-semibold mb-1 text-sm">
        No games found
      </h3>
      <p className="text-text-muted text-xs">
        Try a different search or filter
      </p>
      {searchActive && (
        <button
          onClick={onClearSearch}
          className="mt-4 text-xs text-brand-300 hover:text-white border border-brand-700/50 rounded-md px-4 py-2 transition"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-surface-1/60 border border-border rounded-md overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="px-2.5 pt-2 pb-1.5 space-y-1.5">
        <div className="h-3 bg-white/8 w-3/4 rounded" />
        <div className="h-2 bg-white/5 w-1/2 rounded" />
      </div>
      <div className="px-2.5 pb-2.5 flex gap-1.5">
        <div className="h-7 bg-white/5 rounded flex-1" />
        <div className="h-7 w-7 bg-white/5 rounded" />
      </div>
    </div>
  );
}
