import type { Theme } from "../domain/types";

/**
 * Browser UI color (Android status bar, title bar of the installed app) per scheme:
 * the surface tone from src/styles/tokens.css. index.html sets the same values before
 * first paint, so keep the two in sync.
 */
export const THEME_COLORS = { light: "#fff8f5", dark: "#19120c" } as const;

/**
 * index.html has one `<meta name="theme-color">` per color scheme. With an explicit
 * theme both get that theme's color; with "system" each goes back to its own scheme.
 */
export function applyThemeColor(theme: Theme): void {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const scheme = meta.media.includes("dark") ? "dark" : "light";
    meta.content = THEME_COLORS[theme === "system" ? scheme : theme];
  });
}
