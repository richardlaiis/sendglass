import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/SettingsContext";
import { AppBar } from "../../components/AppBar";
import { SegmentedButton } from "../../components/SegmentedButton";
import { Switch } from "../../components/Switch";
import type { Language, Theme } from "../../domain/types";

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  return (
    <>
      <AppBar title={t("settings.title")} back />
      <main className="page">
        <div className="form">
          <SegmentedButton<Language>
            label={t("settings.language")}
            value={settings.language}
            onChange={(language) => updateSettings({ language })}
            options={[
              { value: "system", label: t("language.system") },
              { value: "en", label: t("language.en") },
              { value: "zh-TW", label: t("language.zh-TW") },
            ]}
          />
          <SegmentedButton<Theme>
            label={t("settings.theme")}
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: "system", label: t("theme.system") },
              { value: "light", label: t("theme.light") },
              { value: "dark", label: t("theme.dark") },
            ]}
          />
          <Switch
            label={t("settings.earlyOpen")}
            description={t("settings.earlyOpenHint")}
            checked={settings.allowEarlyOpen}
            onChange={(allowEarlyOpen) => updateSettings({ allowEarlyOpen })}
          />
        </div>
      </main>
    </>
  );
}
