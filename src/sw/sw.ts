/// <reference lib="webworker" />
import { NAVIGATE_MESSAGE, safeHash, type NavigateMessage } from "../notifications/messages";

declare const self: ServiceWorkerGlobalScope;

/*
 * Phase 3 service worker: only opens the app when a notification is tapped (SPEC §9.1).
 * Precaching and the update prompt come in Phase 4.
 */

// Lets the page activate a waiting update (used by the Phase 4 update prompt).
self.addEventListener("message", (event) => {
  if ((event.data as { type?: unknown } | null)?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const hash = safeHash((event.notification.data as { hash?: unknown } | null)?.hash);
  event.waitUntil(openApp(hash));
});

async function openApp(hash: string): Promise<void> {
  const scope = self.registration.scope;
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const client = windows.find((c) => c.url.startsWith(scope));
  if (client) {
    // An open tab navigates itself, so the leave guard still gets a say.
    const message: NavigateMessage = { type: NAVIGATE_MESSAGE, hash };
    client.postMessage(message);
    await client.focus();
    return;
  }
  await self.clients.openWindow(new URL(hash, scope).href);
}
