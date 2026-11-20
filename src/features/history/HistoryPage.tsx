import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppBar } from "../../components/AppBar";
import { Card } from "../../components/Card";
import { getHistory } from "../../domain/history";
import type { Capsule } from "../../domain/types";
import { formatDateTime } from "../../i18n/format";
import { useRepositories } from "../../storage/StorageContext";
import { EarlyBadge } from "../capsule/EarlyBadge";

export function HistoryPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { capsules: repo } = useRepositories();
  const [capsules, setCapsules] = useState<Capsule[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void repo.list().then((list) => {
      if (!cancelled) setCapsules(list);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const opened = useMemo(() => getHistory(capsules ?? []), [capsules]);

  return (
    <>
      <AppBar title={t("history.title")} back />
      <main className="page">
        {capsules !== null && opened.length === 0 && (
          <div className="empty-state">
            <p className="empty-state__title">{t("history.empty")}</p>
          </div>
        )}
        <div className="card-list">
          {opened.map((c) => (
            <Card key={c.id} className="capsule-card">
              <h2 className="capsule-card__title">
                <a className="card-link" href={`#/capsule/${encodeURIComponent(c.id)}`}>
                  {c.title ?? t("home.untitled")}
                </a>
              </h2>
              <p className="capsule-card__meta">
                {t("history.written", { date: formatDateTime(locale, c.createdAt) })}
                <br />
                {t("history.opened", { date: formatDateTime(locale, c.openedAt ?? c.createdAt) })}
              </p>
              <p className={c.reply ? "history__reply" : "history__reply history__reply--none"}>
                {c.reply ? t("history.reply", { text: c.reply.content }) : t("history.noReply")}
              </p>
              <EarlyBadge capsule={c} />
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
