import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => ({
  plugins: [react()],

  // In `e2e` mode (used only by playwright.config.ts's webServer), swap the real Tauri
  // plugins for in-memory browser-side fakes so the unmodified app can run in a plain
  // Chromium tab - there's no Tauri runtime available outside the native webview.
  resolve:
    mode === "e2e"
      ? {
          alias: {
            "@tauri-apps/plugin-fs": fileURLToPath(new URL("./e2e/mocks/fs.ts", import.meta.url)),
            "@tauri-apps/plugin-dialog": fileURLToPath(new URL("./e2e/mocks/dialog.ts", import.meta.url)),
            "@tauri-apps/api/path": fileURLToPath(new URL("./e2e/mocks/path.ts", import.meta.url)),
            "@tauri-apps/api/core": fileURLToPath(new URL("./e2e/mocks/core.ts", import.meta.url)),
          },
        }
      : undefined,

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    css: false,
    exclude: ["**/node_modules/**", "**/src-tauri/**", "**/src/test-modal.tsx", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/test-modal.tsx",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
}));
