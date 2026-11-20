import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "../../components/Dialog";
import {
  cancelChain,
  confirmStep,
  matchesPhrase,
  startChain,
  submitPhrase,
  type ChainState,
  type DialogStep,
} from "../../domain/earlyOpen";
import { getRemainingMs } from "../../domain/status";
import type { Capsule } from "../../domain/types";
import { formatDuration } from "../../i18n/format";

interface ConfirmChainProps {
  capsule: Capsule;
  now: number;
  /** Any cancel (button, Esc, scrim). The parent unmounts the chain, so the next try starts at step 1. */
  onAbort: () => void;
  onComplete: (confirmations: number) => void;
}

/**
 * SPEC §5: five escalating dialogs, then a typed phrase.
 * "Keep waiting" is always the filled button, always in the same place, and gets focus on every step.
 */
export function ConfirmChain({ capsule, now, onAbort, onComplete }: ConfirmChainProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<ChainState>(startChain);
  const [phrase, setPhrase] = useState("");
  const formId = useId();
  const inputId = useId();
  const expected = t("chain.phrase");

  function abort() {
    setState(cancelChain(state));
    onAbort();
  }

  function stepText(step: DialogStep): string {
    if (step !== 3) return t(`chain.step${step}`);
    if (capsule.unlock.type === "event") {
      return t("chain.step3Event", { event: capsule.unlock.label });
    }
    return t("chain.step3", {
      remaining: formatDuration(t, getRemainingMs(capsule, now) ?? 0, "ceil"),
    });
  }

  function onSubmitPhrase(e: FormEvent) {
    e.preventDefault();
    const next = submitPhrase(state, phrase, expected);
    if (next.kind === "done") onComplete(next.confirmations);
    else setState(next);
  }

  if (state.kind === "dialog") {
    return (
      <Dialog
        open
        title={stepText(state.step)}
        onCancel={abort}
        focusKey={state.step}
        actions={
          <>
            <button
              type="button"
              className="btn btn--text"
              onClick={() => setState(confirmStep(state))}
            >
              {t("chain.openAnyway")}
            </button>
            <button type="button" className="btn btn--filled" data-autofocus onClick={abort}>
              {t("chain.keepWaiting")}
            </button>
          </>
        }
      />
    );
  }

  if (state.kind !== "phrase") return null;

  const matches = matchesPhrase(phrase, expected);
  return (
    <Dialog
      open
      title={t("chain.phraseTitle")}
      onCancel={abort}
      focusKey="phrase"
      actions={
        <>
          <button type="submit" form={formId} className="btn btn--text" disabled={!matches}>
            {t("chain.openAnyway")}
          </button>
          <button type="button" className="btn btn--filled" onClick={abort}>
            {t("chain.keepWaiting")}
          </button>
        </>
      }
    >
      <form id={formId} className="field" onSubmit={onSubmitPhrase}>
        <label htmlFor={inputId}>{t("chain.phrasePrompt", { phrase: expected })}</label>
        <input
          id={inputId}
          className="text-input"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={state.error}
          data-autofocus
        />
        {state.error && (
          <span className="field-support field-support--error">{t("chain.phraseError")}</span>
        )}
      </form>
    </Dialog>
  );
}
