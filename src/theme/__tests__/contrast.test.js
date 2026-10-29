import { describe, it, expect } from "vitest";
import { tokens, T, DARK_TEXT } from "../tokens.js";
import { contrastRatio, meetsAA } from "../contrast.js";

describe("contrast maths", () => {
  it("matches known WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1);
  });
});

describe("token palette", () => {
  it("never uses pure white as a surface", () => {
    for (const v of [...Object.values(tokens), T.surface, T.canvas, T.canvasWarm, T.canvasDeep]) {
      expect(v.toUpperCase()).not.toBe("#FFFFFF");
    }
  });
});

/** Every text/background pair the UI actually renders. */
const BODY_PAIRS = [
  ["ink on alabaster", tokens.ink, tokens.alabaster],
  ["ink on paper", tokens.ink, tokens.paper],
  ["ink on deep canvas", T.ink, T.canvasDeep],
  ["inkMuted on alabaster", tokens.inkMuted, tokens.alabaster],
  ["inkMuted on paper", tokens.inkMuted, tokens.paper],
  ["inkMuted on deep canvas", T.inkSoft, T.canvasDeep],
  ["alabaster on aegean", tokens.alabaster, tokens.aegean],
  ["alabaster on sage", tokens.alabaster, tokens.sage],
  ["alabaster on terracotta", tokens.alabaster, tokens.terracotta],
  ["alabaster on ink", tokens.alabaster, tokens.ink],
  ["alabaster on mental accent", tokens.alabaster, T.mental],
  ["terracotta on paper", tokens.terracotta, tokens.paper],
  ["sage on alabaster", tokens.sage, tokens.alabaster],
  ["aegean on paper", tokens.aegean, tokens.paper],
  ["soft text on aegean", DARK_TEXT.textSoft, tokens.aegean],
  ["faint text on aegean", DARK_TEXT.textFaint, tokens.aegean],
];

describe("WCAG AA — body text (4.5:1)", () => {
  it.each(BODY_PAIRS)("%s", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("WCAG AA — large text (3:1, 24px+)", () => {
  it.each([
    ["terracotta heading on alabaster", tokens.terracotta, tokens.alabaster],
    ["aegean heading on alabaster", tokens.aegean, tokens.alabaster],
  ])("%s", (_name, fg, bg) => {
    expect(meetsAA(fg, bg, { largeText: true })).toBe(true);
  });
});
