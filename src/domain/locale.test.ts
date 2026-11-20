import { describe, expect, it } from "vitest";
import { nextTheme, resolveLanguage } from "./locale";

describe("resolveLanguage", () => {
  it("returns an explicit choice as-is", () => {
    expect(resolveLanguage("en", "zh-TW")).toBe("en");
    expect(resolveLanguage("zh-TW", "en-US")).toBe("zh-TW");
  });

  it("maps any zh browser language to zh-TW when following the system", () => {
    for (const lang of ["zh", "zh-TW", "zh-CN", "zh-Hant-HK", "ZH-tw"]) {
      expect(resolveLanguage("system", lang)).toBe("zh-TW");
    }
  });

  it("falls back to en for other or missing browser languages", () => {
    expect(resolveLanguage("system", "ja-JP")).toBe("en");
    expect(resolveLanguage("system", undefined)).toBe("en");
  });
});

describe("nextTheme", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});
