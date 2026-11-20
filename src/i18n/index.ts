import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resolveLanguage, type AppLocale } from "../domain/locale";
import { readMirroredLanguage } from "../storage/settingsMirror";
import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";

export const resources = {
  en: { translation: en },
  "zh-TW": { translation: zhTW },
} as const;

function syncDocument(lng: string) {
  document.documentElement.lang = lng;
  document.title = i18n.t("app.name");
}

i18n.on("languageChanged", syncDocument);

// Language is read from the localStorage mirror so the first render is already in the right language.
void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(readMirroredLanguage(), navigator.language),
  fallbackLng: "en",
  supportedLngs: ["en", "zh-TW"],
  interpolation: { escapeValue: false }, // React already escapes.
  returnNull: false,
});

export function setAppLocale(locale: AppLocale): void {
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
}

export default i18n;
