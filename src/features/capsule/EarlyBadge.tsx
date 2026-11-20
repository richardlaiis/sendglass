import { useTranslation } from "react-i18next";
import { getOpenedEarlyByMs } from "../../domain/history";
import type { Capsule } from "../../domain/types";
import { formatOpenedEarly } from "../../i18n/format";

/** "Opened 2 days early 😬". Renders nothing for capsules opened on time. */
export function EarlyBadge({ capsule }: { capsule: Capsule }) {
  const { t } = useTranslation();
  if (!capsule.openedEarly) return null;
  const earlyBy = getOpenedEarlyByMs(capsule);
  return (
    <span className="badge badge--early">
      {earlyBy === null ? t("early.event") : formatOpenedEarly(t, earlyBy)}
    </span>
  );
}
