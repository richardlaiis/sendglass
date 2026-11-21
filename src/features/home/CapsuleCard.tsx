import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Hourglass } from "../../components/Hourglass";
import { ProgressReadout } from "../../components/ProgressReadout";
import { useCapsuleProgress } from "../../components/useCapsuleProgress";
import type { Capsule } from "../../domain/types";
import { formatDateTime } from "../../i18n/format";

interface CapsuleCardProps {
  capsule: Capsule;
  now: number;
  /** Present for ready capsules: shows the Open button. */
  onOpen?: () => void;
}

/** Home card. The whole card links to the capsule page; the Open button sits above that link. */
export function CapsuleCard({ capsule, now, onOpen }: CapsuleCardProps) {
  const { t, i18n } = useTranslation();
  const view = useCapsuleProgress(capsule, now);
  const href = `#/capsule/${encodeURIComponent(capsule.id)}`;
  if (!view) return null;

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

  const ready = view.state === "ready";

  return (
    <Card className={ready ? "capsule-card capsule-card--ready" : "capsule-card"}>
      <Hourglass state={view.state} {...view.hourglass} size="small" />
      <div className="capsule-card__body">
        {ready ? (
          <>
            <div className="capsule-card__head">
              {title}
              <span className="badge">{t("home.readyBadge")}</span>
            </div>
            <p className="capsule-card__meta">
              {t("home.sealedOn", { date: formatDateTime(i18n.language, capsule.createdAt) })}
            </p>
            {onOpen && (
              <div className="card-actions">
                <button type="button" className="btn btn--filled above-link" onClick={onOpen}>
                  {t("home.open")}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {title}
            <ProgressReadout view={view} />
          </>
        )}
      </div>
    </Card>
  );
}
