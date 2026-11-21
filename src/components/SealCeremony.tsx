import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { planAssembly } from "../domain/assemble";
import { Hourglass } from "./Hourglass";
import { VIEW_BOX } from "./hourglassShapes";

/** Timeline (ms). */
const PIXEL_MS = 600;
const ASSEMBLED_MS = 1000; // last pixel lands (max delay 400 + 600)
const CROSSFADE_MS = 300;
const CAPTION_DELAY_MS = 900;
const CAPTION_MS = 400;
const HOLD_MS = 700; // the assembled hourglass rests before the question
const FLIP_MS = 650;
const SETTLE_DELAY_MS = 120;
const FALL_MS = 1200; // watch the sand start falling, then leave

const DECELERATE = "cubic-bezier(0.05, 0.7, 0.1, 1)";

/**
 * intro:    the hourglass (all sand at the bottom) assembles from pixels; the caption fades in.
 * ask:      "Don't open it early, OK? :)"
 * saving:   OK was pressed; the capsule is being saved.
 * flipping: the whole hourglass turns 180°.
 * flipped:  drawn upright with a full top (looks the same as the turned glass); sand falls.
 * settled:  event capsules only: the sand settles into its resting level and sways.
 */
type Phase = "intro" | "ask" | "saving" | "flipping" | "flipped" | "settled";

interface SealCeremonyProps {
  kind: "time" | "event";
  /** Seeds the pixel pattern (the new capsule's id). */
  seed: string;
  /** Saves the capsule when the user presses OK. Resolves false if it couldn't be saved. */
  onConfirm: () => Promise<boolean>;
  /** Called when the ceremony is over. */
  onDone: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The sealing ceremony after tapping "Seal" (SPEC §8): the time only starts once you promise to wait. */
export function SealCeremony({ kind, seed, onConfirm, onDone }: SealCeremonyProps) {
  const { t } = useTranslation();
  const askId = useId();
  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState<Phase>(reduced ? "ask" : "intro");
  const pixels = useMemo(() => planAssembly(seed), [seed]);

  const turnRef = useRef<HTMLDivElement>(null);
  const realRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<SVGSVGElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Intro: pixels fly in and reassemble, then cross-fade to the real drawing.
  useLayoutEffect(() => {
    const real = realRef.current;
    const pixelSvg = pixelsRef.current;
    const caption = captionRef.current;
    if (reduced || !real || !pixelSvg || !caption) return;

    const animations: Animation[] = [];
    pixelSvg.querySelectorAll(".seal__pixel").forEach((el, i) => {
      const p = pixels[i];
      if (!p) return;
      animations.push(
        el.animate(
          [
            { transform: `translate(${p.fromX}px, ${p.fromY}px)`, opacity: 0 },
            { transform: "translate(0px, 0px)", opacity: 1 },
          ],
          { duration: PIXEL_MS, delay: p.delay, easing: DECELERATE, fill: "backwards" },
        ),
      );
    });
    const fade = { duration: CROSSFADE_MS, delay: ASSEMBLED_MS };
    animations.push(
      pixelSvg.animate([{ opacity: 1 }, { opacity: 0 }], { ...fade, fill: "forwards" }),
      real.animate([{ opacity: 0 }, { opacity: 1 }], { ...fade, fill: "backwards" }),
      caption.animate(
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: CAPTION_MS, delay: CAPTION_DELAY_MS, easing: DECELERATE, fill: "backwards" },
      ),
    );

    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    Promise.all(animations.map((a) => a.finished)).then(
      () => {
        holdTimer = setTimeout(() => setPhase("ask"), HOLD_MS);
      },
      () => {},
    );
    return () => {
      clearTimeout(holdTimer);
      animations.forEach((a) => a.cancel());
    };
  }, [pixels, reduced]);

  useEffect(() => {
    if (phase === "ask") okRef.current?.focus();
  }, [phase]);

  async function confirm() {
    setPhase("saving");
    if (!(await onConfirm())) return; // the page goes back to the form
    if (reduced) onDoneRef.current();
    else setPhase("flipping");
  }

  // Flip. When the phase moves on, the cleanup drops the rotation in the same
  // commit that draws the hourglass upright, so the swap is invisible.
  useLayoutEffect(() => {
    const el = turnRef.current;
    if (phase !== "flipping" || !el) return;
    const flip = el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(180deg)" }], {
      duration: FLIP_MS,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "forwards",
    });
    flip.finished.then(
      () => setPhase("flipped"),
      () => {},
    );
    return () => flip.cancel();
  }, [phase]);

  useEffect(() => {
    if (phase !== "flipped" || kind !== "event") return;
    const timer = setTimeout(() => setPhase("settled"), SETTLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, kind]);

  const counting = phase === "flipped" || phase === "settled";
  useEffect(() => {
    if (!counting) return;
    const timer = setTimeout(() => onDoneRef.current(), FALL_MS);
    return () => clearTimeout(timer);
  }, [counting]);

  const stage = counting ? phase : "before";
  const asking = phase === "ask" || phase === "saving";

  return (
    <div className="seal" data-stage={stage} data-kind={kind}>
      <div ref={turnRef} className="seal__turn" aria-hidden="true">
        <div ref={realRef} className="seal__real">
          <Hourglass
            state={phase === "settled" ? "event" : "sealed"}
            progress={counting ? 0 : 1}
            label=""
            valueText=""
            valueNow={null}
            size="large"
          />
        </div>
        {!reduced && (
          <svg ref={pixelsRef} className="seal__pixels" viewBox={VIEW_BOX}>
            {pixels.map((p) => (
              <rect
                key={`${p.x},${p.y}`}
                className={`seal__pixel seal__pixel--${p.kind}`}
                x={p.x}
                y={p.y}
                width={p.size}
                height={p.size}
                rx={0.6}
              />
            ))}
          </svg>
        )}
      </div>

      <p ref={captionRef} className="seal__caption" role="status">
        {t("write.sealedDone")}
      </p>

      <div className="seal__ask" data-visible={asking}>
        <p id={askId} className="seal__question">
          {t("write.askNoPeek")}
        </p>
        <button
          ref={okRef}
          type="button"
          className="btn btn--filled"
          aria-describedby={askId}
          disabled={!asking || phase === "saving"}
          onClick={() => void confirm()}
        >
          {t("write.askOk")}
        </button>
      </div>
    </div>
  );
}
