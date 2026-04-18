import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@main": resolve("src/main"),
        "@shared": resolve("src/shared"),
      },
    },
    build: {
      outDir: "out/main",
      lib: { entry: "src/main/index.ts" },
    },
  },
  preload: {
    resolve: { alias: { "@shared": resolve("src/shared") } },
    build: {
      outDir: "out/preload",
      lib: { entry: "src/preload/index.ts" },
    },
  },
  renderer: {
    root: "src/renderer",
    plugins: [
      TanStackRouterVite({
        target: "react",
        routesDirectory: resolve("src/renderer/routes"),
        generatedRouteTree: resolve("src/renderer/routeTree.gen.ts"),
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
        "@shared": resolve("src/shared"),
      },
    },
    build: {
      outDir: "out/renderer",
      rollupOptions: { input: resolve("src/renderer/index.html") },
    },
  },
});
