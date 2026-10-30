import { getPhase, prescribe, deriveToday, tokens, contrastRatio } from "../shared";

describe("shared engine", () => {
  it("is the same engine the web app uses", () => {
    expect(getPhase(21, 28)).toBe("earlyLuteal");
    expect(prescribe({ mode: "Inward" }).kind).toBe("rest");
    expect(contrastRatio(tokens.ink, tokens.alabaster)).toBeGreaterThan(4.5);
  });

  it("derives today from a profile", () => {
    const now = new Date(2026, 9, 29);
    const ctx = deriveToday({
      profile: { lastPeriod: "2026-10-09", cycleLength: 28, onBirthControl: false, ageGroup: "20s/30s" },
      today: { vibe: null, checkIn: {}, cardio: null },
      now,
    });
    expect(ctx.day).toBe(21);
    expect(ctx.buffer).toEqual({ min: 150, max: 300, optional: true });
  });
});
