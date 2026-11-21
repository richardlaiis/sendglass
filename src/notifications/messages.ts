/** Messages between the service worker and the page. Shared by both builds, so no DOM types here. */

/** SW → page: a notification was tapped while the app was open; go to `hash`. */
export const NAVIGATE_MESSAGE = "sendglass:navigate";

export interface NavigateMessage {
  type: typeof NAVIGATE_MESSAGE;
  hash: string;
}

/** Data attached to every notification we show. */
export interface NotificationData {
  hash: string;
}

/** Only in-app hash routes are allowed as notification targets. */
export function safeHash(value: unknown): string {
  return typeof value === "string" && value.startsWith("#/") ? value : "#/";
}
