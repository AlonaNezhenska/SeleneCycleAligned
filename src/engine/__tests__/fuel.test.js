import { describe, it, expect } from "vitest";
import { lutealBuffer, applyBuffer, maskValue, LUTEAL_BUFFER, MASK } from "../fuel.js";

describe("Luteal Buffer", () => {
  it("is offered on every luteal day (17–28) of a 28-day cycle", () => {
    for (let day = 17; day <= 28; day++) {
      expect(lutealBuffer({ day, length: 28 })).toEqual({ min: 150, max: 300, optional: true });
    }
  });

  it("is hidden before the luteal phase", () => {
    for (let day = 1; day <= 16; day++) expect(lutealBuffer({ day, length: 28 })).toBeNull();
  });

  it("is hidden on hormonal birth control", () => {
    expect(lutealBuffer({ day: 22, length: 28, onBirthControl: true })).toBeNull();
  });

  it("returns a fresh copy so callers cannot mutate the constant", () => {
    const b = lutealBuffer({ day: 22, length: 28 });
    b.min = 0;
    expect(LUTEAL_BUFFER.min).toBe(150);
  });

  it("is never auto-applied to targets", () => {
    const b = lutealBuffer({ day: 22, length: 28 });
    expect(applyBuffer(1800, b)).toEqual({ base: 1800, min: 1800, max: 1800 });
    expect(applyBuffer(1800, b, "yes")).toEqual({ base: 1800, min: 1800, max: 1800 });
  });

  it("only widens the range once the user accepts", () => {
    const b = lutealBuffer({ day: 22, length: 28 });
    expect(applyBuffer(1800, b, true)).toEqual({ base: 1800, min: 1950, max: 2100 });
  });
});

describe("maskValue", () => {
  it("masks as •• when hidden", () => {
    expect(maskValue("1,850 kcal", true)).toBe(MASK);
    expect(MASK).toBe("••");
  });

  it("shows the value when not hidden", () => {
    expect(maskValue(42, false)).toBe("42");
  });
});
