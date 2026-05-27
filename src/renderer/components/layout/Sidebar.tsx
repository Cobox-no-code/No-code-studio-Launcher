import { ModeToggle } from "@renderer/components/ui/ModeToggle";
import { useToast } from "@renderer/components/ui/Toaster";
import { UsernamePickerModal } from "@renderer/components/username/UsernamePickerModal";
import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import { createSSOToken, type SSOMode } from "@renderer/lib/sso-api";
import { getMyIdentity } from "@renderer/lib/username-api";
import { useMode } from "@renderer/stores/mode.store";
import { Link, useLocation } from "@tanstack/react-router";
import { ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UserIdentityStatus } from "../../../shared/types/username";

type NavItem = { label: string; to: string };

const CREATOR_ACTIONS: NavItem[] = [
  { label: "CREATE WORLD", to: "/create-world" },
  { label: "CREATE GAME", to: "/create-game" },
];

const CREATOR_NAV: NavItem[] = [
  { label: "HOME", to: "/home" },
  { label: "SAVED", to: "/saved" },
  { label: "PUBLISHED", to: "/published" },
];

const PLAYER_NAV: NavItem[] = [
  { label: "HOME", to: "/home" },
  { label: "LIBRARY", to: "/library" },
  { label: "STORE", to: "/store" },
];

const activePillStyle: React.CSSProperties = {
  backgroundColor: "rgba(81, 17, 157, 0.45)",
  borderRadius: 7,
};

/**
 * Final destination on cobox.games for each mode. The SSO `next` param is
 * a relative path (backend rejects absolute URLs to prevent open-redirect
 * attacks per the SSO doc), so this is path-based even though cookies are
 * scoped to `.cobox.games` for cross-subdomain coverage.
 *
 * If the marketplace ever changes route shape (e.g. /creator-dashboard
 * instead of /c/<username>), update these and nothing else.
 */
function buildNextPath(mode: SSOMode, username: string): string {
  // encodeURIComponent guards against weird chars in case validation rules
  // ever loosen on the backend; today's username regex makes this a no-op.
  const safe = encodeURIComponent(username);
  switch (mode) {
    case "creator":
      return `/c/${safe}`;
    case "admin":
      return `/admin`;
    case "player":
    default:
      return `/p/${safe}`;
  }
}

