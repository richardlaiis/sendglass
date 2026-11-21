import { registerSW } from "virtual:pwa-register";
import { navigate } from "../app/router";
import { NAVIGATE_MESSAGE, safeHash, type NavigateMessage } from "./messages";

/** Registers the service worker and follows its "notification tapped" messages. */
export function startServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  registerSW({ immediate: true });
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as Partial<NavigateMessage> | null;
    if (data?.type === NAVIGATE_MESSAGE) navigate(safeHash(data.hash));
  });
}

/** The active registration, or null if there's no service worker within `timeoutMs`. */
export async function getRegistration(timeoutMs = 3000): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}
