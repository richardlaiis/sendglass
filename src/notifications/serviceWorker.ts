import { registerSW } from "virtual:pwa-register";
import { navigate } from "../app/router";
import { NAVIGATE_MESSAGE, safeHash, type NavigateMessage } from "./messages";

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let updateReady = false;
const updateListeners = new Set<() => void>();

/**
 * Registers the service worker, follows its "notification tapped" messages and
 * remembers when a new version is waiting (registerType: "prompt").
 */
export function startServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
      updateListeners.forEach((l) => l());
    },
  });
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as Partial<NavigateMessage> | null;
    if (data?.type === NAVIGATE_MESSAGE) navigate(safeHash(data.hash));
  });
}

/**
 * Calls `listener` once a new version is waiting, right away if one already is
 * (the service worker can find it before React mounts). Returns an unsubscribe function.
 */
export function onUpdateReady(listener: () => void): () => void {
  if (updateReady) listener();
  updateListeners.add(listener);
  return () => updateListeners.delete(listener);
}

/** Activates the waiting version and reloads the page. */
export function applyUpdate(): void {
  void updateSW?.(true);
}

/** The active registration, or null if there's no service worker within `timeoutMs`. */
export async function getRegistration(timeoutMs = 3000): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}
