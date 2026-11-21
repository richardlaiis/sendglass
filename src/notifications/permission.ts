export type NotificationSupport = NotificationPermission | "unsupported";

/** "granted" / "denied" / "default" (not asked yet), or "unsupported" by this browser. */
export function notificationSupport(): NotificationSupport {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

/** Asks for permission. Only call this from a user gesture (turning the setting on). */
export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.requestPermission();
}
