import { useEffect, useId, useRef } from "react";
import { sandOffsetsFor, type HourglassState } from "../domain/hourglass";
import {
  BOTTOM_CHAMBER,
  BOTTOM_SAND,
  CAPS,
  GLASS_PATH,
  STREAM,
  TOP_CHAMBER,
  TOP_SAND,
  VIEW_BOX,
  WAVE_BACK,
  WAVE_FRONT,
} from "./hourglassShapes";

interface HourglassProps {
  state: HourglassState;
  /** 0–1 for sealed time capsules. Ignored for event (resting) and ready (all sand at the bottom). */
  progress: number | null;
  /** Accessible name of the progress bar. */
  label: string;
  /** e.g. "62.4%, 4 hours 31 minutes left". */
  valueText: string;
  /** Display percent for aria-valuenow. Leave null when progress doesn't apply (event capsules). */
  valueNow: number | null;
  size?: "small" | "large";
}

/**
 * Abstract SVG hourglass (SPEC §6.3). Sand shapes are full chambers clipped by
 * triangle clipPaths and moved with translateY, so the 1s CSS transition keeps
 * them gliding between the once-a-second updates.
 */
export function Hourglass({
  state,
  progress,
  label,
  valueText,
  valueNow,
  size = "small",
}: HourglassProps) {
  const id = useId();
  const topClip = `${id}-top`;
  const bottomClip = `${id}-bottom`;
  const glowGradient = `${id}-glow`;
  const ref = useRef<HTMLDivElement>(null);

  const offsets = sandOffsetsFor(state, progress);
  const showStream = state === "sealed" && (progress ?? 0) < 1;

  // Pause the looping animations while the hourglass is off-screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) el.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`hourglass hourglass--${size} hourglass--${state}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valueNow ?? undefined}
      aria-valuetext={valueText}
    >
      <svg viewBox={VIEW_BOX} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={topClip}>
            <polygon points={TOP_CHAMBER} />
          </clipPath>
          <clipPath id={bottomClip}>
            <polygon points={BOTTOM_CHAMBER} />
          </clipPath>
          <radialGradient id={glowGradient}>
            <stop offset="0" className="hourglass__glow-stop" />
            <stop offset="1" className="hourglass__glow-stop hourglass__glow-stop--edge" />
          </radialGradient>
        </defs>

        {state === "ready" && (
          <ellipse
            className="hourglass__glow"
            cx="60"
            cy="140"
            rx="60"
            ry="66"
            fill={`url(#${glowGradient})`}
          />
        )}

        <path className="hourglass__glass-fill" d={GLASS_PATH} />

        <g clipPath={`url(#${topClip})`}>
          <g className="hourglass__level" style={{ transform: `translateY(${offsets.top}px)` }}>
            {state === "event" ? (
              <>
                <path className="hourglass__sand-deep hourglass__wave--back" d={WAVE_BACK} />
                <path className="hourglass__sand hourglass__wave--front" d={WAVE_FRONT} />
              </>
            ) : (
              <rect className="hourglass__sand" {...TOP_SAND} />
            )}
          </g>
        </g>

        {showStream && (
          <line
            className="hourglass__stream"
            x1={STREAM.x}
            y1={STREAM.y1}
            x2={STREAM.x}
            y2={STREAM.y2}
          />
        )}

        <g clipPath={`url(#${bottomClip})`}>
          <g className="hourglass__level" style={{ transform: `translateY(${offsets.bottom}px)` }}>
            <rect className="hourglass__sand-deep" {...BOTTOM_SAND} />
          </g>
        </g>

        <path className="hourglass__glass" d={GLASS_PATH} />
        {CAPS.map((cap) => (
          <rect key={cap.y} className="hourglass__cap" {...cap} />
        ))}
      </svg>
    </div>
  );
}
