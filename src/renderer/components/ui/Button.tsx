import { cn } from "@renderer/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "cta" | "brand" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  cta: "bg-cta hover:bg-cta-hover active:bg-cta-press text-white shadow-[var(--shadow-cta)] disabled:opacity-50",
  brand:
    "bg-brand-700 hover:bg-brand-500 active:bg-brand-900 text-white disabled:opacity-50",
  outline:
    "border border-border-strong bg-transparent text-text hover:bg-white/5 disabled:opacity-40",
  ghost: "bg-transparent text-text hover:bg-white/5 disabled:opacity-40",
  danger: "bg-danger hover:opacity-90 text-white disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-5 text-sm rounded-pill",
  lg: "h-12 px-7 text-base rounded-pill",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "cta",
      size = "md",
      loading,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      data-no-drag
      className={cn(
        "inline-flex items-center justify-center gap-2 font-sans font-bold tracking-wide transition-all outline-none focus-visible:ring-2 focus-visible:ring-cta/60 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="animate-pulse">…</span> : children}
    </button>
  ),
);
Button.displayName = "Button";
