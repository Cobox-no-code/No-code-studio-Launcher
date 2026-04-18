import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@renderer/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-500/50",
  secondary:
    "bg-surface-100 text-surface-900 hover:bg-surface-200 disabled:text-surface-900/40",
  ghost:
    "bg-transparent text-surface-900 hover:bg-surface-100 disabled:text-surface-900/40",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-500/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
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
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors outline-none focus-visible:ring-2 ring-brand-500 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      data-no-drag
      {...rest}
    >
      {loading ? <span className="animate-pulse">…</span> : children}
    </button>
  ),
);
Button.displayName = "Button";
