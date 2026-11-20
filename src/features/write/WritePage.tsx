import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { readClock } from "../../app/clock";
import { navigate, useLeaveGuard } from "../../app/router";
import { useNow } from "../../app/useNow";
import { AppBar } from "../../components/AppBar";
import { ChipGroup } from "../../components/ChipGroup";
import { SegmentedButton } from "../../components/SegmentedButton";
import {
  buildCapsule,
  validateDraft,
  type CapsuleDraft,
  type DraftError,
  type DraftUnlock,
} from "../../domain/capsule";
import { CONTENT_MAX, MAX_UNLOCK_MS, MIN_UNLOCK_MS, TITLE_MAX } from "../../domain/config";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../domain/datetimeLocal";
import { INTERVAL_CHIPS, getDatetimeChips } from "../../domain/quickChips";
import type { UnlockType } from "../../domain/types";
import { formatDuration, formatTime, formatUnlockMoment } from "../../i18n/format";
import { useRepositories } from "../../storage/StorageContext";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const CUSTOM = "custom";
const DEFAULT_INTERVAL = INTERVAL_CHIPS[0]?.id ?? CUSTOM;

function toCount(value: string): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function WritePage() {
  const { t, i18n } = useTranslation();
  const { capsules: repo } = useRepositories();
  const now = useNow();
  const id = useId();
  const locale = i18n.language;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<UnlockType>("datetime");
  const [dateValue, setDateValue] = useState("");
  const [intervalChoice, setIntervalChoice] = useState<string>(DEFAULT_INTERVAL);
  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [eventLabel, setEventLabel] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const dirty = title.trim() !== "" || content.trim() !== "" || eventLabel.trim() !== "";
  useLeaveGuard(dirty && !saving, t("write.leaveConfirm"));

  const unlock: DraftUnlock =
    type === "datetime"
      ? { type, at: fromDateTimeLocalValue(dateValue) }
      : type === "interval"
        ? {
            type,
            durationMs:
              INTERVAL_CHIPS.find((c) => c.id === intervalChoice)?.durationMs ??
              toCount(days) * DAY + toCount(hours) * HOUR + toCount(minutes) * MINUTE,
          }
        : { type, label: eventLabel };
  const draft: CapsuleDraft = { title, content, unlock };
  const errors = validateDraft(draft, now);
  const shownErrors = submitted ? errors : [];

  function errorText(e: DraftError): string {
    switch (e) {
      case "contentTooLong":
        return t("write.errors.contentTooLong", { count: CONTENT_MAX });
      case "titleTooLong":
        return t("write.errors.titleTooLong", { count: TITLE_MAX });
      case "tooSoon":
        return t("write.errors.tooSoon", { count: MIN_UNLOCK_MS / MINUTE });
      case "tooLate":
        return t("write.errors.tooLate", { count: MAX_UNLOCK_MS / DAY });
      default:
        return t(`write.errors.${e}`);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setSaveFailed(false);
    const sealedAt = readClock();
    if (validateDraft(draft, sealedAt).length > 0) return;

    setSaving(true);
    try {
      await repo.create(buildCapsule(draft, sealedAt, crypto.randomUUID()));
      navigate("#/", { force: true });
    } catch {
      setSaving(false);
      setSaveFailed(true);
    }
  }

  const unlockAt =
    unlock.type === "datetime"
      ? unlock.at
      : unlock.type === "interval"
        ? now + unlock.durationMs
        : null;
  const timeOk = !errors.some((e) => e === "tooSoon" || e === "tooLate" || e === "dateMissing");
  const preview =
    unlock.type === "event"
      ? unlock.label.trim() && t("write.previewEvent", { event: unlock.label.trim() })
      : unlockAt !== null && timeOk
        ? t("write.previewTime", {
            moment: formatUnlockMoment(t, locale, unlockAt, now),
            duration: formatDuration(t, unlockAt - now, "ceil"),
          })
        : "";

  const invalid = (...keys: DraftError[]) => shownErrors.some((e) => keys.includes(e));

  const datetimeChips = getDatetimeChips(now);
  const selectedDateChip = datetimeChips.find((c) => toDateTimeLocalValue(c.at) === dateValue);

  return (
    <>
      <AppBar title={t("write.title")} back />
      <main className="page">
        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor={`${id}-title`}>
              {t("write.titleLabel")}
            </label>
            <input
              id={`${id}-title`}
              className="text-input"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={invalid("titleTooLong")}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor={`${id}-body`}>
              {t("write.bodyLabel")}
            </label>
            <textarea
              id={`${id}-body`}
              className="text-input text-input--area"
              value={content}
              maxLength={CONTENT_MAX}
              rows={8}
              placeholder={t("write.bodyPlaceholder")}
              onChange={(e) => setContent(e.target.value)}
              aria-invalid={invalid("contentEmpty", "contentTooLong")}
              aria-describedby={`${id}-counter`}
            />
            <span id={`${id}-counter`} className="field-support field-support--end">
              {t("write.counter", { count: content.length, max: CONTENT_MAX })}
            </span>
          </div>

          <SegmentedButton<UnlockType>
            label={t("write.unlockLabel")}
            value={type}
            onChange={setType}
            options={[
              { value: "datetime", label: t("write.type.datetime") },
              { value: "interval", label: t("write.type.interval") },
              { value: "event", label: t("write.type.event") },
            ]}
          />

          {type === "datetime" && datetimeChips.length > 0 && (
            <ChipGroup
              label={t("write.chips.dateLabel")}
              value={selectedDateChip?.id ?? null}
              onSelect={(id) => {
                const chip = datetimeChips.find((c) => c.id === id);
                if (chip) setDateValue(toDateTimeLocalValue(chip.at));
              }}
              options={datetimeChips.map((c) => ({
                value: c.id,
                label: t(`write.chips.${c.id}`, { time: formatTime(locale, c.at) }),
              }))}
            />
          )}

          {type === "datetime" && (
            <div className="field">
              <label className="field-label" htmlFor={`${id}-date`}>
                {t("write.dateLabel")}
              </label>
              <input
                id={`${id}-date`}
                className="text-input"
                type="datetime-local"
                value={dateValue}
                min={toDateTimeLocalValue(now + MIN_UNLOCK_MS)}
                max={toDateTimeLocalValue(now + MAX_UNLOCK_MS)}
                onChange={(e) => setDateValue(e.target.value)}
                aria-invalid={invalid("dateMissing", "tooSoon", "tooLate")}
              />
            </div>
          )}

          {type === "interval" && (
            <ChipGroup
              label={t("write.chips.intervalLabel")}
              value={intervalChoice}
              onSelect={setIntervalChoice}
              options={[
                ...INTERVAL_CHIPS.map((c) => ({
                  value: c.id,
                  label: t(`write.chips.${c.unit}`, { count: c.value }),
                })),
                { value: CUSTOM, label: t("write.chips.custom") },
              ]}
            />
          )}

          {type === "interval" && intervalChoice === CUSTOM && (
            <div className="interval-fields">
              {(
                [
                  ["days", days, setDays, 30],
                  ["hours", hours, setHours, 23],
                  ["minutes", minutes, setMinutes, 59],
                ] as const
              ).map(([key, value, set, max]) => (
                <div className="field" key={key}>
                  <label className="field-label" htmlFor={`${id}-${key}`}>
                    {t(`write.${key}`)}
                  </label>
                  <input
                    id={`${id}-${key}`}
                    className="text-input"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    aria-invalid={invalid("tooSoon", "tooLate")}
                  />
                </div>
              ))}
            </div>
          )}

          {type === "event" && (
            <div className="field">
              <label className="field-label" htmlFor={`${id}-event`}>
                {t("write.eventLabel")}
              </label>
              <input
                id={`${id}-event`}
                className="text-input"
                value={eventLabel}
                placeholder={t("write.eventPlaceholder")}
                onChange={(e) => setEventLabel(e.target.value)}
                aria-invalid={invalid("eventLabelEmpty")}
                aria-describedby={`${id}-event-hint`}
                autoComplete="off"
              />
              <span id={`${id}-event-hint`} className="field-support">
                {t("write.eventHint")}
              </span>
            </div>
          )}

          <p className="preview" aria-live="polite">
            {preview}
          </p>

          {(shownErrors.length > 0 || saveFailed) && (
            <ul className="errors" role="alert">
              {shownErrors.map((e) => (
                <li key={e}>{errorText(e)}</li>
              ))}
              {saveFailed && <li>{t("write.errors.saveFailed")}</li>}
            </ul>
          )}

          <button type="submit" className="btn btn--filled btn--block" disabled={saving}>
            {saving ? t("write.sealing") : t("write.seal")}
          </button>
        </form>
      </main>
    </>
  );
}
