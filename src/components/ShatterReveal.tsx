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
const CRACK_MS = 300; // cracks draw in
const SWAP_MS = 120; // smooth glass → pixel shards
const BREAK_MS = 400; // shards drift apart
const SCATTER_START_MS = CRACK_MS + 200; // pixels start leaving while the shards still drift
const SCATTER_MS = 700;
const NOTE_START_MS = 1100;
const NOTE_MS = 500;
const REDUCED_MS = 200;

const DECELERATE = "cubic-bezier(0.2, 0.6, 0.35, 1)";
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
 * The reveal: the ready hourglass cracks, breaks into shards that crumble into
 * pixels (glass scatters, sand falls) and fade, then the note rises where it stood.
 * The reverse of the sealing intro. Only transform and opacity are animated (plus
 * the crack lines drawing in). Tap or press to skip.
 * With prefers-reduced-motion it's a 200ms cross-fade instead.
 */
export function ShatterReveal({ seed, onDone, children }: ShatterRevealProps) {
  const { t } = useTranslation();
  const plan = useMemo(() => planShatter(seed), [seed]);
  const pixelsByShard = useMemo(
    () =>
      plan.shards.map((_, s) =>
        plan.pixels.flatMap((p, i) => (p.shard === s ? [{ ...p, index: i }] : [])),
      ),
    [plan],
  );
  const [reduced] = useState(prefersReducedMotion);
  const glassClip = `${useId()}-glass`;

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
    const all = (selector: string) => stage.querySelectorAll<SVGElement>(selector);
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

      // 2. The smooth glass turns into its pixel version, cut into shards...
      const swap = { duration: SWAP_MS, delay: CRACK_MS, fill: "both" } as const;
      all(".shatter__intact").forEach((el) => run(el, [{ opacity: 1 }, { opacity: 0 }], swap));
      all(".shatter__shards").forEach((el) => run(el, [{ opacity: 0 }, { opacity: 1 }], swap));

      // ...which drift apart a little...
      all(".shatter__shard").forEach((el, i) => {
        const s = plan.shards[i];
        if (!s) return;
        run(
          el,
          [
            { transform: "translate(0px, 0px) rotate(0deg)" },
            { transform: `translate(${s.dx}px, ${s.dy}px) rotate(${s.rotate}deg)` },
          ],
          { duration: BREAK_MS, delay: CRACK_MS + s.delay, easing: DECELERATE, fill: "both" },
        );
      });

      // 3. ...and crumble: glass pixels scatter outward, sand pixels fall, all fade out.
      all(".shatter__pixel").forEach((el) => {
        const p = plan.pixels[Number(el.dataset.i)];
        if (!p) return;
        run(
          el,
          [
            { transform: "translate(0px, 0px)", opacity: 1 },
            { opacity: 1, offset: 0.3 },
            { transform: `translate(${p.dx}px, ${p.dy}px)`, opacity: 0 },
          ],
          {
            duration: SCATTER_MS,
            delay: SCATTER_START_MS + p.delay,
            easing: p.kind === "sand" ? FALL_EASING : DECELERATE,
            fill: "both",
          },
        );
      });

      // 4. The note rises into place.
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
          </defs>

          <g className="shatter__intact">
            <path className="shatter__glass-fill" d={GLASS_PATH} />
            <polygon className="shatter__sand" points={BOTTOM_CHAMBER} />
            <path className="shatter__glass" d={GLASS_PATH} />
            {CAPS.map((cap) => (
              <rect key={cap.y} className="shatter__cap" {...cap} />
            ))}
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
                {pixelsByShard[i]?.map((p) => (
                  <rect
                    key={p.index}
                    data-i={p.index}
                    className={`shatter__pixel shatter__pixel--${p.kind}`}
                    x={p.x}
                    y={p.y}
                    width={p.size}
                    height={p.size}
                    rx={0.6}
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
      </button>
    </div>
  );
}
