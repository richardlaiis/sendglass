import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNow } from "../../app/useNow";
import { AppBar } from "../../components/AppBar";
import { Fab } from "../../components/Fab";
import { AddIcon } from "../../components/icons";
import { groupForHome } from "../../domain/home";
import type { Capsule } from "../../domain/types";
import { useRepositories } from "../../storage/StorageContext";
import { CapsuleCard } from "./CapsuleCard";

export function HomePage() {
  const { t } = useTranslation();
  const { capsules: repo } = useRepositories();
  const now = useNow();
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

  const { ready, sealed } = useMemo(() => groupForHome(capsules ?? [], now), [capsules, now]);
  const isEmpty = capsules !== null && ready.length === 0 && sealed.length === 0;

  return (
    <>
      <AppBar title={t("app.name")} showSettings />
      <main className="page page--with-fab">
        {isEmpty && (
          <div className="empty-state">
            <p className="empty-state__title">{t("home.empty")}</p>
            <p className="empty-state__hint">{t("home.emptyHint")}</p>
          </div>
        )}

        {ready.length > 0 && (
          <section className="section" aria-labelledby="ready-heading">
            <h2 id="ready-heading" className="section__title">
              {t("home.ready")}
            </h2>
            <div className="card-list">
              {ready.map((c) => (
                <CapsuleCard key={c.id} capsule={c} now={now} ready />
              ))}
            </div>
          </section>
        )}

        {sealed.length > 0 && (
          <section className="section" aria-labelledby="sealed-heading">
            <h2 id="sealed-heading" className="section__title">
              {t("home.sealed")}
            </h2>
            <div className="card-list">
              {sealed.map((c) => (
                <CapsuleCard key={c.id} capsule={c} now={now} ready={false} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Fab href="#/new" icon={<AddIcon />} label={t("home.newCapsule")} />
    </>
  );
}