export function Sidebar() {
  const [mode] = useMode();
  const location = useLocation();

  const actions = mode === "creator" ? CREATOR_ACTIONS : [];
  const nav = mode === "creator" ? CREATOR_NAV : PLAYER_NAV;

  return (
    <aside className="w-[200px] shrink-0 flex flex-col justify-between py-6">
      {/* Top: action buttons (creator only) */}
      <nav className="pl-3 flex flex-col gap-1">
        {actions.map((item) => (
          <NavRow
            key={item.to}
            item={item}
            active={location.pathname === item.to}
          />
        ))}
      </nav>

      {/* Bottom: navigation + dashboard CTA + mode toggle */}
      <nav className="pl-3 flex flex-col gap-1">
        {nav.map((item) => (
          <NavRow
            key={item.to}
            item={item}
            active={location.pathname === item.to}
          />
        ))}

        <div className="pt-4 pr-4">
          <DashboardButton mode={mode} />
        </div>

        <div className="pt-4 pl-1">
          <ModeToggle />
        </div>
      </nav>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NavRow — pill-with-accent-bar nav item
// ─────────────────────────────────────────────────────────────────────────────

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <div className="flex items-center">
      <Link
        to={item.to}
        data-no-drag
        style={active ? activePillStyle : undefined}
        className={cn(
          "block px-5 py-3 text-[11px] tracking-[0.1em] font-bold w-full transition-all rounded-md",
          active ? "text-white" : "text-brand-300 hover:text-white",
        )}
      >
        {item.label}
      </Link>
      {active && (
        <span className="w-1 h-[1.25rem] bg-brand-700 ml-4 rounded-sm" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardButton — opens cobox.games with proper SSO handoff
//
// Click flow:
//   1. Ensure we have identity (cached on mount).
//   2. If user has no username → open UsernamePickerModal. After they
//      claim one, we continue automatically (no second click).
//   3. POST /api/auth/sso/create with mode + next path → receive OTT URL.
//   4. shell.openExternal(redirect_url) → backend consumes OTT, sets cookies,
//      302-redirects browser to /p/<username> or /c/<username>.
//
// The launcher's JWT NEVER leaves the launcher — only the short-lived OTT
// (embedded in the redirect_url by the backend) is exposed to the browser.
// ─────────────────────────────────────────────────────────────────────────────

function DashboardButton({ mode }: { mode: "creator" | "player" }) {
  const { push: toast } = useToast();

  const [identity, setIdentity] = useState<UserIdentityStatus | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Tracks whether, after the user picks a username, we should continue
  // straight into opening the dashboard.
  const continueToDashboardRef = useRef(false);

  // Fetch identity once on mount.
  useEffect(() => {
    let cancelled = false;
    setIdentityLoading(true);
    void getMyIdentity().then((res) => {
      if (cancelled) return;
      setIdentity(res);
      setIdentityLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openDashboard = useCallback(
    async (username: string) => {
      setOpening(true);
      try {
        // The launcher's mode toggle is ("creator" | "player"). The SSO API
        // also accepts "admin" but we don't surface that here — admin SSO
        // would be a separate, opt-in entry point with extra IP checks.
        const ssoMode: SSOMode = mode;
        const next = buildNextPath(ssoMode, username);

        console.log(
          "[sidebar] opening dashboard. mode=",
          ssoMode,
          "next=",
          next,
        );

        const sso = await createSSOToken({
          mode: ssoMode,
          purpose: `launcher_dashboard_${ssoMode}`,
          next,
        });

        console.log(
          "[sidebar] SSO created, opening browser. expires_in=",
          sso.expires_in,
          "s",
        );

        const opened = await cobox.auth.openExternal(sso.redirect_url);
        if (!opened.success) {
          toast({
            kind: "error",
            title: "Couldn't open browser",
            body: "Try again, or visit https://cobox.games manually.",
          });
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Couldn't open dashboard. Please try again.";
        console.error("[sidebar] dashboard open failed:", err);
        toast({
          kind: "error",
          title: "Couldn't open dashboard",
          body: msg,
        });
      } finally {
        setOpening(false);
      }
    },
    [mode, toast],
  );

  const handleClick = async () => {
    if (opening || identityLoading) return;

    // Refresh identity right before acting — covers the case where the
    // user just claimed a handle in another modal and our cached state
    // is stale.
    let current = identity;
    if (!current) {
      const fresh = await getMyIdentity();
      current = fresh;
      if (fresh) setIdentity(fresh);
    }

    if (!current?.username) {
      // No username yet — gate behind the picker, then auto-continue.
      continueToDashboardRef.current = true;
      setShowPicker(true);
      return;
    }

    void openDashboard(current.username);
  };

  const handleUsernamePicked = (username: string) => {
    setIdentity((prev) =>
      prev
        ? { ...prev, username }
        : ({
            username,
            identityStatus: "unminted",
            identityTokenId: null,
            identityContractAddress: null,
            identityChainId: null,
            identityMintedAt: null,
            canChangeUsername: true,
          } as UserIdentityStatus),
    );
    setShowPicker(false);

    if (continueToDashboardRef.current) {
      continueToDashboardRef.current = false;
      void openDashboard(username);
    }
  };

  const handlePickerClose = () => {
    continueToDashboardRef.current = false;
    setShowPicker(false);
  };

  const label = mode === "creator" ? "CREATOR DASHBOARD" : "PLAYER DASHBOARD";

  const titleText = identity?.username
    ? `Open cobox.games${buildNextPath(mode, identity.username)}`
    : `Open your ${mode} dashboard`;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={opening || identityLoading}
        data-no-drag
        title={titleText}
        className={cn(
          "group relative w-full",
          "flex items-center justify-between gap-2",
          "px-4 py-2.5 rounded-md",
          "text-[10px] tracking-[0.12em] font-bold text-white text-left",
          "border border-brand-700/50",
          "bg-gradient-to-br from-brand-700/30 via-brand-700/15 to-black/40",
          "hover:from-brand-700/55 hover:via-brand-700/30 hover:to-black/50",
          "hover:border-brand-700/80",
          "shadow-[0_4px_14px_rgba(81,17,157,0.25)]",
          "hover:shadow-[0_4px_18px_rgba(81,17,157,0.45)]",
          "transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-brand-700/30",
        )}
      >
        <span className="leading-tight">{label}</span>
        {opening ? (
          <Loader2 size={11} className="animate-spin shrink-0 opacity-80" />
        ) : (
          <ExternalLink
            size={11}
            className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          />
        )}
      </button>

      <UsernamePickerModal
        open={showPicker}
        onClose={handlePickerClose}
        onSuccess={handleUsernamePicked}
        dismissable
      />
    </>
  );
}
