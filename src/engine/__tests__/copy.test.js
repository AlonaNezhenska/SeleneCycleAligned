import { describe, it, expect } from "vitest";
import {
  AFFIRMATIONS,
  affirmationFor,
  BLOCKLIST,
  findBlocked,
  triadTip,
  TRIAD_TIPS,
  RATIONALE,
  UI_COPY,
} from "../copy.js";
import { NOTIFICATION_TEMPLATES } from "../notify.js";
import { PHASES } from "../phase.js";

/** Every string reachable from a value, functions called with sample args. */
const strings = (v) => {
  if (typeof v === "string") return [v];
  if (typeof v === "function") return strings(v("Spin", "Zone 2"));
  if (v && typeof v === "object") return Object.values(v).flatMap(strings);
  return [];
};

describe("copy blocklist", () => {
  it("catches each blocked phrase, including curly apostrophes", () => {
    expect(findBlocked("You missed a day")).toContain("missed");
    expect(findBlocked("Don’t forget to log")).toContain("don't forget");
    expect(findBlocked("A calm evening")).toEqual([]);
  });

  it("matches the handoff list exactly", () => {
    expect(BLOCKLIST).toEqual(["missed", "failed", "behind", "should have", "lazy", "don't forget"]);
  });

  it("no engine string contains a blocked phrase or the word fail", () => {
    const all = strings({ AFFIRMATIONS, TRIAD_TIPS, RATIONALE, UI_COPY, NOTIFICATION_TEMPLATES });
    expect(all.length).toBeGreaterThan(30);
    for (const s of all) expect(findBlocked(s), s).toEqual([]);
  });
});

describe("Imprint Zone affirmations", () => {
  it("has a bank for every phase", () => {
    for (const p of PHASES) expect(AFFIRMATIONS[p.key]?.length).toBeGreaterThan(0);
  });

  it("no affirmation contains a digit", () => {
    for (const s of Object.values(AFFIRMATIONS).flat()) expect(s).not.toMatch(/\d/);
  });

  it("picks from the phase's own bank for any seed", () => {
    for (const seed of [0, 1, 7, -3, 1e6]) {
      expect(AFFIRMATIONS.menstrual).toContain(affirmationFor("menstrual", seed));
    }
  });
});

describe("Triad tips", () => {
  it("sugar craving in luteal → dark chocolate and pumpkin seeds", () => {
    const tip = triadTip({ signals: ["sugar"], phase: "earlyLuteal" });
    expect(tip.title).toMatch(/dark chocolate/i);
    expect(tip.body).toMatch(/pumpkin seeds/i);
    expect(tip.body).toMatch(/magnesium/i);
  });

  it("sugar craving outside luteal gets a different tip", () => {
    expect(triadTip({ signals: ["sugar"], phase: "follicular" })).toBe(TRIAD_TIPS.sugar);
  });

  it("Hermit social battery → permission for solitude", () => {
    expect(triadTip({ signals: ["hermit"], phase: "lateLuteal" }).title).toMatch(/solitude/i);
  });

  it("brain fog → lighter load and a walk", () => {
    const tip = triadTip({ signals: ["brain-fog"], phase: "follicular" });
    expect(tip.body).toMatch(/walk/i);
  });

  it("always returns exactly one tip, even with nothing logged", () => {
    expect(triadTip({ signals: [], phase: "menstrual" })).toBe(TRIAD_TIPS.calm);
  });
});
