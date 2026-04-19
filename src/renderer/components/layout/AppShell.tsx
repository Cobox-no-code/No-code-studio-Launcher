import type { ReactNode } from "react";

/**
 * Root-level wrapper. Intentionally empty now — auth-shell chrome
 * (sidebar + topbar) is applied per-route-group via AuthedShell.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
