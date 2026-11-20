import { describe, expect, it } from "vitest";
import {
  CHAIN_DIALOGS,
  cancelChain,
  confirmStep,
  matchesPhrase,
  startChain,
  submitPhrase,
  type ChainState,
} from "./earlyOpen";

const EN = "I can't wait";
const ZH = "我等不及了";

function advance(times: number): ChainState {
  let s = startChain();
  for (let i = 0; i < times; i++) s = confirmStep(s);
  return s;
}

describe("early-open chain", () => {
  it("starts at dialog 1", () => {
    expect(startChain()).toEqual({ kind: "dialog", step: 1 });
  });

  it("walks through 5 dialogs, then asks for the phrase", () => {
    for (let step = 1; step <= CHAIN_DIALOGS; step++) {
      expect(advance(step - 1)).toEqual({ kind: "dialog", step });
    }
    expect(advance(CHAIN_DIALOGS)).toEqual({ kind: "phrase", error: false });
  });

  it("aborts from every step, including the phrase", () => {
    for (let n = 0; n <= CHAIN_DIALOGS; n++) {
      expect(cancelChain(advance(n))).toEqual({ kind: "aborted" });
    }
  });

  it("restarts at step 1 after an abort", () => {
    const aborted = cancelChain(advance(3));
    expect(confirmStep(aborted)).toEqual(aborted);
    expect(startChain()).toEqual({ kind: "dialog", step: 1 });
  });

  it("finishes with 5 confirmations when the phrase matches", () => {
    expect(submitPhrase(advance(5), EN, EN)).toEqual({ kind: "done", confirmations: 5 });
    expect(submitPhrase(advance(5), ZH, ZH)).toEqual({ kind: "done", confirmations: 5 });
  });

  it("stays on the phrase step with an error when it doesn't match", () => {
    expect(submitPhrase(advance(5), "i cant wait", EN)).toEqual({ kind: "phrase", error: true });
  });

  it("ignores phrase submissions before the phrase step", () => {
    expect(submitPhrase(advance(2), EN, EN)).toEqual({ kind: "dialog", step: 3 });
  });

  it("can't be skipped: confirmStep does nothing on the phrase step", () => {
    expect(confirmStep(advance(5))).toEqual({ kind: "phrase", error: false });
  });
});

describe("matchesPhrase", () => {
  it("accepts the exact phrase, surrounding spaces and curly apostrophes", () => {
    expect(matchesPhrase(EN, EN)).toBe(true);
    expect(matchesPhrase("  I can't wait ", EN)).toBe(true);
    expect(matchesPhrase("I can’t wait", EN)).toBe(true);
    expect(matchesPhrase(ZH, ZH)).toBe(true);
  });

  it("is otherwise exact: case, missing apostrophe, extra words", () => {
    expect(matchesPhrase("i can't wait", EN)).toBe(false);
    expect(matchesPhrase("I cant wait", EN)).toBe(false);
    expect(matchesPhrase("I can't wait!", EN)).toBe(false);
    expect(matchesPhrase("我等不及", ZH)).toBe(false);
  });
});
