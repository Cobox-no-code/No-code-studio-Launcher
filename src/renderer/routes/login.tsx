import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LogIn, ExternalLink, X } from "lucide-react";

import { useAuthState } from "@renderer/hooks/useAuthState";
import { cobox } from "@renderer/lib/electron";
import { Button } from "@renderer/components/ui/Button";
import { Spinner } from "@renderer/components/ui/Spinner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

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

  const cancel = () => cobox.auth.cancelLogin();

  const isAwaiting = auth?.status === "awaiting-browser";

  return (
    <div className="h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-[380px] bg-surface-0 border border-surface-200 rounded-xl shadow-sm p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-surface-900/60">
            Sign in through your browser to continue.
          </p>
        </div>

        {!isAwaiting ? (
          <Button
            size="lg"
            onClick={signIn}
            loading={starting}
            className="w-full"
          >
            <LogIn size={16} />
            Sign in with Cobox
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-brand-50 border border-brand-100 text-brand-700">
              <Spinner size={18} />
              <div className="flex-1 text-sm">
                <div className="font-medium">Waiting for browser…</div>
                <div className="flex items-center gap-1 text-xs text-brand-700/70">
                  <ExternalLink size={12} />
                  Complete sign-in in your browser
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={cancel} className="w-full">
              <X size={14} />
              Cancel
            </Button>
          </div>
        )}

        {auth?.status === "error" && auth.error && (
          <div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {auth.error}
          </div>
        )}
      </motion.div>
    </div>
  );
}
