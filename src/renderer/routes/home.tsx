import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { CreatorHome } from "@renderer/components/home/CreatorHome";
import { PlayerHome } from "@renderer/components/home/PlayerHome";
import { AuthedShell } from "@renderer/components/layout/AuthedShell";
import { UsernamePickerModal } from "@renderer/components/username/UsernamePickerModal";
import { useAuthState } from "@renderer/hooks/useAuthState";
import { cobox } from "@renderer/lib/electron";
import { getMyIdentity } from "@renderer/lib/username-api";
import { useMode } from "@renderer/stores/mode.store";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

const DISMISS_KEY = "cobox:username-prompt-dismissed";

// Build marker — confirms this file is loaded. If you don't see this on
// hard reload, the file is stale (replace + Cmd+Shift+R).
console.log("[home] *** home.tsx loaded — build marker v4 ***");

function HomePage() {
  const auth = useAuthState();
  const [mode] = useMode();
  const navigate = useNavigate();

  const [pickerOpen, setPickerOpen] = useState(false);
  const identityCheckedRef = useRef(false);

  // Pull stable primitives out so effects don't re-fire on every 1s
  // auth poll (useAuthState returns a NEW object every poll tick).
  const status = auth?.status;
  const userId = auth?.user?.id ?? null;

  // Sign-out redirect — depend on `status`, not on `auth` (new object every 1s).
  useEffect(() => {
    if (status === "signed-out") navigate({ to: "/login" });
  }, [status, navigate]);

  // Window-global debug helpers — call from DevTools console:
  //   window.__openUsernamePicker()    forces the modal open
  //   window.__closeUsernamePicker()   forces it closed
  // Useful for verifying the modal component itself works without going
  // through the identity-check flow.
  useEffect(() => {
    type DebugWindow = {
      __openUsernamePicker?: () => void;
      __closeUsernamePicker?: () => void;
    };
    const w = window as unknown as DebugWindow;
    w.__openUsernamePicker = () => {
      console.log("[home] __openUsernamePicker() called from console");
      setPickerOpen(true);
    };
    w.__closeUsernamePicker = () => {
      console.log("[home] __closeUsernamePicker() called from console");
      setPickerOpen(false);
    };
    return () => {
      delete w.__openUsernamePicker;
      delete w.__closeUsernamePicker;
    };
  }, []);

  // Identity check — runs once after sign-in lands the user on /home.
  useEffect(() => {
    if (status !== "signed-in") {
      console.log("[home] identity-check waiting — auth.status =", status);
      return;
    }
    if (!userId) {
      console.log(
        "[home] identity-check waiting — auth.status is signed-in but user.id is null",
      );
      return;
    }
    if (identityCheckedRef.current) return;
    identityCheckedRef.current = true;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* sessionStorage unavailable */
    }
    if (dismissed) {
      console.log(
        "[home] identity-check skipped — dismiss flag set this session " +
          `(clear with: sessionStorage.removeItem("${DISMISS_KEY}"))`,
      );
      return;
    }

    let cancelled = false;
    void (async () => {
      console.log("[home] running identity check…");
      const identity = await getMyIdentity();
      if (cancelled) {
        console.log("[home] identity result discarded — effect was cancelled");
        return;
      }

      if (identity) {
        if (identity.username === null && identity.canChangeUsername) {
          console.log("[home] no username — opening picker");
          setPickerOpen(true);
        } else {
          console.log(
            "[home] modal will NOT open. username=",
            identity.username,
            "canChangeUsername=",
            identity.canChangeUsername,
            "identityStatus=",
            identity.identityStatus,
          );
        }
        return;
      }

      // identity === null. Distinguish "corrupt auth state" (no JWT despite
      // signed-in status) from "transient backend issue" (JWT exists, fetch failed).
      console.log("[home] identity check returned null — diagnosing reason…");
      const token = await cobox.auth.getToken();
      if (cancelled) return;

      if (token) {
        console.log(
          "[home] token IS present — treating as transient backend issue, skipping modal",
        );
        return;
      }

      console.warn(
        "[home] CORRUPT AUTH STATE detected: status=signed-in but no JWT. " +
          "Attempting token refresh…",
      );
      const refreshed = await cobox.auth.refresh();
      if (cancelled) return;

      if (refreshed.success) {
        console.log("[home] refresh OK — retrying identity check");
        const retry = await getMyIdentity();
        if (cancelled) return;
        if (retry && retry.username === null && retry.canChangeUsername) {
          setPickerOpen(true);
        }
        return;
      }

      console.warn("[home] refresh FAILED — forcing logout");
      await cobox.auth.logout();
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const handlePickerClose = useCallback(() => {
    console.log("[home] handlePickerClose called");
    setPickerOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* best-effort */
    }
  }, []);

  const handlePickerSuccess = useCallback(() => {
    console.log("[home] handlePickerSuccess called");
    setPickerOpen(false);
    try {
      sessionStorage.removeItem(DISMISS_KEY);
    } catch {
      /* best-effort */
    }
  }, []);

  if (status !== "signed-in") return null;

  return (
    <AuthedShell>
      {mode === "creator" ? <CreatorHome /> : <PlayerHome />}
      <UsernamePickerModal
        open={pickerOpen}
        onClose={handlePickerClose}
        onSuccess={handlePickerSuccess}
      />
    </AuthedShell>
  );
}
