import type { CapsuleProgressView } from "./useCapsuleProgress";

interface ProgressReadoutProps {
  view: CapsuleProgressView;
  size?: "small" | "large";
}

/**
 * The exact numbers next to the hourglass (SPEC §6.3): percentage, time left and
 * the unlock moment; or, for event capsules, what it's waiting for and how long ago it was sealed.
 * The hourglass carries the progressbar role, so this text is the visible copy of it.
 */
export function ProgressReadout({ view, size = "small" }: ProgressReadoutProps) {
  const cls = `readout readout--${size}`;
  if (view.state === "sealed") {
    return (
      <div className={cls}>
        <p className="readout__percent">{view.percent}</p>
        <p className="readout__primary">{view.left}</p>
        <p className="readout__meta">{view.unlockMoment}</p>
      </div>
    );
  }
  if (view.state === "event") {
    return (
      <div className={cls}>
        <p className="readout__primary">{view.waitingFor}</p>
        <p className="readout__meta">{view.sealedAgo}</p>
      </div>
    );
  }
  return null;
}
