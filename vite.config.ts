import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site at /<repo>/. CI sets BASE_PATH; local dev uses "/".
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
