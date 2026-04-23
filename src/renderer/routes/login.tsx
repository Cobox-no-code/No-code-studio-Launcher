import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, LogIn, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { Button } from "@renderer/components/ui/Button";
import { Spinner } from "@renderer/components/ui/Spinner";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cobox } from "@renderer/lib/electron";

import logoSrc from "@renderer/assets/images/logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

// External provider logos. Each opens Cobox sign-in in the browser with
// the corresponding provider pre-selected via query param.
const PROVIDERS = [
  {
    id: "google",
    label: "Google",
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  },
  {
    id: "metamask",
    label: "MetaMask",
    src: "https://images.ctfassets.net/clixtyxoaeas/4rnpEzy1ATWRKVBOLxZ1Fm/a74dc1eed36d23d7ea6030383a4d5163/MetaMask-icon-fox.svg",
  },
  {
    id: "coinbase",
    label: "Coinbase Wallet",
    src: "https://static-assets.coinbase.com/ui-infra/illustration/v1/pictogram/svg/light/coinbaseLogoNavigation-4.svg",
  },
  {
    id: "walletconnect",
    label: "WalletConnect",
    src: "https://raw.githubusercontent.com/gist/taycaldwell/e2d3815f5ac0ad07fe06f2d580ba7762/raw/0a33978dc1f66b681865056c6d25bc3d5ffcb1e9/wc.svg",
  },
  {
    id: "brave",
    label: "Brave Wallet",
    src: "https://brave.com/static-assets/images/brave-logo-sans-text.svg",
  },
  {
    id: "trustwallet",
    label: "Trust Wallet",
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjTrKgy8TJ9muJphpzXZAGb-TTs5c2igXR6Q&s",
  },
];

function LoginPage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (auth?.status === "signed-in") navigate({ to: "/home" });
  }, [auth, navigate]);

  const signIn = async () => {
    setStarting(true);
    await cobox.auth.startLogin();
    setStarting(false);
  };

  const isAwaiting = auth?.status === "awaiting-browser";

  return (
    <div className="h-screen bg-login-gradient flex flex-col items-center justify-center gap-8">
      {/* Logo block */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="size-20 flex items-center justify-center"
      >
        <img src={logoSrc} alt="Cobox Logo" className="scale-125" />
      </motion.div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-[480px] rounded-xl bg-[#1A0632]/80 backdrop-blur-xl border border-border-strong p-10 flex flex-col items-center gap-6 shadow-lg"
      >
        {!isAwaiting ? (
          <>
            <div className="text-center space-y-1">
              <h1 className="font-display font-bold text-2xl">Welcome back</h1>
              <p className="text-sm text-text-muted">
                Sign in with your Cobox account
              </p>
            </div>

            <Button
              size="md"
              className="w-full rounded-md!"
              onClick={signIn}
              loading={starting}
            >
              <LogIn size={16} />
              Sign in with Cobox
            </Button>

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-text-muted tracking-[0.2em] font-bold">
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* ── Provider icons ──────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-3 w-full flex-wrap">
              {PROVIDERS.map((p) => (
                <ProviderButton
                  key={p.id}
                  src={p.src}
                  label={p.label}
                  disabled={starting}
                  onClick={() => signIn()}
                />
              ))}
            </div>

            <div className="text-xs text-text-muted text-center">
              To become a creative wizard{" "}
              <button
                onClick={() =>
                  cobox.auth.openExternal("https://cobox.games/signup")
                }
                data-no-drag
                className="underline text-text hover:text-white transition"
              >
                Sign Up
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 w-full p-4 rounded-lg bg-cta/10 border border-cta/30 text-white">
              <Spinner size={18} />
              <div className="flex-1 text-sm">
                <div className="font-semibold">Waiting for browser…</div>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <ExternalLink size={12} />
                  Complete sign-in in your browser
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => cobox.auth.cancelLogin()}
              className="w-full"
            >
              <X size={14} />
              Cancel
            </Button>
          </>
        )}

        {auth?.status === "error" && auth.error && (
          <div className="w-full text-xs text-danger border border-danger/30 bg-danger/10 rounded-md p-3">
            {auth.error}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProviderButton — square icon tile that pops on hover
// ─────────────────────────────────────────────────────────────────────────────
function ProviderButton({
  src,
  label,
  disabled,
  onClick,
}: {
  src: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      data-no-drag
      onClick={onClick}
      disabled={disabled}
      aria-label={`Sign in with ${label}`}
      title={`Sign in with ${label}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="
        group relative size-11 rounded-lg
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-brand-700/60
        transition-colors
        flex items-center justify-center
        disabled:opacity-40 disabled:pointer-events-none
      "
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="size-6 object-contain pointer-events-none"
        onError={(e) => {
          // Fall back to text if icon fails to load (offline / blocked)
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      {/* Tiny tooltip on hover */}
      <span
        className="
          absolute -bottom-7 left-1/2 -translate-x-1/2
          px-1.5 py-0.5 rounded
          bg-black/80 border border-border-strong
          text-[9px] text-text-secondary font-bold tracking-wider uppercase
          opacity-0 group-hover:opacity-100 transition-opacity
          whitespace-nowrap pointer-events-none
        "
      >
        {label}
      </span>
    </motion.button>
  );
}

export default LoginPage;
