import { cn } from "@renderer/lib/cn";
import { useMode } from "@renderer/stores/mode.store";
import { useNavigate } from "@tanstack/react-router";
/**
 * Two-position icon toggle:
 *  - Pill (purple) is static — icons are "cutouts" showing the sidebar bg
 *  - A knob slides between the two icons
 *  - The icon under the knob is "selected"
 *
 * Icons are the same color as the sidebar background so they read as cutouts.
 */
export function ModeToggle({ className }: { className?: string }) {
  const [mode, , toggle] = useMode();
  const isCreator = mode === "creator";
  const navigate = useNavigate();
  // Sidebar bg is bg-gradient #1A0020 → #0F0116 — pick #0F0116 (bottom) for the icon color
  // since the toggle sits near the bottom of the sidebar.
  const cutoutColor = "#0F0116";
  const handleToggle = () => {
    toggle();
    // After mode flips, send them to Home — other routes may not exist in the new mode
    navigate({ to: "/home" });
  };

  return (
    <button
      onClick={handleToggle}
      data-no-drag
      aria-label={`Switch to ${isCreator ? "player" : "creator"} mode`}
      title={`Mode: ${isCreator ? "Creator" : "Player"} — click to switch`}
      className={cn(
        "relative inline-flex items-center justify-center outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-700 rounded-full",
        "transition-opacity hover:opacity-90",
        className,
      )}
    >
      <svg
        width="53"
        height="27"
        viewBox="0 0 53 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Static pill background */}
        <path
          d="M13.0781 0H39.3281C56.7656 0.5625 56.7656 25.6875 39.3281 26.25H13.0781C-4.35938 25.6875 -4.35938 0.5625 13.0781 0Z"
          fill="#51119D"
        />

        {/* Knob — slides between creator (left) and player (right)
            Sits UNDER the icons so the icon cutouts punch through it. */}
        <circle
          cx={isCreator ? 13 : 40}
          cy={13.125}
          r={7}
          fill="black"
          style={{ transition: "cx 220ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Creator icon — vertical bar cutout on the left */}
        <path
          d="M24.3281 18.75C24.3281 19.875 25.0781 20.625 26.2031 20.625C27.3281 20.625 28.0781 19.875 28.0781 18.75V7.5C28.0781 6.375 27.3281 5.625 26.2031 5.625C25.0781 5.625 24.3281 6.375 24.3281 7.5V18.75Z"
          fill={cutoutColor}
        />
      </svg>
    </button>
  );
}
