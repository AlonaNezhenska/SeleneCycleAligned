import { describe, it, expect } from "vitest";
import { prescribe, normalizeCardio, ALLOWED_CARDIO } from "../prescribe.js";

describe("prescribe — mode to session", () => {
  it("Inward is rest, mobility or a Chill Zone 2 walk", () => {
    const p = prescribe({ mode: "Inward" });
    expect(p.kind).toBe("rest");
    expect(p.options.join(" ")).toMatch(/Rest/);
    expect(p.options.join(" ")).toMatch(/Mobility/);
    expect(p.options.join(" ")).toMatch(/Zone 2 walk/);
    expect(p.strength).toBeNull();
  });

  it("Steady is baseline strength", () => {
    expect(prescribe({ mode: "Steady" })).toMatchObject({ kind: "strength", load: "baseline" });
  });

  it("Outward is heavy strength or SIT", () => {
    const p = prescribe({ mode: "Outward" });
    expect(p).toMatchObject({ kind: "strength", load: "heavy" });
    expect(p.cardio.cardio).toBe("sit");
  });

  it("falls back to Steady for an unknown mode", () => {
    expect(prescribe({ mode: undefined }).mode).toBe("Steady");
  });
});

describe("Age Fork", () => {
  it("20s/30s take strength sets to failure", () => {
    const p = prescribe({ mode: "Outward", ageGroup: "20s/30s" });
    expect(p.strength).toEqual({ toFailure: true, rir: null });
    expect(p.plyometrics).toBe(false);
  });

  it("40+ keep 2–3 reps in reserve with mandatory plyometrics on training days", () => {
    for (const mode of ["Steady", "Outward"]) {
      const p = prescribe({ mode, ageGroup: "40+" });
      expect(p.strength).toEqual({ toFailure: false, rir: { min: 2, max: 3 } });
      expect(p.plyometrics).toBe(true);
    }
  });

  it("40+ on an Inward day gets no plyometrics on rest", () => {
    const p = prescribe({ mode: "Inward", ageGroup: "40+" });
    expect(p.plyometrics).toBe(false);
    expect(p.strength).toBeNull();
  });
});

describe("Polarized cardio", () => {
  it("only allows zone2 or sit", () => {
    expect(ALLOWED_CARDIO).toEqual(["zone2", "sit"]);
  });

  it("replaces spin with SIT on an Outward day", () => {
    expect(normalizeCardio("spin", "Outward")).toEqual({ cardio: "sit", replaced: true, requested: "spin" });
    expect(prescribe({ mode: "Outward", cardio: "spin" }).cardio.cardio).toBe("sit");
  });

  it.each(["Inward", "Steady"])("replaces spin with Zone 2 on a %s day", (mode) => {
    expect(normalizeCardio("spin", mode)).toMatchObject({ cardio: "zone2", replaced: true });
  });

  it("keeps an allowed choice untouched", () => {
    expect(normalizeCardio("zone2", "Outward")).toMatchObject({ cardio: "zone2", replaced: false });
    expect(normalizeCardio("sit", "Steady")).toMatchObject({ cardio: "sit", replaced: false });
  });

  it("never lets SIT onto a rest day", () => {
    expect(normalizeCardio("sit", "Inward")).toMatchObject({ cardio: "zone2", replaced: true });
  });
});
