import type { Language, Theme } from "../domain/types";

/**
 * IndexedDB is async, so it can't be read before first paint.
 * Theme and language are mirrored to localStorage so index.html (theme)
 * and i18n init (language) can read them synchronously.
 * Keep THEME_KEY in sync with the inline script in index.html.
 */
export const THEME_KEY = "sendglass.theme";
export const LANGUAGE_KEY = "sendglass.lang";

const THEMES: readonly Theme[] = ["system", "light", "dark"];
const LANGUAGES: readonly Language[] = ["system", "en", "zh-TW"];

function read(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota). The mirror is only a paint-time hint.
  }
}

export function readMirroredTheme(): Theme {
  const v = read(THEME_KEY);
  return THEMES.includes(v as Theme) ? (v as Theme) : "system";
}

export function readMirroredLanguage(): Language {
  const v = read(LANGUAGE_KEY);
  return LANGUAGES.includes(v as Language) ? (v as Language) : "system";
}

export function mirrorSettings(s: { theme?: Theme; language?: Language }): void {
  if (s.theme) write(THEME_KEY, s.theme);
  if (s.language) write(LANGUAGE_KEY, s.language);
}
