import { Button } from "@renderer/components/ui/Button";
import { useToast } from "@renderer/components/ui/Toaster";
import { cn } from "@renderer/lib/cn";
import {
  checkUsernameAvailability,
  reasonToMessage,
  setMyUsername,
  validateUsername,
} from "@renderer/lib/username-api";
import {
  AtSign,
  Check,
  Globe,
  Loader2,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  UnavailableReason,
  UsernameAvailabilityResponse,
} from "../../../shared/types/username";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a username is successfully set. Parent should refresh identity state. */
  onSuccess?: (username: string) => void;
  /** Allow user to dismiss without picking. Defaults to true. */
  dismissable?: boolean;
}

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "local-invalid"; reason: UnavailableReason }
  | { kind: "available"; username: string }
  | { kind: "unavailable"; reason: UnavailableReason; suggestions?: string[] };

const DEBOUNCE_MS = 300;

export function UsernamePickerModal({
  open,
  onClose,
  onSuccess,
  dismissable = true,
}: Props) {
  const { push: toast } = useToast();
  const [value, setValue] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  // Tracks the latest in-flight check so stale responses are ignored.
  const checkSeqRef = useRef(0);

  // Reset state when re-opened
  useEffect(() => {
    if (open) {
      setValue("");
      setCheckState({ kind: "idle" });
      setSubmitError(null);
      setSubmitting(false);
      // Focus shortly after open animation
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape (only if dismissable)
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  // Debounced availability check
  useEffect(() => {
    if (!open) return;
    const trimmed = value.trim().toLowerCase();

    // Empty → idle (no error message yet)
    if (trimmed.length === 0) {
      setCheckState({ kind: "idle" });
      return;
    }

    // Local validation first — saves bandwidth and rate-limit budget
    const local = validateUsername(trimmed);
    if (!local.valid && local.reason) {
      setCheckState({ kind: "local-invalid", reason: local.reason });
      return;
    }

    // Local valid → debounce, then hit network
    setCheckState({ kind: "checking" });
    const seq = ++checkSeqRef.current;
    const timer = setTimeout(async () => {
      const result: UsernameAvailabilityResponse | null =
        await checkUsernameAvailability(trimmed);

      // Ignore stale responses (user kept typing)
      if (seq !== checkSeqRef.current) return;

      if (!result) {
        // Network error — fall back to "looks valid locally" without
        // claiming availability we can't verify.
        setCheckState({ kind: "idle" });
        return;
      }

      if (result.available) {
        setCheckState({ kind: "available", username: result.username });
      } else {
        setCheckState({
          kind: "unavailable",
          reason: result.reason ?? "taken",
          suggestions: result.suggestions,
        });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, open]);

  const canSubmit = useMemo(
    () => checkState.kind === "available" && !submitting,
    [checkState, submitting],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const trimmed = value.trim().toLowerCase();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await setMyUsername(trimmed);
      toast({
        kind: "success",
        title: "Username set",
        body: `You're now @${res.username}`,
      });
      onSuccess?.(res.username);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't set username";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setValue(suggestion);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-6"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(12px)",
          }}
          onClick={dismissable ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[480px] rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(48, 8, 96, 0.55) 0%, rgba(15, 1, 22, 0.95) 100%)",
              border: "1px solid rgba(81, 17, 157, 0.4)",
              boxShadow:
                "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
            }}
          >
            {/* Close button (top-right) */}
            {dismissable && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            )}

            <div className="p-7">
              {/* Header */}
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(81, 17, 157, 0.35)" }}
                >
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="pt-0.5">
                  <h2 className="text-white text-lg font-bold tracking-tight">
                    Pick your username
                  </h2>
                  <p className="text-brand-300 text-xs mt-0.5">
                    One last step before you create
                  </p>
                </div>
              </div>

              {/* Guide / value prop */}
              <div className="space-y-2.5 mb-6">
                <GuideRow
                  icon={<Globe size={14} />}
                  text="This becomes your profile URL — username.cobox.games"
                />
                <GuideRow
                  icon={<AtSign size={14} />}
                  text="Players and creators will find you with @username"
                />
                <GuideRow
                  icon={<Pencil size={14} />}
                  text="You can change it any time before minting your Identity NFT"
                />
              </div>

              {/* Input */}
              <div className="mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-brand-300 mb-2">
                  Username
                </label>
                <div
                  className={cn(
                    "relative flex items-center rounded-xl transition-colors",
                    "bg-black/30 border",
                    inputBorderClass(checkState),
                  )}
                >
                  <span className="pl-4 pr-1 text-brand-300 select-none text-sm">
                    @
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setValue(
                        // Normalise: lowercase, strip spaces, cap at 20
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "")
                          .slice(0, 20),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) {
                        e.preventDefault();
                        void handleSubmit();
                      }
                    }}
                    placeholder="e.g. alice_2024"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="flex-1 bg-transparent py-3 pr-3 text-white text-sm outline-none placeholder:text-brand-300/50"
                  />
                  <div className="pr-4">
                    <StatusIcon state={checkState} />
                  </div>
                </div>

                {/* Status / hint line */}
                <div className="min-h-[18px] mt-2 text-xs">
                  <StatusLine state={checkState} username={value.trim()} />
                </div>
              </div>

              {/* Suggestions */}
              {checkState.kind === "unavailable" &&
                checkState.suggestions &&
                checkState.suggestions.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-300 mb-2">
                      Try one of these
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {checkState.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestion(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors"
                        >
                          @{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Submit error */}
              {submitError && (
                <div className="mb-4 px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-300">
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="cta"
                  size="md"
                  loading={submitting}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  Claim username
                </Button>
                {dismissable && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function GuideRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-brand-300 bg-white/5 mt-0.5">
        {icon}
      </div>
      <p className="text-[12.5px] leading-relaxed text-white/80">{text}</p>
    </div>
  );
}

function StatusIcon({ state }: { state: CheckState }) {
  if (state.kind === "checking")
    return <Loader2 size={16} className="text-brand-300 animate-spin" />;
  if (state.kind === "available")
    return <Check size={16} className="text-emerald-400" />;
  if (state.kind === "unavailable" || state.kind === "local-invalid")
    return <X size={16} className="text-red-400" />;
  return null;
}

function StatusLine({
  state,
  username,
}: {
  state: CheckState;
  username: string;
}) {
  if (state.kind === "idle")
    return (
      <span className="text-brand-300/60">
        3–20 characters, lowercase letters, numbers, underscore
      </span>
    );
  if (state.kind === "checking")
    return <span className="text-brand-300">Checking availability…</span>;
  if (state.kind === "local-invalid")
    return (
      <span className="text-red-300">{reasonToMessage(state.reason)}</span>
    );
  if (state.kind === "available")
    return (
      <span className="text-emerald-400">
        @{username} is available — you can claim it
      </span>
    );
  // unavailable
  return <span className="text-red-300">{reasonToMessage(state.reason)}</span>;
}

function inputBorderClass(state: CheckState): string {
  switch (state.kind) {
    case "available":
      return "border-emerald-500/40 focus-within:border-emerald-500/60";
    case "unavailable":
    case "local-invalid":
      return "border-red-500/40 focus-within:border-red-500/60";
    case "checking":
      return "border-brand-700/50 focus-within:border-brand-700/70";
    default:
      return "border-white/10 focus-within:border-brand-700/60";
  }
}
