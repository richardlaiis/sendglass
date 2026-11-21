import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { resolveLanguage } from "../domain/locale";
import { DEFAULT_SETTINGS, type Settings, type Theme } from "../domain/types";
import { setAppLocale } from "../i18n";
import { useRepositories } from "../storage/StorageContext";
import { readMirroredLanguage, readMirroredTheme } from "../storage/settingsMirror";
import { SettingsContext } from "./SettingsContext";
import { applyThemeColor } from "./themeColor";

function applyTheme(theme: Theme) {
  // "system" = no attribute; tokens.css then follows prefers-color-scheme.
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  applyThemeColor(theme);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings: repo } = useRepositories();
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    theme: readMirroredTheme(),
    language: readMirroredLanguage(),
  }));

  const [loaded, setLoaded] = useState(false);

  // IndexedDB is the source of truth; the mirror only covers first paint.
  useEffect(() => {
    let cancelled = false;
    void repo.get().then((stored) => {
      if (cancelled) return;
      setSettings(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useEffect(() => applyTheme(settings.theme), [settings.theme]);

  useEffect(() => {
    const apply = () => setAppLocale(resolveLanguage(settings.language, navigator.language));
    apply();
    if (settings.language !== "system") return;
    window.addEventListener("languagechange", apply);
    return () => window.removeEventListener("languagechange", apply);
  }, [settings.language]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      void repo.set(patch);
    },
    [repo],
  );

  const value = useMemo(
    () => ({ settings, loaded, updateSettings }),
    [settings, loaded, updateSettings],
  );
  return <SettingsContext value={value}>{children}</SettingsContext>;
}
