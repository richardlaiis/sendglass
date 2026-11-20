import { useTranslation } from "react-i18next";
import { AppBar } from "../components/AppBar";

/** Stand-in for routes that later phases build (capsule detail, history). */
export function PlaceholderPage() {
  const { t } = useTranslation();
  return (
    <>
      <AppBar title={t("placeholder.title")} back />
      <main className="page">
        <div className="empty-state">
          <p className="empty-state__title">{t("placeholder.body")}</p>
          <a className="btn btn--text" href="#/">
            {t("placeholder.home")}
          </a>
        </div>
      </main>
    </>
  );
}
