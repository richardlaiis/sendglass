import { useCallback, useSyncExternalStore } from "react";
import { readClock } from "./clock";

/**
 * One shared ticker per interval (in practice just 1000ms), so the whole app
 * re-renders on the same tick from a single timer. It runs only while someone
 * is subscribed and the tab is visible, and catches up immediately when shown again.
 */
interface Ticker {
  now: number;
  timer: ReturnType<typeof setInterval> | undefined;
  listeners: Set<() => void>;
}

const tickers = new Map<number, Ticker>();

function getTicker(intervalMs: number): Ticker {
  let ticker = tickers.get(intervalMs);
  if (!ticker) {
    ticker = { now: readClock(), timer: undefined, listeners: new Set() };
    tickers.set(intervalMs, ticker);
  }
  return ticker;
}

function tick(ticker: Ticker) {
  ticker.now = readClock();
  ticker.listeners.forEach((l) => l());
}

function start(ticker: Ticker, intervalMs: number) {
  stop(ticker);
  tick(ticker);
  ticker.timer = setInterval(() => tick(ticker), intervalMs);
}

function stop(ticker: Ticker) {
  if (ticker.timer !== undefined) clearInterval(ticker.timer);
  ticker.timer = undefined;
}

function onVisibility() {
  tickers.forEach((ticker, intervalMs) => {
    if (ticker.listeners.size === 0) return;
    if (document.hidden) stop(ticker);
    else start(ticker, intervalMs);
  });
}

let visibilityListening = false;

function subscribe(intervalMs: number, listener: () => void): () => void {
  const ticker = getTicker(intervalMs);
  ticker.listeners.add(listener);
  if (!visibilityListening) {
    document.addEventListener("visibilitychange", onVisibility);
    visibilityListening = true;
  }
  if (ticker.listeners.size === 1 && !document.hidden) start(ticker, intervalMs);

  return () => {
    ticker.listeners.delete(listener);
    if (ticker.listeners.size === 0) stop(ticker);
    if (visibilityListening && [...tickers.values()].every((t) => t.listeners.size === 0)) {
      document.removeEventListener("visibilitychange", onVisibility);
      visibilityListening = false;
    }
  };
}

/** The single place the UI reads the clock while rendering. Ticks every `intervalMs`. */
export function useNow(intervalMs = 1000): number {
  const sub = useCallback((listener: () => void) => subscribe(intervalMs, listener), [intervalMs]);
  return useSyncExternalStore(sub, () => getTicker(intervalMs).now);
}
