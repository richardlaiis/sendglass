import { useTranslation } from "react-i18next";
import { hourglassState } from "../domain/hourglass";
import { getProgress, getRemainingMs, getUnlockAt, toDisplayPercent } from "../domain/status";
import type { Capsule } from "../domain/types";
import {
  formatDuration,
  formatDurationLong,
  formatPercent,
  formatUnlockMoment,
} from "../i18n/format";

interface Common {
  /** Props for <Hourglass>. */
  hourglass: {
    progress: number | null;
    label: string;
    valueText: string;
    valueNow: number | null;
  };
}

export type CapsuleProgressView = Common &
  (
    | { state: "sealed"; percent: string; left: string; unlockMoment: string }
    | { state: "event"; waitingFor: string; sealedAgo: string }
    | { state: "ready" }
  );

/** Everything the hourglass and readout show for a capsule. Null once it's opened. */
export function useCapsuleProgress(capsule: Capsule, now: number): CapsuleProgressView | null {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const state = hourglassState(capsule, now);
  const label = t("hourglass.label");

  if (state === null) return null;

  if (state === "ready") {
    return {
      state,
      hourglass: { progress: 1, label, valueText: t("hourglass.readyValue"), valueNow: 100 },
    };
  }

  if (capsule.unlock.type === "event") {
    const elapsed = now - capsule.createdAt;
    return {
      state: "event",
      waitingFor: t("home.waitingFor", { event: capsule.unlock.label }),
      sealedAgo: t("home.sealedAgo", { duration: formatDuration(t, elapsed, "floor") }),
      hourglass: {
        progress: null,
        label,
        valueText: t("hourglass.eventValue", {
          event: capsule.unlock.label,
          duration: formatDurationLong(t, elapsed, "floor"),
        }),
        valueNow: null,
      },
    };
  }

  const progress = getProgress(capsule, now) ?? 0;
  const remaining = getRemainingMs(capsule, now) ?? 0;
  const percentValue = toDisplayPercent(progress);
  const percent = formatPercent(locale, percentValue);
  return {
    state: "sealed",
    percent,
    left: t("home.left", { duration: formatDuration(t, remaining, "ceil") }),
    unlockMoment: formatUnlockMoment(t, locale, getUnlockAt(capsule) ?? now, now),
    hourglass: {
      progress,
      label,
      valueText: t("home.progressText", {
        percent,
        left: t("home.left", { duration: formatDurationLong(t, remaining, "ceil") }),
      }),
      valueNow: percentValue,
    },
  };
}
