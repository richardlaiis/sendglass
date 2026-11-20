import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { getProgress, getRemainingMs, getUnlockAt, toDisplayPercent } from "../../domain/status";
import type { Capsule } from "../../domain/types";
import {
  formatDateTime,
  formatDuration,
  formatPercent,
  formatUnlockMoment,
} from "../../i18n/format";

interface CapsuleCardProps {
  capsule: Capsule;
  now: number;
  ready: boolean;
}

export function CapsuleCard({ capsule, now, ready }: CapsuleCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const title = capsule.title ? (
    <h3 className="capsule-card__title">{capsule.title}</h3>
  ) : (
    <h3 className="capsule-card__title capsule-card__title--hidden">
      <span aria-hidden="true">{t("home.hiddenTitle")}</span>
      <span className="visually-hidden">{t("home.untitled")}</span>
    </h3>
  );

  if (ready) {
    return (
      <Card className="capsule-card capsule-card--ready">
        <div className="capsule-card__head">
          {title}
          <span className="badge">{t("home.readyBadge")}</span>
        </div>
        <p className="capsule-card__meta">
          {t("home.sealedOn", { date: formatDateTime(locale, capsule.createdAt) })}
        </p>
      </Card>
    );
  }

  if (capsule.unlock.type === "event") {
    return (
      <Card className="capsule-card">
        {title}
        <p className="capsule-card__primary">
          {t("home.waitingFor", { event: capsule.unlock.label })}
        </p>
        <p className="capsule-card__meta">
          {t("home.sealedAgo", { duration: formatDuration(t, now - capsule.createdAt, "floor") })}
        </p>
      </Card>
    );
  }

  const progress = getProgress(capsule, now) ?? 0;
  const remaining = getRemainingMs(capsule, now) ?? 0;
  const unlockAt = getUnlockAt(capsule) ?? now;
  const percentValue = toDisplayPercent(progress);
  const percent = formatPercent(locale, percentValue);
  const left = t("home.left", { duration: formatDuration(t, remaining, "ceil") });

  return (
    <Card className="capsule-card">
      {title}
      <div className="capsule-card__numbers">
        <span className="capsule-card__percent">{percent}</span>
        <span className="capsule-card__left">{left}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentValue}
        aria-valuetext={t("home.progressText", { percent, left })}
      >
        <div className="progress__bar" style={{ width: `${percentValue}%` }} />
      </div>
      <p className="capsule-card__meta">{formatUnlockMoment(t, locale, unlockAt, now)}</p>
    </Card>
  );
}
