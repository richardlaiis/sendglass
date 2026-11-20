/** Number of "are you sure?" dialogs before the typed phrase (SPEC §5). */
export const CHAIN_DIALOGS = 5;
/** Dialogs plus the phrase step, for "Step n of 6". */
export const CHAIN_TOTAL_STEPS = CHAIN_DIALOGS + 1;

export type DialogStep = 1 | 2 | 3 | 4 | 5;

export type ChainState =
  | { kind: "dialog"; step: DialogStep }
  | { kind: "phrase"; error: boolean }
  | { kind: "done"; confirmations: number }
  | { kind: "aborted" };

/** Every attempt starts at step 1. */
export function startChain(): ChainState {
  return { kind: "dialog", step: 1 };
}

/** "Open anyway" on a dialog step. */
export function confirmStep(state: ChainState): ChainState {
  if (state.kind !== "dialog") return state;
  if (state.step < CHAIN_DIALOGS) return { kind: "dialog", step: (state.step + 1) as DialogStep };
  return { kind: "phrase", error: false };
}

/** "Keep waiting", Esc, or tapping outside: aborts the whole chain. */
export function cancelChain(state: ChainState): ChainState {
  return state.kind === "done" ? state : { kind: "aborted" };
}

export function submitPhrase(state: ChainState, input: string, expected: string): ChainState {
  if (state.kind !== "phrase") return state;
  return matchesPhrase(input, expected)
    ? { kind: "done", confirmations: CHAIN_DIALOGS }
    : { kind: "phrase", error: true };
}

/**
 * Exact match, except: surrounding whitespace is ignored, Unicode is NFC-normalized,
 * and curly/modifier apostrophes count as "'" (phone keyboards insert them automatically).
 * Case matters.
 */
export function matchesPhrase(input: string, expected: string): boolean {
  return normalizePhrase(input) === normalizePhrase(expected);
}

function normalizePhrase(s: string): string {
  return s
    .normalize("NFC")
    .trim()
    .replace(/[‘’ʼ′]/g, "'");
}
