import { getPhase, prescribe, deriveToday, tokens, contrastRatio, composite, DARK_TEXT } from "../shared";

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

describe("photo backgrounds stay readable", () => {
  // lightest patch of the moss photo, under the Tracker's dark scrim
  const mossUnderScrim = (() => {
    const { r, g, b } = composite("rgba(10,18,12,0.55)", "#807F2B");
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  })();

  it("light text on the Tracker's moss clears 4.5:1", () => {
    expect(contrastRatio(DARK_TEXT.text, mossUnderScrim)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DARK_TEXT.textSoft, mossUnderScrim)).toBeGreaterThanOrEqual(4.5);
  });
});
