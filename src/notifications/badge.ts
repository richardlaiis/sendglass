/** App badge with the number of ready capsules (Badging API, where supported). */
export async function setReadyBadge(count: number): Promise<void> {
  try {
    if (count > 0 && "setAppBadge" in navigator) await navigator.setAppBadge(count);
    else if (count === 0 && "clearAppBadge" in navigator) await navigator.clearAppBadge();
  } catch {
    // Not installed, or no permission: the badge is a nice-to-have.
  }
}
