import { useEffect, useState } from "react";
import { readClock } from "./clock";

/**
 * The single place the UI reads the clock. Ticks every `intervalMs` while the
 * tab is visible, pauses while hidden, and catches up immediately when shown again.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => readClock());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      stop();
      setNow(readClock());
      timer = setInterval(() => setNow(readClock()), intervalMs);
    };
    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return now;
}
