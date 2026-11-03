import { monthInsight, describeMonth } from "../lib/insights";
import { findBlocked } from "../shared";

const day = (kcal, extra = {}) => ({ food: { entries: kcal ? [{ meal: "lunch", fixed: { kcal }, portions: 1 }] : [], ...extra } });

describe("monthly insight", () => {
  const days = {
    "2026-11-01": day(1800),
    "2026-11-02": day(1900, { treat: true }),
    "2026-11-03": { ...day(1700), activities: [{ id: "a", kind: "yoga", minutes: 30 }], steps: 8000 },
  };

  it("adds the month up and counts a treat day generously", () => {
    const m = monthInsight({ days, todayKey: "2026-11-03", goalKcal: 1850 });
    expect(m).toMatchObject({ daysSoFar: 3, logged: 3, treats: 1, onRhythm: 2, used: null });
    // a treat day adds a large allowance on top of what was logged
    expect(m.eaten).toBe(1800 + 1900 + 1700 + 5000);
    expect(m.moved).toBeGreaterThan(0);
  });

  it("never shows the treat allowance itself, and speaks of consistency", () => {
    const m = monthInsight({ days, todayKey: "2026-11-03", goalKcal: 1850 });
    const text = describeMonth(m).lines.join(" ");
    expect(text).not.toMatch(/5,?000/);
    expect(text).toMatch(/Consistency is what matters/);
    expect(findBlocked(text)).toEqual([]);
  });

  it("compares with what the body used when body details are known", () => {
    const profile = { body: { kg: 60, cm: 165, age: 30 } };
    const m = monthInsight({ days: { "2026-11-01": day(1200) }, todayKey: "2026-11-01", goalKcal: 1850, profile });
    expect(m.used).toBeGreaterThan(1200);
    expect(describeMonth(m).lines.join(" ")).toMatch(/kcal a day less than your body used/);
  });

  it("keeps figures out when numbers are hidden", () => {
    const m = monthInsight({ days, todayKey: "2026-11-03", goalKcal: 1850 });
    expect(describeMonth(m, { hidden: true }).lines.join(" ")).not.toMatch(/kcal/);
    expect(describeMonth(monthInsight({ days: {}, todayKey: "2026-11-03", goalKcal: 1850 })).headline).toBe("Your month is just beginning");
  });
});
