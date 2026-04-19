import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@renderer/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, ...rest }, ref) => (
    <div
      className={cn(
        "relative w-full h-12 rounded-pill bg-white/[0.04] border border-border-strong",
        "focus-within:border-cta/60 focus-within:bg-white/[0.06] transition-colors",
        className,
      )}
    >
      {leftIcon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        data-no-drag
        className={cn(
          "w-full h-full bg-transparent outline-none text-sm text-white placeholder:text-text-muted",
          leftIcon ? "pl-12" : "pl-5",
          rightIcon ? "pr-12" : "pr-5",
        )}
        {...rest}
      />
      {rightIcon && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
          {rightIcon}
        </span>
      )}
    </div>
  ),
);
Input.displayName = "Input";
