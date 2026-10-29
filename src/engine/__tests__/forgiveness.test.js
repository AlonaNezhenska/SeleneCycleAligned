import { describe, it, expect } from "vitest";
import { dayStatus, streak, timeline, isHighSymptom, STATUS } from "../forgiveness.js";

describe("Forgiveness Engine", () => {
  it("prescribed rest taken in a high-symptom window earns the same check as a lift", () => {
    const signals = ["flow-heavy", "cramps"];
    expect(isHighSymptom(signals)).toBe(true);
    const rest = { prescribed: "rest", completed: true, highSymptom: true };
    const lift = { prescribed: "strength", completed: true };
    expect(dayStatus(rest)).toBe(STATUS.DONE);
    expect(dayStatus(rest)).toBe(dayStatus(lift));
  });

  it("missing data creates a paused entry", () => {
    expect(dayStatus(null)).toBe(STATUS.PAUSED);
    expect(dayStatus(undefined)).toBe(STATUS.PAUSED);
    expect(dayStatus({ prescribed: "strength" })).toBe(STATUS.PAUSED);
  });

  it("an incomplete day is paused, never a failure", () => {
    expect(dayStatus({ prescribed: "strength", completed: false })).toBe(STATUS.PAUSED);
    expect(Object.values(STATUS)).toEqual(["done", "paused"]);
  });

  it("the streak never breaks on paused days", () => {
    const done = { prescribed: "strength", completed: true };
    expect(streak([done, done, null, done])).toBe(3);
    expect(streak([done, null, null, null, done])).toBe(2);
    expect(timeline([done, null])).toEqual(["done", "paused"]);
  });

  it("an empty history is a zero streak, not an error", () => {
    expect(streak([])).toBe(0);
    expect(streak()).toBe(0);
  });
});

describe("isHighSymptom", () => {
  it.each([
    [["flow-heavy"], true],
    [["clots"], true],
    [["exhaustion"], true],
    [["cramps", "fatigue"], true],
    [["cramps", "bloating"], true],
    [["cramps"], false],
    [["brain-fog", "sugar"], false],
    [[], false],
  ])("%j → %s", (signals, expected) => {
    expect(isHighSymptom(signals)).toBe(expected);
  });
});
