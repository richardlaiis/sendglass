/** Formats epoch ms as an `<input type="datetime-local">` value ("YYYY-MM-DDTHH:mm", local time). */
export function toDateTimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Parses an `<input type="datetime-local">` value as local time. Null if empty or invalid. */
export function fromDateTimeLocalValue(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  const date = new Date(y, mo - 1, d, h, mi);
  // Reject rollovers like 2026-02-31.
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date.getTime();
}
