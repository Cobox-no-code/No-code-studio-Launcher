import { ModeToggle } from "@renderer/components/ui/ModeToggle";
import { cn } from "@renderer/lib/cn";
import { useMode } from "@renderer/stores/mode.store";
import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";

type NavItem = { label: string; to: string };

const CREATOR_ACTIONS: NavItem[] = [
  { label: "CREATE WORLD", to: "/create-world" },
  { label: "CREATE GAME", to: "/create-game" },
];

// HOME removed from creator mode per request
const CREATOR_NAV: NavItem[] = [
  { label: "HOME", to: "/home" },
  { label: "SAVED", to: "/saved" },
  { label: "PUBLISHED", to: "/published" },
];

// Player mode keeps HOME
const PLAYER_NAV: NavItem[] = [
  { label: "HOME", to: "/home" },
  { label: "LIBRARY", to: "/library" },
  { label: "STORE", to: "/store" },
];

/**
 * Active-pill style matching Figma:
 *  - Linear gradient fill from #300860 → #000000
 *  - 76% opacity
 *  - 7px corner radius
 *  - Vertical accent bar on the left (#51119D)
 */
const activePillClasses = cn("relative text-white", "");

const activePillStyle: React.CSSProperties = {
  backgroundColor: "rgba(81, 17, 157, 0.45)",
  borderRadius: 7,
};
export function Sidebar() {
  const [mode] = useMode();
  const location = useLocation();

  const actions = mode === "creator" ? CREATOR_ACTIONS : [];
  const nav = mode === "creator" ? CREATOR_NAV : PLAYER_NAV;

  // Track which creator action is "active" locally (they're buttons, not routes yet)
  const [activeAction, setActiveAction] = useState<string | null>(null);

  return (
    <aside className="w-[200px] shrink-0 flex flex-col justify-between py-6">
      {/* Top: action buttons (creator only) */}
      <nav className="pl-3 flex flex-col gap-1">
        {actions.map((item) => {
          const active = location.pathname === item.to;
          return (
            <div className="flex  items-center">
              <Link
                key={item.label}
                to={item.to}
                data-no-drag
                style={active ? activePillStyle : undefined}
                className={cn(
                  "block px-5 py-3 text-[11px] tracking-[0.1em] font-bold w-full transition-all rounded-md",
                  active
                    ? activePillClasses
                    : "text-brand-300 hover:text-white",
                )}
              >
                {item.label}
              </Link>
              <span
                className={cn(
                  active
                    ? " w-1 h-[1.25rem] justify-center flex items-center bg-brand-700 ml-4 rounded-sm"
                    : " ",
                )}
              ></span>
            </div>
          );
        })}
      </nav>

      {/* Bottom: navigation + mode toggle */}
      <nav className="pl-3 flex flex-col gap-1">
        {nav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <div className="flex justify-center items-center">
              <Link
                key={item.label}
                to={item.to}
                data-no-drag
                style={active ? activePillStyle : undefined}
                className={cn(
                  "block px-5 py-3 text-[11px] tracking-[0.1em] font-bold w-full transition-all rounded-md",
                  active
                    ? activePillClasses
                    : "text-brand-300 hover:text-white",
                )}
              >
                {item.label}
              </Link>
              <span
                className={cn(
                  active
                    ? " w-1 h-[1.25rem] justify-center flex items-center bg-brand-700 ml-4 rounded-sm"
                    : " ",
                )}
              ></span>
            </div>
          );
        })}

        <div className="pt-8 pl-4">
          <ModeToggle />
        </div>
      </nav>
    </aside>
  );
}
