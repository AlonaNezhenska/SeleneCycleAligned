import { describe, it, expect } from "vitest";
import {
  daysBetween,
  addDays,
  estimateCycleLength,
  periodLengthFromDates,
  resolveCycleLength,
  resolvePeriodLength,
  nextPeriodStart,
} from "../cycleInfo.js";

describe("date maths", () => {
  it("counts whole calendar days, across month ends", () => {
    expect(daysBetween("2026-09-28", "2026-10-26")).toBe(28);
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});

describe("estimateCycleLength", () => {
  it("measures start to start", () => {
    expect(estimateCycleLength("2026-09-01", "2026-09-30")).toBe(29);
  });

  it("refuses implausible gaps instead of guessing", () => {
    expect(estimateCycleLength("2026-09-20", "2026-09-30")).toBeNull();
    expect(estimateCycleLength("2026-06-01", "2026-09-30")).toBeNull();
    expect(estimateCycleLength(null, "2026-09-30")).toBeNull();
  });
});

describe("periodLengthFromDates", () => {
  it("counts both the first and the last day", () => {
    expect(periodLengthFromDates("2026-10-06", "2026-10-10")).toBe(5);
    expect(periodLengthFromDates("2026-10-06", "2026-10-06")).toBe(1);
  });

  it("ignores an end before the start or a missing end", () => {
    expect(periodLengthFromDates("2026-10-06", "2026-10-01")).toBeNull();
    expect(periodLengthFromDates("2026-10-06", null)).toBeNull();
  });
});

describe("resolveCycleLength", () => {
  it("uses the middle of a varying range first", () => {
    expect(resolveCycleLength({ cycleVaries: true, cycleLengthMin: 26, cycleLengthMax: 32, cycleLength: 40 })).toEqual({
      length: 29,
      source: "range",
    });
  });

  it("then a typed length", () => {
    expect(resolveCycleLength({ cycleLength: 31 })).toEqual({ length: 31, source: "entered" });
  });

  it("then an estimate from the last two period starts", () => {
    expect(resolveCycleLength({ cycleLength: null, previousPeriod: "2026-09-01", lastPeriod: "2026-09-30" })).toEqual({
      length: 29,
      source: "estimated",
    });
  });

  it("falls back to 28 days when nothing is known", () => {
    expect(resolveCycleLength({})).toEqual({ length: 28, source: "default" });
  });
});

describe("resolvePeriodLength", () => {
  it("prefers the logged dates", () => {
    expect(resolvePeriodLength({ lastPeriod: "2026-10-06", lastPeriodEnd: "2026-10-09", periodLength: 7 })).toEqual({
      length: 4,
      source: "dates",
    });
  });

  it("supports a varying range and an unknown length", () => {
    expect(resolvePeriodLength({ periodVaries: true, periodLengthMin: 3, periodLengthMax: 7 }).length).toBe(5);
    expect(resolvePeriodLength({})).toEqual({ length: null, source: "unknown" });
  });
});

describe("nextPeriodStart", () => {
  it("adds the resolved cycle length to the last start", () => {
    expect(nextPeriodStart({ lastPeriod: "2026-10-06", cycleLength: 30 })).toBe("2026-11-05");
  });

  it("is unknown without a last start", () => {
    expect(nextPeriodStart({ cycleLength: 30 })).toBeNull();
  });
});
