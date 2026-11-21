import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves the site at /<repo>/. CI sets BASE_PATH; local dev uses "/".
const base = process.env.BASE_PATH ?? "/";

// Light surface tone from src/styles/tokens.css. The manifest can't read CSS variables.
const SURFACE_LIGHT = "#fff8f5";

export default defineConfig({
  base,
  plugins: [
    react(),
    // Custom service worker (src/sw/sw.ts): precache + notification taps.
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false, // registered in src/notifications/serviceWorker.ts
      manifest: {
        name: "Sendglass",
        short_name: "Sendglass",
        description: "Short-term time capsule notes to your future self.",
        lang: "en",
        // start_url and scope must match the GitHub Pages base path (SPEC §11).
        start_url: base,
        scope: base,
        display: "standalone",
        theme_color: SURFACE_LIGHT,
        background_color: SURFACE_LIGHT,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        // The whole app shell, so it works offline after the first load. The manifest and
        // its icons are added by the plugin; these are the other icons index.html links to.
        globPatterns: ["**/*.{js,css,html}", "icons/icon.svg", "icons/apple-touch-icon.png"],
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
