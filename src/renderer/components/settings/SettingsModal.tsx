import { useToast } from "@renderer/components/ui/Toaster";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cn } from "@renderer/lib/cn";
import { cobox } from "@renderer/lib/electron";
import {
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { AppVersionInfo } from "../../../shared/types/app";
import { WhatsNewModal } from "./WhatsNewModal";

interface Props {
  open: boolean;
  onClose: () => void;
}

function avatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
    seed || "cobox",
  )}`;
}

export function SettingsModal({ open, onClose }: Props) {
  const auth = useAuthState();
  const { push: toast } = useToast();
  const user = auth?.user;

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [appInfo, setAppInfo] = useState<AppVersionInfo | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Sync local state with auth
  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.name]);

  // Fetch app version
  useEffect(() => {
    if (!open) return;
    void cobox.app.getVersion().then(setAppInfo);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === user?.name) {
      setEditingName(false);
      setDisplayName(user?.name ?? "");
      return;
    }
    setSaving(true);
    const res = await cobox.profile.update({ displayName: trimmed });
    setSaving(false);
    if (res.success) {
      toast({ kind: "success", title: "Display name updated" });
      setEditingName(false);
      // Optimistic — auth state should refresh via your auth hook
    } else {
      toast({ kind: "error", title: "Update failed", body: res.error });
    }
  };

  const handleSignOut = async () => {
    await cobox.auth.logout();
    setShowSignOutConfirm(false);
    onClose();
    // Route change happens via auth state listener in your app root
  };

  const handleOpenDataFolder = async () => {
    const res = await cobox.app.openDataFolder();
    if (!res.success) {
      toast({ kind: "error", title: "Couldn't open folder", body: res.error });
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    const res = await cobox.app.clearCache();
    setClearingCache(false);
    if (res.success) {
      toast({ kind: "success", title: "Cache cleared" });
    } else {
      toast({ kind: "error", title: "Clear failed", body: res.error });
    }
  };

  const handleCheckForUpdates = async () => {
    const res = await cobox.updater.check();
    if (res.updateInfo?.version) {
      toast({
        kind: "info",
        title: `Update available: ${res.updateInfo.version}`,
        body: "Download will begin automatically.",
      });
    } else {
      toast({ kind: "info", title: "You're up to date" });
    }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "—";

  const buildDate = appInfo?.buildDate
    ? new Date(appInfo.buildDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(12px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl bg-surface-1 border border-border-strong shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-bold text-base tracking-wide">
                Settings
              </h2>
              <button
                onClick={onClose}
                data-no-drag
                aria-label="Close"
                className="text-text-muted hover:text-white transition p-1 rounded-md hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-auto">
              {/* ── Profile ───────────────────────────────────────────── */}
              <Section title="Profile">
                <div className="flex items-center gap-4">
                  <img
                    src={user?.avatar_url ?? avatarFor(user?.email ?? "cobox")}
                    alt=""
                    className="size-14 rounded-full bg-surface-2 border border-border-strong"
                  />
                  <div className="flex-1 min-w-0">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleSaveName();
                            if (e.key === "Escape") {
                              setEditingName(false);
                              setDisplayName(user?.name ?? "");
                            }
                          }}
                          maxLength={40}
                          data-no-drag
                          data-selectable
                          className="flex-1 h-8 px-2 rounded-md bg-bg border border-brand-700/60 text-sm text-white outline-none"
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={saving}
                          data-no-drag
                          className="size-8 flex items-center justify-center rounded-md bg-cta hover:bg-cta-hover text-white disabled:opacity-40"
                        >
                          {saving ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setDisplayName(user?.name ?? "");
                          }}
                          data-no-drag
                          className="size-8 flex items-center justify-center rounded-md border border-border-strong text-text-muted hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-semibold text-sm truncate">
                          {user?.name ?? "Anonymous"}
                        </span>
                        <button
                          onClick={() => setEditingName(true)}
                          data-no-drag
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-white transition"
                          aria-label="Edit name"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-text-muted truncate mt-0.5">
                      {user?.email ?? "—"}
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">
                      Member since {memberSince}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── Account ───────────────────────────────────────────── */}
              <Section title="Account">
                <Row
                  label="Manage your account"
                  description="Change password, email, billing on the web."
                  action={
                    <IconButton
                      onClick={() =>
                        cobox.auth.openExternal("https://cobox.games/account")
                      }
                    >
                      <ExternalLink size={12} />
                    </IconButton>
                  }
                />
                <Row
                  label="Sign out"
                  description="You'll need to sign in again next time."
                  action={
                    <button
                      onClick={() => setShowSignOutConfirm(true)}
                      data-no-drag
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-danger/15 text-danger border border-danger/30 text-[11px] font-bold hover:bg-danger/25 transition"
                    >
                      <LogOut size={11} />
                      Sign out
                    </button>
                  }
                />
              </Section>

              {/* ── Application ───────────────────────────────────────── */}
              <Section title="Application">
                <Row
                  label="Version"
                  description={`Cobox Launcher ${appInfo?.version ?? "…"} · Built ${buildDate}`}
                  action={
                    <button
                      onClick={handleCheckForUpdates}
                      data-no-drag
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border-strong text-[11px] font-bold text-text-secondary hover:text-white hover:border-brand-700/60 transition"
                    >
                      <RefreshCw size={11} />
                      Check for updates
                    </button>
                  }
                />
                <Row
                  label="App data folder"
                  description="Open the folder containing your saved games and settings."
                  action={
                    <IconButton onClick={handleOpenDataFolder}>
                      <Folder size={12} />
                    </IconButton>
                  }
                />
                <Row
                  label="Clear cache"
                  description="Wipes temporary files. Your saved games and auth stay safe."
                  action={
                    <button
                      onClick={handleClearCache}
                      disabled={clearingCache}
                      data-no-drag
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border-strong text-[11px] font-bold text-text-secondary hover:text-white hover:border-brand-700/60 transition disabled:opacity-50"
                    >
                      {clearingCache ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Trash2 size={11} />
                      )}
                      Clear
                    </button>
                  }
                />
              </Section>

              {/* ── About ─────────────────────────────────────────────── */}
              <Section title="About">
                <Row
                  label="What's new"
                  description="See release notes for recent launcher updates."
                  action={
                    <button
                      onClick={() => setShowWhatsNew(true)}
                      data-no-drag
                      className="inline-flex items-center gap-1 text-[11px] text-brand-300 hover:text-white transition"
                    >
                      <FileText size={11} />
                      View
                      <ChevronRight size={11} />
                    </button>
                  }
                />
                <LinkRow
                  label="Privacy policy"
                  href="https://cobox.games/privacy"
                />
                <LinkRow
                  label="Terms of service"
                  href="https://cobox.games/terms"
                />
                <LinkRow label="Discord" href="https://discord.gg/KTMG3NxBEK" />
                <LinkRow label="Website" href="https://cobox.games" />
              </Section>
            </div>
          </motion.div>

          {/* Sign out confirmation */}
          {showSignOutConfirm && (
            <ConfirmDialog
              title="Sign out?"
              body="You'll need to sign in again next time you open Cobox."
              confirmLabel="Sign out"
              danger
              onConfirm={handleSignOut}
              onCancel={() => setShowSignOutConfirm(false)}
            />
          )}

          {/* What's new nested modal */}
          <WhatsNewModal
            open={showWhatsNew}
            onClose={() => setShowWhatsNew(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-5 border-b border-border last:border-0">
      <h3 className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  description,
  action,
}: {
  label: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{label}</div>
        {description && (
          <div className="text-[11px] text-text-muted mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <button
      onClick={() => cobox.auth.openExternal(href)}
      data-no-drag
      className="w-full flex items-center justify-between py-1 text-left hover:text-white transition text-text-secondary group"
    >
      <span className="text-[13px]">{label}</span>
      <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
    </button>
  );
}

function IconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-no-drag
      className="size-7 flex items-center justify-center rounded-md border border-border-strong text-text-secondary hover:text-white hover:border-brand-700/60 transition"
    >
      {children}
    </button>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div
        className="w-[380px] rounded-xl bg-surface-1 border border-border-strong p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-display font-bold text-base">{title}</div>
        <p className="mt-2 text-sm text-text-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-3 rounded-md border border-border-strong text-xs font-bold hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-bold transition text-white",
              danger
                ? "bg-danger hover:opacity-90"
                : "bg-cta hover:bg-cta-hover",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
