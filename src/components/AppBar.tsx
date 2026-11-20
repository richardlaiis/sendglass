import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { REPO_URL } from "../app/links";
import { useSettings } from "../app/SettingsContext";
import { navigate } from "../app/router";
import { nextTheme } from "../domain/locale";
import {
  ArrowBackIcon,
  AutoThemeIcon,
  DarkModeIcon,
  GitHubIcon,
  HistoryIcon,
  LightModeIcon,
  SettingsIcon,
} from "./icons";

interface AppBarProps {
  title: string;
  /** Shows a back button that returns to Home. */
  back?: boolean;
  /** Shows the GitHub, history and settings buttons (Home only). */
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
      <div className="app-bar__title-group">
        <h1 className="app-bar__title">{title}</h1>
        {showSettings && (
          <a
            className="icon-btn icon-btn--small"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("nav.github")}
            title={t("nav.github")}
          >
            <GitHubIcon />
          </a>
        )}
      </div>
      {showSettings && (
        <a className="icon-btn" href="#/history" aria-label={t("nav.history")}>
          <HistoryIcon />
        </a>
      )}
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
