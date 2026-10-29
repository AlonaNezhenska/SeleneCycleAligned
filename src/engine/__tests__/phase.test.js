import { describe, it, expect } from "vitest";
import { getPhase, clampDay, isLuteal, cycleDay, phaseRange, normalizeLength } from "../phase.js";

describe("getPhase — 28-day reference", () => {
  it.each([
    [1, "menstrual"],
    [5, "menstrual"],
    [6, "follicular"],
    [13, "follicular"],
    [14, "ovulatory"],
    [16, "ovulatory"],
    [17, "earlyLuteal"],
    [25, "earlyLuteal"],
    [26, "lateLuteal"],
    [28, "lateLuteal"],
  ])("day %i is %s", (day, phase) => {
    expect(getPhase(day, 28)).toBe(phase);
  });
});

describe("getPhase — edge cases", () => {
  it("clamps day 0 and negatives to day 1 (menstrual)", () => {
    expect(clampDay(0, 28)).toBe(1);
    expect(getPhase(0, 28)).toBe("menstrual");
    expect(getPhase(-4, 28)).toBe("menstrual");
  });

  it("keeps a late period in late luteal instead of wrapping", () => {
    expect(clampDay(31, 28)).toBe(28);
    expect(getPhase(31, 28)).toBe("lateLuteal");
  });

  it("treats non-numeric days as day 1", () => {
    expect(clampDay(NaN, 28)).toBe(1);
  });

  it("falls back to 28 days for implausible cycle lengths", () => {
    expect(normalizeLength(5)).toBe(28);
    expect(normalizeLength(undefined)).toBe(28);
    expect(normalizeLength(35)).toBe(35);
  });
});

describe("getPhase — 35-day cycle scales proportionally", () => {
  it("starts and ends in the right phases", () => {
    expect(getPhase(1, 35)).toBe("menstrual");
    expect(getPhase(35, 35)).toBe("lateLuteal");
  });

  it("stretches every phase rather than cutting late luteal short", () => {
    expect(phaseRange("menstrual", 35)).toEqual({ start: 1, end: 6 });
    expect(phaseRange("lateLuteal", 35)).toEqual({ start: 32, end: 35 });
  });

  it("covers every day with exactly one phase, in order", () => {
    const seen = Array.from({ length: 35 }, (_, i) => getPhase(i + 1, 35));
    const order = ["menstrual", "follicular", "ovulatory", "earlyLuteal", "lateLuteal"];
    const firstIndex = order.map((p) => seen.indexOf(p));
    expect(firstIndex.every((v) => v >= 0)).toBe(true);
    expect([...firstIndex].sort((a, b) => a - b)).toEqual(firstIndex);
  });
});

describe("isLuteal", () => {
  it("is true only for early and late luteal", () => {
    expect(isLuteal("earlyLuteal")).toBe(true);
    expect(isLuteal("lateLuteal")).toBe(true);
    expect(isLuteal("follicular")).toBe(false);
    expect(isLuteal("ovulatory")).toBe(false);
  });
});

describe("cycleDay", () => {
  it("counts the start date as day 1", () => {
    expect(cycleDay("2026-10-01T09:00", "2026-10-01T23:00")).toBe(1);
    expect(cycleDay("2026-10-01", "2026-10-21")).toBe(21);
  });
});
