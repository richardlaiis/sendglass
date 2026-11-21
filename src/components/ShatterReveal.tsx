import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { planShatter } from "../domain/shatter";
import { BOTTOM_CHAMBER, CAPS, GLASS_PATH, VIEW_BOX } from "./hourglassShapes";

/** Timeline (ms), SPEC §6.4. */
const CRACK_MS = 300;
const SHATTER_MS = 900;
const NOTE_START_MS = CRACK_MS + 700;
const NOTE_MS = 500;
const REDUCED_MS = 200;

const SHARD_EASING = "cubic-bezier(0.2, 0.6, 0.35, 1)";
const FALL_EASING = "cubic-bezier(0.55, 0, 1, 0.45)"; // ease-in: sand speeds up as it falls
const RISE_EASING = "cubic-bezier(0.2, 0, 0, 1)";

interface ShatterRevealProps {
  /** Seeds the shatter pattern: the same capsule always breaks the same way. */
  seed: string;
  /** Called once the note is fully shown (after the animation, or right after a skip). */
  onDone: () => void;
  /** The note card that rises into place. */
  children: ReactNode;
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The reveal: the ready hourglass cracks, shatters into shards while the sand
 * spills, then the note rises where it stood. Only transform and opacity are
 * animated (plus the crack lines drawing in). Tap or press to skip.
 * With prefers-reduced-motion it's a 200ms cross-fade instead.
 */
export function ShatterReveal({ seed, onDone, children }: ShatterRevealProps) {
  const { t } = useTranslation();
  const plan = useMemo(() => planShatter(seed), [seed]);
  const [reduced] = useState(prefersReducedMotion);
  const id = useId();
  const glassClip = `${id}-glass`;
  const shardClip = (i: number) => `${id}-shard-${i}`;

  const stageRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Layout effect: start (and hide the note) before the first paint, so it never flashes.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const note = noteRef.current;
    if (!stage || !note) return;

    const animations: Animation[] = [];
    const run = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      animations.push(el.animate(keyframes, options));
    };
    const all = (selector: string) => stage.querySelectorAll(selector);
    let vibrateTimer: ReturnType<typeof setTimeout> | undefined;

    if (reduced) {
      run(stage, [{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, fill: "forwards" });
      run(note, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, fill: "backwards" });
    } else {
      // 1. Cracks draw themselves in.
      all(".shatter__crack").forEach((el, i) =>
        run(el, [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], {
          duration: CRACK_MS - 60,
          delay: plan.cracks[i]?.delay ?? 0,
          easing: "ease-out",
          fill: "both",
        }),
      );

      // 2. Shatter: swap the intact glass for its shards, which fly outward and fade.
      const swap = { duration: 1, delay: CRACK_MS, fill: "both" } as const;
      all(".shatter__intact").forEach((el) => run(el, [{ opacity: 1 }, { opacity: 0 }], swap));
      all(".shatter__shards").forEach((el) => run(el, [{ opacity: 0 }, { opacity: 1 }], swap));
      all(".shatter__shard").forEach((el, i) => {
        const s = plan.shards[i];
        if (!s) return;
        run(
          el,
          [
            { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 },
            { opacity: 1, offset: 0.25 },
            { transform: `translate(${s.dx}px, ${s.dy}px) rotate(${s.rotate}deg)`, opacity: 0 },
          ],
          {
            duration: SHATTER_MS - s.delay,
            delay: CRACK_MS + s.delay,
            easing: SHARD_EASING,
            fill: "both",
          },
        );
      });

      // Sand spills: the body dissolves while dots fall with an ease-in curve.
      all(".shatter__sand").forEach((el) =>
        run(el, [{ opacity: 1 }, { opacity: 0 }], {
          duration: 400,
          delay: CRACK_MS,
          fill: "forwards",
        }),
      );
      all(".shatter__dot").forEach((el, i) => {
        const d = plan.dots[i];
        if (!d) return;
        run(
          el,
          [
            { transform: "translate(0px, 0px)", opacity: 0 },
            { opacity: 1, offset: 0.02 },
            { opacity: 1, offset: 0.6 },
            { transform: `translate(${d.dx}px, ${d.dy}px)`, opacity: 0 },
          ],
          {
            duration: SHATTER_MS - d.delay,
            delay: CRACK_MS + d.delay,
            easing: FALL_EASING,
            fill: "both",
          },
        );
      });

      // 3. The note rises into place.
      run(
        note,
        [
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: NOTE_MS, delay: NOTE_START_MS, easing: RISE_EASING, fill: "backwards" },
      );

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        vibrateTimer = setTimeout(() => navigator.vibrate([30, 40, 60]), CRACK_MS);
      }
    }

    skipRef.current = () => {
      clearTimeout(vibrateTimer);
      animations.forEach((a) => a.finish());
    };

    // Cancelled animations reject `finished`; that only happens on unmount, so ignore it.
    Promise.all(animations.map((a) => a.finished)).then(
      () => onDoneRef.current(),
      () => {},
    );

    return () => {
      clearTimeout(vibrateTimer);
      skipRef.current = () => {};
      animations.forEach((a) => a.cancel());
    };
  }, [plan, reduced]);

  const glass = (
    <>
      <path className="shatter__glass-fill" d={GLASS_PATH} />
      <path className="shatter__glass" d={GLASS_PATH} />
      {CAPS.map((cap) => (
        <rect key={cap.y} className="shatter__cap" {...cap} />
      ))}
    </>
  );

  return (
    <div className="shatter">
      <div ref={noteRef} className="shatter__note">
        {children}
      </div>
      <button
        ref={stageRef}
        type="button"
        className="shatter__stage"
        aria-label={t("reveal.skip")}
        onClick={() => skipRef.current()}
      >
        <svg viewBox={VIEW_BOX} aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={glassClip}>
              <path d={GLASS_PATH} />
            </clipPath>
            {plan.shards.map((s, i) => (
              <clipPath key={s.points} id={shardClip(i)}>
                <polygon points={s.points} />
              </clipPath>
            ))}
          </defs>

          <polygon className="shatter__sand" points={BOTTOM_CHAMBER} />
          {plan.dots.map((d, i) => (
            <circle key={i} className="shatter__dot" cx={d.cx} cy={d.cy} r={d.r} />
          ))}

          <g className="shatter__intact">
            {glass}
            <g clipPath={`url(#${glassClip})`}>
              {plan.cracks.map((c) => (
                <path key={c.d} className="shatter__crack" d={c.d} pathLength={1} />
              ))}
            </g>
          </g>

          <g className="shatter__shards">
            {plan.shards.map((s, i) => (
              <g
                key={s.points}
                className="shatter__shard"
                style={{ transformOrigin: `${s.origin.x}px ${s.origin.y}px` }}
              >
                <g clipPath={`url(#${shardClip(i)})`}>
                  {glass}
                  <g clipPath={`url(#${glassClip})`}>
                    {plan.cracks.map((c) => (
                      <path key={c.d} className="shatter__crack--static" d={c.d} />
                    ))}
                  </g>
                </g>
              </g>
            ))}
          </g>
        </svg>
      </button>
    </div>
  );
}
