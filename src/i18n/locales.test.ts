import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";

type Tree = { [key: string]: string | Tree };

/** Flattens keys and folds plural suffixes, since zh-TW only has `_other`. */
function keys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === "string"
      ? [`${prefix}${k.replace(/_(one|other)$/, "")}`]
      : keys(v, `${prefix}${k}.`),
  );
}

describe("locales", () => {
  it("en and zh-TW define the same keys", () => {
    expect([...new Set(keys(zhTW))].sort()).toEqual([...new Set(keys(en))].sort());
  });

  it("zh-TW plural keys only use _other", () => {
    expect(JSON.stringify(zhTW)).not.toMatch(/_one"/);
  });
});
