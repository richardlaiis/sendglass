import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/SettingsContext";
import { AppBar } from "../../components/AppBar";
import { SegmentedButton } from "../../components/SegmentedButton";
import { useSnackbar } from "../../components/SnackbarContext";
import { Switch } from "../../components/Switch";
import type { Language, Theme } from "../../domain/types";
import {
  notificationSupport,
  requestNotificationPermission,
  type NotificationSupport,
} from "../../notifications/permission";
import { showNotification } from "../../notifications/show";
import { testNotificationContent } from "../../notifications/text";

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
          <NotificationSettings />
        </div>
      </main>
    </>
  );
}

/** SPEC §9.1: permission is asked only when the user turns this on. */
function NotificationSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const snackbar = useSnackbar();
  const [permission, setPermission] = useState<NotificationSupport>(notificationSupport);

  // The permission can change in the browser's site settings while we're away.
  useEffect(() => {
    const refresh = () => setPermission(notificationSupport());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  async function toggle(on: boolean) {
    if (!on) {
      updateSettings({ notificationsEnabled: false });
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") updateSettings({ notificationsEnabled: true });
    else
      snackbar.show(
        t(result === "unsupported" ? "settings.notifyUnsupported" : "settings.notifyBlocked"),
      );
  }

  async function sendTest() {
    if (!(await showNotification(testNotificationContent(t)))) {
      snackbar.show(t("settings.notifyTestFailed"));
    }
  }

  return (
    <div className="settings-group">
      <Switch
        label={t("settings.notifications")}
        description={t("settings.notificationsHint")}
        checked={settings.notificationsEnabled && permission === "granted"}
        onChange={(on) => void toggle(on)}
      />
      <p className="field-support">{t(`settings.notifyPermission.${permission}`)}</p>
      <button
        type="button"
        className="btn btn--text settings-group__action"
        disabled={permission !== "granted"}
        onClick={() => void sendTest()}
      >
        {t("settings.notifyTest")}
      </button>
    </div>
  );
}
