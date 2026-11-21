import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves the site at /<repo>/. CI sets BASE_PATH; local dev uses "/".
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    // Phase 3: a custom service worker (src/sw/sw.ts) for notification taps only.
    // Phase 4 adds the manifest, precaching and the update prompt.
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false, // registered in src/notifications/serviceWorker.ts
      manifest: false,
      injectManifest: {
        injectionPoint: undefined, // no precache manifest yet
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
