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
  /** Present for ready capsules: shows the Open button. */
  onOpen?: () => void;
}

/** Home card. The whole card links to the capsule page; the Open button sits above that link. */
export function CapsuleCard({ capsule, now, onOpen }: CapsuleCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const href = `#/capsule/${encodeURIComponent(capsule.id)}`;

  const title = (
    <h3 className="capsule-card__title">
      <a className="card-link" href={href}>
        {capsule.title ?? (
          <>
            <span aria-hidden="true" className="masked">
              {t("home.hiddenTitle")}
            </span>
            <span className="visually-hidden">{t("home.untitled")}</span>
          </>
        )}
      </a>
    </h3>
  );

  if (onOpen) {
    return (
      <Card className="capsule-card capsule-card--ready">
        <div className="capsule-card__head">
          {title}
          <span className="badge">{t("home.readyBadge")}</span>
        </div>
        <p className="capsule-card__meta">
          {t("home.sealedOn", { date: formatDateTime(locale, capsule.createdAt) })}
        </p>
        <div className="card-actions">
          <button type="button" className="btn btn--filled above-link" onClick={onOpen}>
            {t("home.open")}
          </button>
        </div>
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
      <ProgressBar percentValue={percentValue} text={t("home.progressText", { percent, left })} />
      <p className="capsule-card__meta">{formatUnlockMoment(t, locale, unlockAt, now)}</p>
    </Card>
  );
}

export function ProgressBar({ percentValue, text }: { percentValue: number; text: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentValue}
      aria-valuetext={text}
    >
      <div className="progress__bar" style={{ width: `${percentValue}%` }} />
    </div>
  );
}
