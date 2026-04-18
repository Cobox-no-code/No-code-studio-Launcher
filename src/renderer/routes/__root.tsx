import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AppShell } from "@renderer/components/layout/AppShell";

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </AppShell>
  ),
});
