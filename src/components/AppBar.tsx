import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../app/SettingsContext";
import { navigate } from "../app/router";
import { nextTheme } from "../domain/locale";
import { ArrowBackIcon, AutoThemeIcon, DarkModeIcon, LightModeIcon, SettingsIcon } from "./icons";

interface AppBarProps {
  title: string;
  /** Shows a back button that returns to Home. */
  back?: boolean;
  /** Shows the settings button (Home only). */
  showSettings?: boolean;
}

const THEME_ICON: Record<string, () => ReactNode> = {
  system: AutoThemeIcon,
  light: LightModeIcon,
  dark: DarkModeIcon,
};

export function AppBar({ title, back = false, showSettings = false }: AppBarProps) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const ThemeIcon = THEME_ICON[settings.theme] ?? AutoThemeIcon;

  return (
    <header className="app-bar">
      {back && (
        <button
          type="button"
          className="icon-btn"
          aria-label={t("nav.back")}
          onClick={() => navigate("#/")}
        >
          <ArrowBackIcon />
        </button>
      )}
      <h1 className="app-bar__title">{title}</h1>
      <button
        type="button"
        className="icon-btn"
        aria-label={t("theme.toggle", { current: t(`theme.${settings.theme}`) })}
        onClick={() => updateSettings({ theme: nextTheme(settings.theme) })}
      >
        <ThemeIcon />
      </button>
      {showSettings && (
        <a className="icon-btn" href="#/settings" aria-label={t("nav.settings")}>
          <SettingsIcon />
        </a>
      )}
    </header>
  );
}
