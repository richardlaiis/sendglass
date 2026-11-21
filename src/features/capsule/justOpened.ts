/**
 * Capsules opened a moment ago, so the capsule page knows to play the reveal
 * (the shatter reveal) instead of showing the note statically.
 */
const ids = new Set<string>();

export function markJustOpened(id: string): void {
  ids.add(id);
}

export function wasJustOpened(id: string): boolean {
  return ids.has(id);
}

export function clearJustOpened(id: string): void {
  ids.delete(id);
}
