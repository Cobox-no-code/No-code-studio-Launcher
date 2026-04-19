import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, LogIn, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@renderer/components/ui/Button";
import { Spinner } from "@renderer/components/ui/Spinner";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cobox } from "@renderer/lib/electron";

import logoSrc from "@renderer/assets/images/logo.png";
export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuthState();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  // useEffect(() => {
  //   if (auth?.status === "signed-in") navigate({ to: "/home" });
  // }, [auth, navigate]);

  const signIn = async () => {
    setStarting(true);
    await cobox.auth.startLogin();
    setStarting(false);
  };

  const isAwaiting = auth?.status === "awaiting-browser";

  return (
    <div className="h-screen bg-login-gradient flex flex-col items-center justify-center gap-8">
      {/* Logo block — approximate "NO CODE STUDIO" mark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="size-20 flex items-center justify-center "
      >
        <img src={logoSrc} alt="Cobox Logo" className=" scale-125" />
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
              size="lg"
              className="w-full"
              onClick={signIn}
              loading={starting}
            >
              <LogIn size={16} />
              Sign in with Cobox
            </Button>

            <div className="text-xs text-text-muted text-center">
              To become a creative wizard{" "}
              <span className="underline text-text">Sign Up</span>
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
export default LoginPage;
