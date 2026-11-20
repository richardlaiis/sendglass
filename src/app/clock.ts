/** The only place UI code reads the wall clock (useNow and event handlers). */
export function readClock(): number {
  return Date.now();
}
