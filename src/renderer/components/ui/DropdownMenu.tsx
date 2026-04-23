import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";
import { cn } from "@renderer/lib/cn";

// ─────────────────────────────────────────────────────────────────────────────
// Context — so trigger + content can talk to each other without prop drilling
// ─────────────────────────────────────────────────────────────────────────────
interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const Ctx = createContext<DropdownCtx | null>(null);

function useDropdown() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("Dropdown components must be used inside DropdownRoot");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — provides open state + refs
// ─────────────────────────────────────────────────────────────────────────────
export function DropdownRoot({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    // Capture phase so menu closes before other click handlers fire
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <Ctx.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </Ctx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger — button that toggles open state
// ─────────────────────────────────────────────────────────────────────────────
export function DropdownTrigger({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, triggerRef } = useDropdown();

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      data-no-drag
      className={cn("outline-none", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content — the floating menu panel
// ─────────────────────────────────────────────────────────────────────────────
type Align = "start" | "end";

interface ContentProps {
  children: ReactNode;
  className?: string;
  align?: Align;
  sideOffset?: number;
}

export function DropdownContent({
  children,
  className,
  align = "start",
  sideOffset = 6,
}: ContentProps) {
  const { open, contentRef } = useDropdown();
  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      style={{ marginTop: sideOffset }}
      className={cn(
        "absolute top-full z-50 min-w-[200px] rounded-lg border border-border-strong bg-surface-1 shadow-lg p-1.5",
        "animate-[dropdownIn_120ms_ease-out]",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item — clickable row inside the menu
// ─────────────────────────────────────────────────────────────────────────────
interface ItemProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export function DropdownItem({
  children,
  active,
  className,
  onSelect,
  disabled,
}: ItemProps) {
  const { setOpen } = useDropdown();

  const handleClick = useCallback(() => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  }, [disabled, onSelect, setOpen]);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
      data-no-drag
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md outline-none text-left",
        "text-text-secondary hover:bg-brand-700/30 hover:text-white focus:bg-brand-700/30 focus:text-white",
        active && "bg-brand-700/20 text-white",
        disabled &&
          "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-text-secondary",
        className,
      )}
    >
      <span className="flex-1 truncate">{children}</span>
      {active && <Check size={12} className="shrink-0" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label + Separator — static visual elements
// ─────────────────────────────────────────────────────────────────────────────
export function DropdownLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-[9px] tracking-[0.15em] text-text-muted uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownSeparator() {
  return <div className="h-px bg-border my-1 mx-2" />;
}
