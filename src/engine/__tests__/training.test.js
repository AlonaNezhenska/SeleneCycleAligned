import { describe, it, expect } from "vitest";
import { preFlightNudge, shouldOfferBailout, postWorkoutWindow, windowRemaining } from "../training.js";

const at = (h, m = 0) => new Date(2026, 9, 29, h, m);
const MIN = 60 * 1000;

describe("Pre-Flight nudge", () => {
  it("fires for a workout starting before 11:00", () => {
    expect(preFlightNudge(at(6, 30))).toEqual({ proteinGrams: 15 });
    expect(preFlightNudge(at(10, 59))).toEqual({ proteinGrams: 15 });
  });

  it("stays quiet from 11:00 on", () => {
    expect(preFlightNudge(at(11))).toBeNull();
    expect(preFlightNudge(at(18))).toBeNull();
  });
});

describe("Bailout", () => {
  it("fires at ten minutes, not before", () => {
    expect(shouldOfferBailout(9 * MIN + 59 * 1000)).toBe(false);
    expect(shouldOfferBailout(10 * MIN)).toBe(true);
    expect(shouldOfferBailout(25 * MIN)).toBe(true);
  });

  it("fires only once per session", () => {
    expect(shouldOfferBailout(12 * MIN, true)).toBe(false);
  });
});

describe("Post-workout window", () => {
  it("opens for 45 minutes with a 35g+ protein target", () => {
    const w = postWorkoutWindow(at(8));
    expect(w.minutes).toBe(45);
    expect(w.proteinGrams).toBeGreaterThanOrEqual(35);
    expect(w.closesAt - at(8).getTime()).toBe(45 * MIN);
  });

  it("counts down to zero and never goes negative", () => {
    const w = postWorkoutWindow(at(8));
    expect(windowRemaining(w, at(8, 30))).toBe(15 * MIN);
    expect(windowRemaining(w, at(10))).toBe(0);
  });
});
