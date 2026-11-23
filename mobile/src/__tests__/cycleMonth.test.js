import { projectedDay, ovulationDay, monthDays, describeJournal, PHASE_TINT, periodEnd, periodOngoingOn } from "../lib/cycleMonth";

const profile = { lastPeriod: "2026-10-09", periodLength: 5 };
const october = (extra = {}) => monthDays({ year: 2026, month: 9, profile, days: {}, todayIso: "2026-10-29", length: 28, ...extra });

describe("cycle days on the calendar", () => {
  it("counts from the last period and repeats the usual length both ways", () => {
    expect(projectedDay("2026-10-09", "2026-10-09", 28)).toBe(1);
    expect(projectedDay("2026-10-09", "2026-10-29", 28)).toBe(21);
    expect(projectedDay("2026-10-09", "2026-11-06", 28)).toBe(1);
    expect(projectedDay("2026-10-09", "2026-10-08", 28)).toBe(28);
  });

  it("puts ovulation about 14 days before the next period", () => {
    expect(ovulationDay(28)).toBe(14);
    expect(ovulationDay(35)).toBe(21);
    const m = october();
    expect(m["2026-10-22"].ovulation).toBe(true);
    expect(Object.values(m).filter((d) => d.ovulation)).toHaveLength(1);
  });

  it("tints every date with its phase", () => {
    const m = october();
    expect(m["2026-10-09"].group).toBe("menstruation");
    expect(m["2026-10-16"].group).toBe("follicular");
    expect(m["2026-10-23"].group).toBe("ovulation");
    expect(m["2026-10-29"].group).toBe("luteal");
    expect(Object.keys(PHASE_TINT)).toEqual(["menstruation", "follicular", "ovulation", "luteal"]);
  });

  it("marks the recorded period and logged bleeding, and the likely next period", () => {
    const m = october({ days: { "2026-10-20": { journal: { flow: { choices: { level: "spotting" } } } } } });
    expect(["09", "10", "11", "12", "13"].every((d) => m[`2026-10-${d}`].period)).toBe(true);
    expect(m["2026-10-14"].period).toBe(false);
    expect(m["2026-10-20"].period).toBe(true);
    const nov = monthDays({ year: 2026, month: 10, profile, days: {}, todayIso: "2026-10-29", length: 28 });
    expect(nov["2026-11-06"].expectedPeriod).toBe(true);
    expect(nov["2026-11-15"].expectedPeriod).toBe(false);
  });

  it("leaves phases off when the last period is unknown", () => {
    const m = october({ profile: {} });
    expect(m["2026-10-09"]).toMatchObject({ group: null, period: false, ovulation: false });
  });
});

describe("reading back a logged day", () => {
  it("lists what was logged with intensity in words", () => {
    const out = describeJournal({
      physical: { items: { cramps: { intensity: 4, note: "worse at night" }, bloating: { intensity: 1 } } },
      flow: { choices: { level: "medium" }, items: { between: { date: "2026-10-20" } } },
      supplements: { entries: [{ id: "a", name: "Magnesium", dosage: "200 mg" }] },
    });
    expect(out.map((c) => c.title)).toEqual(["Physical", "Flow & cycle changes", "Supplements"]);
    expect(out[0].lines).toEqual(["Cramps · intense — worse at night", "Bloating · very mild"]);
    expect(out[1].lines).toEqual(["Flow today: Medium", "Spotting between periods"]);
    expect(out[2].lines).toEqual(["Magnesium · 200 mg"]);
    expect(describeJournal(undefined)).toEqual([]);
  });
});

describe("a period ends by itself", () => {
  const profile = { lastPeriod: "2026-11-06", periodOngoing: true, periodLength: 5 };

  it("stops after her usual length when no end was logged", () => {
    expect(periodEnd(profile, {}, "2026-11-20")).toBe("2026-11-10");
    expect(periodOngoingOn(profile, {}, "2026-11-08")).toBe(true);
    expect(periodOngoingOn(profile, {}, "2026-11-20")).toBe(false);
    const month = monthDays({ year: 2026, month: 10, profile, days: {}, todayIso: "2026-11-20", length: 28 });
    expect(month["2026-11-10"].period).toBe(true);
    expect(month["2026-11-14"].period).toBe(false);
  });

  it("stretches to flow logged later, and a logged end wins", () => {
    const days = { "2026-11-12": { journal: { flow: { choices: { level: "light" } } } } };
    expect(periodEnd(profile, days, "2026-11-20")).toBe("2026-11-12");
    expect(periodEnd({ ...profile, lastPeriodEnd: "2026-11-09" }, days, "2026-11-20")).toBe("2026-11-09");
  });
});
