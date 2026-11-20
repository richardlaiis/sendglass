import type { Language, Theme } from "./types";

export type AppLocale = "en" | "zh-TW";

/** `system` follows the browser: any `zh*` language → zh-TW, everything else → en. */
export function resolveLanguage(pref: Language, navigatorLanguage: string | undefined): AppLocale {
  if (pref !== "system") return pref;
  return navigatorLanguage?.toLowerCase().startsWith("zh") ? "zh-TW" : "en";
}

const THEME_CYCLE: readonly Theme[] = ["system", "light", "dark"];

/** Order used by the app-bar theme toggle. */
export function nextTheme(theme: Theme): Theme {
  const i = THEME_CYCLE.indexOf(theme);
  return THEME_CYCLE[(i + 1) % THEME_CYCLE.length] ?? "system";
}
