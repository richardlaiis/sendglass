import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { readClock } from "../app/clock";
import { useSettings } from "../app/SettingsContext";
import { markNotified } from "../domain/actions";
import { describeNotification, planNotifications, readyCount } from "../domain/notifications";
import { useRepositories } from "../storage/StorageContext";
import { setReadyBadge } from "./badge";
import { notificationSupport } from "./permission";
import { showNotification } from "./show";
import { notificationContent } from "./text";

/** Fire a little after the unlock moment, so the capsule is surely ready. */
const SLACK_MS = 250;

/**
 * While the app is open (or recently backgrounded), notifies when capsules unlock
 * and keeps the app badge up to date (SPEC §9.1). Mount once.
 *
 * It re-plans on start, on focus, when capsules change, when the setting changes,
 * and when its single timer fires. Each run shows one notification for everything
 * due (catching up on capsules that unlocked while the app was closed) and marks
 * those capsules as notified.
 */
export function useNotificationScheduler(): void {
  const { capsules: repo } = useRepositories();
  const { settings, loaded } = useSettings();
  const { t, i18n } = useTranslation();
  const enabled = loaded && settings.notificationsEnabled;

  // Read at notification time, so the text follows the current language.
  const text = useRef({ t, locale: i18n.language });
  useEffect(() => {
    text.current = { t, locale: i18n.language };
  });

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let again = false;

    async function check() {
      if (disposed) return;
      if (running) {
        again = true;
        return;
      }
      running = true;
      try {
        const now = readClock();
        const capsules = await repo.list();
        if (disposed) return;
        void setReadyBadge(readyCount(capsules, now));

        const plan = planNotifications(capsules, now);
        if (enabled && notificationSupport() === "granted") {
          const message = describeNotification(plan.due);
          if (message) {
            const { t: tr, locale } = text.current;
            const shown = await showNotification(notificationContent(tr, locale, message, now));
            if (shown && !disposed) {
              // One at a time may fail (e.g. opened meanwhile); the rest still get marked.
              await Promise.allSettled(
                plan.due.map(async (c) => repo.update(c.id, markNotified(c, now))),
              );
            }
          }
        }

        clearTimeout(timer);
        timer = setTimeout(() => void check(), Math.max(0, plan.nextCheckAt - now) + SLACK_MS);
      } catch {
        // A failed check is retried on the next trigger (focus, change or timer).
      } finally {
        running = false;
        if (again) {
          again = false;
          void check();
        }
      }
    }

    const onVisible = () => {
      if (!document.hidden) void check();
    };
    const unsubscribe = repo.onChange(() => void check());
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    void check();

    return () => {
      disposed = true;
      clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [repo, enabled]);
}
