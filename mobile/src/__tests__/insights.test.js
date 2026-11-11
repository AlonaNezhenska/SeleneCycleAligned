import { cycleInsight, describeCycle } from "../lib/insights";
import { findBlocked } from "../shared";

const day = (kcal, extra = {}) => ({ food: { entries: kcal ? [{ meal: "lunch", fixed: { kcal, protein: extra.protein ?? 0 }, portions: 1 }] : [], treat: extra.treat } });
const all = (d) => [d.headline, d.line, ...d.notes.map((n) => n.text), ...d.working].join(" ");

// cycle began 1 Nov; today is day 9
const profile = { lastPeriod: "2026-11-01", body: { kg: 60, cm: 165, age: 30, aim: "maintain" } };
const TODAY = "2026-11-09";

describe("cycle insight", () => {
  it("follows the cycle, with a phase and a state for every day", () => {
    const m = cycleInsight({ days: { "2026-11-02": day(1850), "2026-11-03": day(1300), "2026-11-04": day(2400) }, todayKey: TODAY, profile, goalKcal: 1850 });
    expect(m.kind).toBe("cycle");
    expect(m.cycleDay).toBe(9);
    expect(m.days).toHaveLength(9);
    expect(m.days[0]).toMatchObject({ date: "2026-11-01", group: "menstruation", state: "none" });
    expect(m.days.slice(1, 4).map((d) => d.state)).toEqual(["around", "lighter", "fuller"]);
    expect(describeCycle(m).kicker).toBe("THIS CYCLE · DAY 9");
  });

  it("leaves treat days out of every average and never shows an allowance", () => {
    const m = cycleInsight({ days: { "2026-11-02": day(1800), "2026-11-03": day(1900, { treat: true }), "2026-11-04": day(1800), "2026-11-05": day(1800) }, todayKey: TODAY, profile, goalKcal: 1850 });
    expect(m.treats).toBe(1);
    expect(m.logged).toBe(3);
    expect(m.avgEaten).toBe(1800);
    const text = all(describeCycle(m));
    expect(text).not.toMatch(/5,?000/);
    expect(text).toMatch(/1 treat day, not counted/);
    expect(findBlocked(text)).toEqual([]);
  });

  it("gives a plain answer, and the working only behind the fold", () => {
    const m = cycleInsight({ days: { "2026-11-02": day(1900), "2026-11-03": day(1900), "2026-11-04": day(1900) }, todayKey: TODAY, profile, goalKcal: 1850 });
    // the body's own energy counts: resting × 1.2 plus movement
    expect(m.avgUsed).toBeGreaterThanOrEqual(m.avgOwn + m.avgMove);
    const d = describeCycle(m);
    expect(d.headline).toBeTruthy();
    expect(d.line).not.toMatch(/\d{2},\d{3}/);
    expect(d.working.join(" ")).toMatch(/just keeping you going/);
  });

  it("names running low gently, whatever the aim", () => {
    const lose = { ...profile, body: { ...profile.body, aim: "lose" } };
    const m = cycleInsight({ days: { "2026-11-02": day(900), "2026-11-03": day(900), "2026-11-04": day(900) }, todayKey: TODAY, profile: lose, goalKcal: 1600 });
    const d = describeCycle(m);
    expect(d.headline).toBe("Your body could use a bit more");
    expect(findBlocked(all(d))).toEqual([]);
  });

  it("calls a gentle deficit on track for a loss aim, in kilos a month", () => {
    const lose = { ...profile, body: { ...profile.body, aim: "lose" } };
    const m = cycleInsight({ days: { "2026-11-02": day(1550), "2026-11-03": day(1550), "2026-11-04": day(1550) }, todayKey: TODAY, profile: lose, goalKcal: 1600 });
    const d = describeCycle(m);
    expect(d.headline).toBe("You're fuelling about right");
    expect(d.line).toMatch(/kg a month/);
  });

  it("notes the luteal phase as expected, and protein on strength days", () => {
    // a 28-day cycle that began 10 Oct: luteal from about day 17 (26 Oct)
    const p = { lastPeriod: "2026-10-10", cycleLength: 28, body: profile.body };
    const days = {
      "2026-10-12": day(1700, { protein: 120 }),
      "2026-10-13": day(1700),
      "2026-10-28": day(2000),
      "2026-10-29": day(2000),
    };
    const workouts = [{ date: "2026-10-12", kind: "strength" }, { date: "2026-10-13", kind: "strength" }];
    const m = cycleInsight({ days, todayKey: "2026-10-30", profile: p, goalKcal: 1850, proteinGoal: 110, workouts });
    expect(m.lutealExtra).toBe(300);
    const text = describeCycle(m).notes.map((n) => n.text).join(" ");
    expect(text).toMatch(/about 300 more a day in your luteal phase/);
    expect(text).toMatch(/1 of 2 strength days/);
  });

  it("takes in the cycle before when this one is only days old", () => {
    const p = { lastPeriod: "2026-11-08", previousPeriod: "2026-10-10", body: profile.body };
    const m = cycleInsight({ days: { "2026-10-20": day(1800) }, todayKey: TODAY, profile: p, goalKcal: 1850 });
    expect(m.kind).toBe("two-cycles");
    expect(m.days[0].date).toBe("2026-10-10");
    expect(m.days.at(-1)).toMatchObject({ cycleDay: 2, group: "menstruation" });
  });

  it("keeps figures out when numbers are hidden, and starts kindly", () => {
    const m = cycleInsight({ days: { "2026-11-02": day(1400), "2026-11-03": day(1400) }, todayKey: TODAY, profile, goalKcal: 1850 });
    expect(all(describeCycle(m, { hidden: true }))).not.toMatch(/kcal|kg/);
    expect(describeCycle(cycleInsight({ days: {}, todayKey: TODAY, profile, goalKcal: 1850 })).headline).toBe("Your picture is just beginning");
  });

  it("uses the last four weeks without a known cycle", () => {
    const m = cycleInsight({ days: {}, todayKey: TODAY, profile: { onBirthControl: true }, goalKcal: 1850 });
    expect(m.kind).toBe("weeks");
    expect(m.days).toHaveLength(28);
  });
});
