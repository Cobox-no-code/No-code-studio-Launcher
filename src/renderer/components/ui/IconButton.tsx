import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@renderer/lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  badge?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, badge, ...rest }, ref) => (
    <button
      ref={ref}
      data-no-drag
      className={cn(
        "relative inline-flex items-center justify-center size-10 rounded-full text-text-secondary hover:text-white hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cta/60",
        className,
      )}
      {...rest}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-cta text-[10px] font-bold text-white flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  ),
);
IconButton.displayName = "IconButton";
