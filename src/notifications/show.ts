import type { NotificationData } from "./messages";
import { notificationSupport } from "./permission";
import { getRegistration } from "./serviceWorker";

export interface NotificationContent {
  title: string;
  body: string;
  tag: string;
  /** In-app route to open when tapped. */
  hash: string;
}

/**
 * Shows a notification through the service worker, so tapping it can open the app.
 * Returns false if it couldn't be shown (no permission, no service worker).
 */
export async function showNotification(content: NotificationContent): Promise<boolean> {
  if (notificationSupport() !== "granted") return false;
  const registration = await getRegistration();
  if (!registration) return false;
  const data: NotificationData = { hash: content.hash };
  try {
    await registration.showNotification(content.title, {
      body: content.body,
      tag: content.tag,
      data,
    });
    return true;
  } catch {
    return false;
  }
}
