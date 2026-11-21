import type { TFunction } from "i18next";
import type { NotificationMessage } from "../domain/notifications";
import { formatRelativePast } from "../i18n/format";
import type { NotificationContent } from "./show";

/** Notification text in the active language. Never includes capsule content (SPEC §9.1). */
export function notificationContent(
  t: TFunction,
  locale: string,
  message: NotificationMessage,
  now: number,
): NotificationContent {
  if (message.kind === "summary") {
    return {
      title: t("notify.summaryTitle", { count: message.count }),
      body: t("notify.summaryBody"),
      tag: message.tag,
      hash: message.hash,
    };
  }
  const body = t("notify.body", { relative: formatRelativePast(locale, now - message.createdAt) });
  return {
    title: t("notify.title"),
    body: message.title ? `${body}\n${t("notify.capsuleTitle", { title: message.title })}` : body,
    tag: message.tag,
    hash: message.hash,
  };
}

export function testNotificationContent(t: TFunction): NotificationContent {
  return {
    title: t("notify.testTitle"),
    body: t("notify.testBody"),
    tag: "sendglass-test",
    hash: "#/",
  };
}
