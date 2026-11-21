import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { readClock } from "../../app/clock";
import { useSettings } from "../../app/SettingsContext";
import { AppBar } from "../../components/AppBar";
import { Card } from "../../components/Card";
import { Hourglass } from "../../components/Hourglass";
import { ProgressReadout } from "../../components/ProgressReadout";
import { SealCeremony } from "../../components/SealCeremony";
import { ShatterReveal } from "../../components/ShatterReveal";
import { SegmentedButton } from "../../components/SegmentedButton";
import { useCapsuleProgress } from "../../components/useCapsuleProgress";
import type { HourglassState } from "../../domain/hourglass";
import type { Capsule, Theme } from "../../domain/types";
import { formatPercent } from "../../i18n/format";

const HOUR = 3_600_000;
const TOTAL = 6 * HOUR;

/** Builds a fake capsule that shows the chosen state at `now`. */
function fakeCapsule(state: HourglassState, progress: number, now: number): Capsule {
  const base = { id: "dev", schemaVersion: 1 as const, content: "" };
  if (state === "event") {
    return { ...base, createdAt: now - 76 * HOUR, unlock: { type: "event", label: "exam" } };
  }
  const p = state === "ready" ? 1 : Math.min(progress, 0.9999);
  const createdAt = now - p * TOTAL;
  return {
    ...base,
    createdAt,
    unlock: { type: "interval", durationMs: TOTAL, at: createdAt + TOTAL },
  };
}

/** #/dev/hourglass: check every hourglass state quickly. Only exists in `npm run dev`. */
export default function DevHourglassPage() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const sliderId = useId();
  const [now] = useState(() => readClock());
  const [state, setState] = useState<HourglassState>("sealed");
  const [progress, setProgress] = useState(0.35);
  /** Each press of "Play shatter" uses a new seed, so you see different patterns. */
  const [shatter, setShatter] = useState({ run: 0, playing: false });
  const seed = `dev-${shatter.run}`;
  const [flipRun, setFlipRun] = useState(0);
  const [flipping, setFlipping] = useState(false);

  const capsule = useMemo(() => fakeCapsule(state, progress, now), [state, progress, now]);
  const view = useCapsuleProgress(capsule, now);

  return (
    <>
      <AppBar title={t("dev.title")} back />
      <main className="page">
        <div className="form">
          <SegmentedButton<HourglassState>
            label={t("dev.state")}
            value={state}
            onChange={setState}
            options={[
              { value: "sealed", label: t("dev.states.sealed") },
              { value: "event", label: t("dev.states.event") },
              { value: "ready", label: t("dev.states.ready") },
            ]}
          />
          <div className="field">
            <label className="field-label" htmlFor={sliderId}>
              {t("dev.progress", { percent: formatPercent(i18n.language, progress * 100) })}
            </label>
            <input
              id={sliderId}
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              disabled={state !== "sealed"}
              onChange={(e) => setProgress(Number(e.target.value) / 1000)}
            />
          </div>
          <SegmentedButton<Theme>
            label={t("settings.theme")}
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: "system", label: t("theme.system") },
              { value: "light", label: t("theme.light") },
              { value: "dark", label: t("theme.dark") },
            ]}
          />
          <button
            type="button"
            className="btn btn--filled"
            onClick={() => setShatter((s) => ({ run: s.run + 1, playing: true }))}
          >
            {t("dev.playShatter")}
          </button>
          <button
            type="button"
            className="btn btn--filled"
            onClick={() => {
              setFlipRun((n) => n + 1);
              setFlipping(true);
            }}
          >
            {t("dev.playFlip")}
          </button>
        </div>

        {flipping && (
          <section className="dev__preview">
            <SealCeremony
              key={flipRun}
              kind={state === "event" ? "event" : "time"}
              seed={`dev-${flipRun}`}
              onConfirm={() => Promise.resolve(true)}
              onDone={() => setFlipping(false)}
            />
          </section>
        )}

        {shatter.run > 0 && (
          <section className="dev__preview">
            <p className="field-support">{t("dev.seed", { seed })}</p>
            {shatter.playing ? (
              <ShatterReveal
                key={shatter.run}
                seed={seed}
                onDone={() => setShatter((s) => ({ ...s, playing: false }))}
              >
                <DevNote />
              </ShatterReveal>
            ) : (
              <DevNote />
            )}
          </section>
        )}

        {view && (
          <>
            <section className={`detail dev__preview ${state === "ready" ? "detail--ready" : ""}`}>
              <div className="detail__progress">
                <Hourglass state={view.state} {...view.hourglass} size="large" />
                <ProgressReadout view={view} size="large" />
              </div>
            </section>
            <div className="card-list dev__cards">
              <Card
                className={state === "ready" ? "capsule-card capsule-card--ready" : "capsule-card"}
              >
                <Hourglass state={view.state} {...view.hourglass} size="small" />
                <div className="capsule-card__body">
                  <ProgressReadout view={view} />
                </div>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function DevNote() {
  const { t } = useTranslation();
  return (
    <article className="note">
      <p className="note__body">{t("dev.sampleNote")}</p>
    </article>
  );
}
