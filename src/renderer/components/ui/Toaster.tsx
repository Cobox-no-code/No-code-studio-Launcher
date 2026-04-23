import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@renderer/lib/cn";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

interface ToasterCtx {
  push: (t: Omit<Toast, "id">) => void;
}

const Ctx = createContext<ToasterCtx | null>(null);

let idCounter = 0;

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 16, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto min-w-[280px] max-w-[380px] rounded-lg border backdrop-blur-lg shadow-lg",
                "p-4 flex items-start gap-3",
                t.kind === "success" &&
                  "border-success/40 bg-success/10 text-success",
                t.kind === "error" &&
                  "border-danger/40 bg-danger/10 text-danger",
                t.kind === "info" &&
                  "border-border-strong bg-surface-2/90 text-text-secondary",
              )}
            >
              {t.kind === "success" && (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              )}
              {t.kind === "error" && (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              )}
              {t.kind === "info" && (
                <Info size={18} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">
                  {t.title}
                </div>
                {t.body && (
                  <div className="text-xs mt-0.5 opacity-90">{t.body}</div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition text-white"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside <ToasterProvider>");
  return ctx;
}
