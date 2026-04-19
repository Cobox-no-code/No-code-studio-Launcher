import { ModeToggle } from "@renderer/components/ui/ModeToggle";
import { cn } from "@renderer/lib/cn";
import { useMode } from "@renderer/stores/mode.store";
import { Link, useLocation } from "@tanstack/react-router";

type NavItem = { label: string; to: string };

const CREATOR_ACTIONS: NavItem[] = [
  { label: "CREATE WORLD", to: "/home" },
  { label: "CREATE GAME", to: "/home" },
];

const CREATOR_NAV: NavItem[] = [
  { label: "HOME", to: "/home" },
  { label: "SAVED", to: "/saved" },
  { label: "PUBLISHED", to: "/published" },
];

const PLAYER_NAV: NavItem[] = [
  { label: "HOME", to: "/home" },
  { label: "LIBRARY", to: "/library" },
  { label: "STORE", to: "/store" },
];

export function Sidebar() {
  const [mode] = useMode();
  const location = useLocation();

  const actions = mode === "creator" ? CREATOR_ACTIONS : [];
  const nav = mode === "creator" ? CREATOR_NAV : PLAYER_NAV;

  return (
    <aside className="w-[200px] shrink-0 flex flex-col justify-between py-6 ">
      <nav className="px-4 flex flex-col gap-1">
        {actions.map((item) => (
          <button
            key={item.label}
            className="text-left px-4 py-3 text-xs tracking-[0.08em] font-bold text-brand-300 hover:text-white transition-colors"
            data-no-drag
          >
            {item.label}
          </button>
        ))}
      </nav>

      <nav className="px-4 flex flex-col gap-1">
        {nav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              data-no-drag
              className={cn(
                "block px-4 py-3 text-xs tracking-[0.08em] font-bold rounded-md transition-all",
                active
                  ? "bg-brand-700 text-white shadow-md"
                  : "text-brand-300 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="pt-6 pl-4">
          <ModeToggle />
        </div>
      </nav>
    </aside>
  );
}
