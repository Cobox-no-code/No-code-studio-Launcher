import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  Mail,
  Package,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { CreatorHomeScene } from "@renderer/components/home/CreatorHomeScene";
import { SceneBoundary } from "@renderer/components/home/SceneBoundary";
import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { useToast } from "@renderer/components/ui/Toaster";
import { useAuthState } from "@renderer/hooks/useAuthState";

export const Route = createFileRoute("/store")({
  component: StorePage,
});

function StorePage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const { push: toast } = useToast();

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (auth?.status === "signed-out") navigate({ to: "/login" });
  }, [auth?.status, navigate]);

  useEffect(() => {
    // Pre-fill with signed-in user's email
    if (auth?.user?.email) setEmail(auth.user.email);
  }, [auth?.user?.email]);

  if (auth?.status !== "signed-in") return null;

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast({ kind: "error", title: "Please enter a valid email" });
      return;
    }
    setSubscribing(true);
    // TODO: wire to backend when available:
    // await cobox.store.subscribeNotify({ email: trimmed });
    await new Promise((r) => setTimeout(r, 600));
    setSubscribing(false);
    setSubscribed(true);
    toast({
      kind: "success",
      title: "You're on the list",
      body: "We'll email you when the store opens.",
    });
  };

  return (
    <AuthedShell>
      <div className="relative h-full overflow-hidden">
        {/* 3D backdrop reused */}
        <SceneBoundary>
          <CreatorHomeScene />
        </SceneBoundary>

        {/* Left-side darkening gradient for readability */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background:
              "linear-gradient(90deg, rgba(15,1,22,0.85) 0%, rgba(15,1,22,0.5) 50%, transparent 100%)",
          }}
        />

        <div
          className="relative z-10 overflow-auto h-full py-5git status
git branch --show-current"
        >
          <div className="max-w-4xl px-10  flex flex-col items-start">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 mt-8 rounded-full border border-brand-700/40 bg-brand-700/15 backdrop-blur-sm text-[10px] tracking-[0.2em] text-brand-300 font-bold"
            >
              <Sparkles size={10} /> COMING SOON
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="font-display font-black text-5xl leading-[0.95] tracking-tight mt-5"
            >
              THE COBOX
              <br />
              <span className="bg-gradient-to-r from-white via-brand-300 to-brand-500 bg-clip-text text-transparent">
                STORE
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mt-5 text-sm text-text-secondary leading-relaxed max-w-xl"
            >
              A marketplace for creator assets, avatars, worlds, and in-game
              items — built for the Cobox ecosystem. We're putting the finishing
              touches on it now.
            </motion.p>

            {/* Feature teasers */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl"
            >
              <FeatureCard
                icon={<Package size={18} />}
                title="Asset Packs"
                body="3D models, avatars, environments, and animations from top creators."
              />
              <FeatureCard
                icon={<Zap size={18} />}
                title="One-click Install"
                body="Purchased items land directly in your worlds and games."
              />
              <FeatureCard
                icon={<ShoppingBag size={18} />}
                title="Creator Earnings"
                body="Sell your own assets and earn when the community uses them."
              />
            </motion.div>

            {/* Notify form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-10 w-full max-w-md"
            >
              {subscribed ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-success/10 border border-success/30 text-sm">
                  <Bell size={14} className="text-success" />
                  <span className="text-success font-semibold">
                    You're on the list.
                  </span>
                  <span className="text-text-secondary text-xs">
                    We'll email you the moment it opens.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleNotify} className="space-y-2">
                  <label className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase">
                    Get notified when it's live
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        data-no-drag
                        data-selectable
                        className="w-full h-10 pl-9 pr-3 rounded-md bg-white/5 border border-white/10 focus:border-brand-700/60 focus:bg-white/8 text-sm text-white placeholder:text-text-muted outline-none transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={subscribing}
                      data-no-drag
                      className="h-10 px-5 rounded-md bg-cta hover:bg-cta-hover text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 transition"
                    >
                      {subscribing ? "Submitting…" : "Notify me"}
                      {!subscribing && <ArrowRight size={12} />}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>

            {/* Meanwhile CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-14 pt-8 border-t border-border w-full max-w-3xl"
            >
              <div className="text-[10px] font-bold tracking-[0.2em] text-text-muted uppercase mb-3">
                In the meantime
              </div>
              <div className="flex flex-wrap gap-2">
                <QuickLink
                  label="Browse games"
                  onClick={() => navigate({ to: "/home" })}
                />
                <QuickLink
                  label="Create a world"
                  onClick={() => navigate({ to: "/create-world" })}
                />
                <QuickLink
                  label="Publish your game"
                  onClick={() => navigate({ to: "/saved" })}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthedShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="p-4 rounded-lg bg-surface-1/60 backdrop-blur-sm border border-border hover:border-brand-700/40 transition"
    >
      <div className="size-8 rounded-md bg-brand-700/20 text-brand-300 flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="font-display font-bold text-sm mb-1">{title}</div>
      <p className="text-[11px] text-text-muted leading-relaxed">{body}</p>
    </motion.div>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-no-drag
      className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-700/40 text-xs font-semibold text-text-secondary hover:text-white transition"
    >
      {label}
      <ArrowRight size={11} />
    </button>
  );
}
