import { useEffect, useSyncExternalStore } from "react";
import { parseHash, type Route } from "./routes";

/** Returns false to block navigation (e.g. unsaved text). Only one guard at a time. */
type LeaveGuard = () => boolean;

let guard: LeaveGuard | null = null;
/** Set by `navigate()` after it already asked the guard, so the hashchange handler doesn't ask again. */
let bypassGuardOnce = false;
let currentHash = readHash();
const listeners = new Set<() => void>();

function readHash(): string {
  return typeof location === "undefined" ? "#/" : location.hash || "#/";
}

function onHashChange() {
  const next = readHash();
  if (next === currentHash) return;
  if (guard && !bypassGuardOnce && !guard()) {
    // Back/forward can't be cancelled; put the previous route back without firing hashchange.
    history.pushState(null, "", currentHash);
    return;
  }
  bypassGuardOnce = false;
  currentHash = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("hashchange", onHashChange);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("hashchange", onHashChange);
  };
}

export function useRoute(): Route {
  return parseHash(useSyncExternalStore(subscribe, () => currentHash));
}

/** Navigates to a hash route. `force` skips the leave guard (e.g. right after saving). */
export function navigate(hash: string, { force = false } = {}): void {
  if (hash === readHash()) return;
  if (!force && guard && !guard()) return;
  bypassGuardOnce = true;
  location.hash = hash;
}

/** While `active`, asks `message` before leaving the page or the current route. */
export function useLeaveGuard(active: boolean, message: string): void {
  useEffect(() => {
    if (!active) return;
    const own: LeaveGuard = () => window.confirm(message);
    guard = own;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      if (guard === own) guard = null;
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, message]);
}
