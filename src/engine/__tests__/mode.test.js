import { describe, it, expect } from "vitest";
import { resolveMode, lateLutealFork, MODES } from "../mode.js";

describe("resolveMode — vibe always wins", () => {
  it.each(MODES)("a logged %s vibe overrides the calendar", (vibe) => {
    for (const day of [1, 10, 15, 20, 27]) {
      expect(resolveMode({ vibe, day, length: 28 })).toMatchObject({ mode: vibe, source: "vibe" });
    }
  });

  it("vibe also wins on birth control", () => {
    expect(resolveMode({ vibe: "Outward", day: 2, length: 28, onBirthControl: true }).mode).toBe("Outward");
  });

  it("ignores an unknown vibe value", () => {
    expect(resolveMode({ vibe: "Sideways", day: 2, length: 28 }).source).toBe("calendar");
  });
});

describe("resolveMode — calendar defaults", () => {
  it.each([
    [3, "Inward"], // menstrual
    [9, "Outward"], // follicular
    [15, "Outward"], // ovulatory
    [20, "Steady"], // early luteal
    [27, "Inward"], // late luteal
  ])("day %i → %s", (day, mode) => {
    expect(resolveMode({ day, length: 28 })).toMatchObject({ mode, source: "calendar" });
  });
});

describe("resolveMode — hormonal birth control", () => {
  it("disables calendar logic and defaults to Steady with a Vibe Check prompt", () => {
    for (const day of [2, 9, 15, 27]) {
      expect(resolveMode({ day, length: 28, onBirthControl: true })).toEqual({
        mode: "Steady",
        source: "default",
        promptVibeCheck: true,
      });
    }
  });

  it("does not offer the Late Luteal Fork", () => {
    expect(lateLutealFork({ day: 27, length: 28, onBirthControl: true })).toBeNull();
  });
});

describe("Late Luteal Fork", () => {
  it("only appears on days 26–28", () => {
    expect(lateLutealFork({ day: 25, length: 28 })).toBeNull();
    expect(lateLutealFork({ day: 26, length: 28 })).toEqual({ expanded: true, path: null });
    expect(lateLutealFork({ day: 28, length: 28 })).toEqual({ expanded: true, path: null });
  });

  it("routes Hermit or low drive to the wipeout path", () => {
    expect(lateLutealFork({ day: 27, length: 28, checkIn: { social: "hermit", drive: "high" } }).path).toBe("wipeout");
    expect(lateLutealFork({ day: 27, length: 28, checkIn: { social: "butterfly", drive: "low" } }).path).toBe("wipeout");
  });

  it("routes social capacity with drive to the surge path", () => {
    expect(lateLutealFork({ day: 27, length: 28, checkIn: { social: "neutral", drive: "high" } }).path).toBe("surge");
  });

  it("feeds the chosen path into mode resolution", () => {
    expect(resolveMode({ day: 27, length: 28, checkIn: { social: "hermit", drive: "low" } })).toMatchObject({
      mode: "Inward",
      source: "fork",
    });
    expect(resolveMode({ day: 27, length: 28, checkIn: { social: "butterfly", drive: "high" } })).toMatchObject({
      mode: "Outward",
      source: "fork",
    });
  });

  it("scales to a 35-day cycle", () => {
    expect(lateLutealFork({ day: 34, length: 35 })).not.toBeNull();
    expect(lateLutealFork({ day: 28, length: 35 })).toBeNull();
  });
});
