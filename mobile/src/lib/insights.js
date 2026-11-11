import { dayTotals } from "./food";
import { dayMovement, DEFAULT_KG } from "./activity";
import { goalFromBody, ageFromGroup } from "./energy";
import { addDays, daysBetween, groupForDay, resolveCycleLength } from "../shared";

/* ---------------------------------------------------------------
   SMART INSIGHTS — this cycle as a whole, worked out for her, so she
   never has to do sums in her head.

   One plain answer first (is she fuelling about right for her aim?),
   then a picture (her average day against what her body used, and a
   dot for each day of the cycle, by phase), then what it means for
   her aim, a word on her luteal phase, and protein on strength days.
   The working-out sits behind "How we worked this out".

   Treat days are shown as a flower and left out of every average:
   they are part of a normal life, not a number to make up for.
   Under-eating is never praised: running low is named gently, as
   something her body would like more of. Words must pass the blocklist.
   --------------------------------------------------------------- */

/** Within this share of the daily goal, a day reads as "about right". */
const AROUND = 0.1;
/** Roughly the energy in a kilo of body weight. */
const KCAL_PER_KG = 7700;
const MAX_WINDOW = 45;

/** A woman of typical height and weight, for when no body details are saved. */
const TYPICAL = { kg: DEFAULT_KG, cm: 165 };

const range = (from, to) => Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i));

/** Which days the insight looks at: this cycle, or the last four weeks without one. */
const windowOf = (profile, todayKey, days) => {
  const start = profile.lastPeriod;
  if (!start || profile.onBirthControl || start > todayKey || daysBetween(start, todayKey) >= MAX_WINDOW) {
    return { kind: "weeks", from: addDays(todayKey, -27), start: null };
  }
  const loggedIn = (from) => range(from, todayKey).filter((d) => days[d] && (dayTotals(days[d]).kcal || days[d].food?.treat)).length;
  // a cycle only a few days old says little: take in the one before it too
  if (loggedIn(start) < 3) {
    const prev = profile.previousPeriod && profile.previousPeriod < start ? profile.previousPeriod : addDays(start, -resolveCycleLength(profile).length);
    return { kind: "two-cycles", from: prev, start, prev };
  }
  return { kind: "cycle", from: start, start };
};

/**
 * The cycle so far, worked out. Each logged day is compared with her
 * daily goal; the average day with what her body used (resting × 1.2 for
 * an ordinary day, plus the movement she logged).
 */
export const cycleInsight = ({ days = {}, todayKey, profile = {}, goalKcal, proteinGoal = 0, workouts = [] }) => {
  const kg = profile.body?.kg > 0 ? profile.body.kg : DEFAULT_KG;
  const saved = profile.body?.kg ? goalFromBody({ ...profile.body, kg: profile.body.kg }) : null;
  const body = saved ?? goalFromBody({ ...TYPICAL, age: ageFromGroup(profile.ageGroup) });
  const own = Math.round(body.resting * 1.2);
  // her usual activity already counts in a day's use; logged movement adds only when it goes beyond it
  const usual = body.daily;
  const length = resolveCycleLength(profile).length;
  const win = windowOf(profile, todayKey, days);

  const strengthDays = new Set(workouts.filter((w) => w.kind !== "yoga" && w.date).map((w) => w.date));

  const list = range(win.from, todayKey).map((date) => {
    const day = days[date];
    const food = dayTotals(day);
    const treat = !!day?.food?.treat;
    const move = dayMovement(day, kg).kcal;
    // which cycle the day belongs to, for its phase
    const anchor = win.start && date >= win.start ? win.start : win.prev ?? null;
    const cycleDay = anchor ? daysBetween(anchor, date) + 1 : null;
    const group = cycleDay && cycleDay <= length ? groupForDay(cycleDay, length).key : cycleDay ? "luteal" : null;
    let state = "none";
    if (treat) state = "treat";
    else if (food.kcal > 0) state = food.kcal < goalKcal * (1 - AROUND) ? "lighter" : food.kcal > goalKcal * (1 + AROUND) ? "fuller" : "around";
    return { date, cycleDay, group, state, eaten: food.kcal, protein: food.protein, used: Math.max(own + move, usual), move, strength: strengthDays.has(date) };
  });

  const counted = list.filter((d) => d.state !== "none" && d.state !== "treat");
  const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const avgEaten = avg(counted.map((d) => d.eaten));
  const avgUsed = avg(counted.map((d) => d.used));
  const avgMove = avg(counted.map((d) => d.move));

  // how the luteal days compare with the rest, once there are a few of each
  const phaseAvg = (keys) => {
    const xs = counted.filter((d) => keys.includes(d.group)).map((d) => d.eaten);
    return xs.length >= 2 ? avg(xs) : null;
  };
  const luteal = phaseAvg(["luteal"]);
  const rest = phaseAvg(["menstruation", "follicular", "ovulation"]);

  const strengthFed = counted.filter((d) => d.strength);
  return {
    kind: win.kind,
    cycleDay: win.start ? daysBetween(win.start, todayKey) + 1 : null,
    days: list,
    logged: counted.length,
    treats: list.filter((d) => d.state === "treat").length,
    avgEaten,
    avgUsed,
    avgOwn: own,
    avgMove,
    resting: Math.round(body.resting),
    balance: counted.length ? avgEaten - avgUsed : 0,
    goalKcal,
    aim: profile.body?.aim ?? "maintain",
    estimated: !saved,
    lutealExtra: luteal != null && rest != null ? luteal - rest : null,
    strength: strengthFed.length,
    strengthProtein: proteinGoal ? strengthFed.filter((d) => d.protein >= proteinGoal * 0.8).length : null,
  };
};

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const kgMonth = (balance) => Math.round(((Math.abs(balance) * 30) / KCAL_PER_KG) * 10) / 10;

/** What the balance means over a month, for her aim. */
const meaning = (m, hidden) => {
  const b = m.balance;
  if (Math.abs(b) < 100) return "You ate about what your body used, so your weight should hold steady.";
  if (hidden) return b < 0 ? "A little under what your body used, a gentle pace." : "A little over what your body used, which adds up slowly.";
  return `That's about ${fmt(Math.abs(b))} kcal a day ${b < 0 ? "under" : "over"} what your body used, or about ${kgMonth(b)} kg a month ${b < 0 ? "down" : "up"}.`;
};

/**
 * The verdict: her average day against her own daily goal (the same
 * yardstick as the dots and the soft band), then what that means.
 */
const verdict = (m, hidden) => {
  // whatever the aim, eating below what the body needs just to rest comes first
  if (m.avgEaten < m.resting) {
    return { tone: "low", headline: "Your body could use a bit more", line: "You've been eating less than your body needs just to rest. More fuel, especially on training days, will help your energy and your cycle." };
  }
  const off = (m.avgEaten - m.goalKcal) / m.goalKcal;
  const gap = hidden ? "" : ` (about ${fmt(Math.abs(m.avgEaten - m.goalKcal))} kcal a day)`;
  if (Math.abs(off) <= AROUND) {
    const aimWord = { lose: "a gentle loss", gain: "building", maintain: "staying as you are" }[m.aim] ?? "your aim";
    return { tone: "good", headline: "You're fuelling about right", line: `Right where you want to be for ${aimWord}. ${meaning(m, hidden)}` };
  }
  if (off < 0) {
    return {
      tone: "low",
      headline: "Running a little under your goal",
      line: `A bit less than you planned${gap}. ${m.aim === "lose" ? "A slower pace keeps your energy and strength." : "A little more would keep you steady."} ${meaning(m, hidden)}`,
    };
  }
  return { tone: "steady", headline: "A little above your goal", line: `A bit more than you planned${gap}. ${meaning(m, hidden)} Nothing to fix today; it's the pattern that counts.` };
};

/** The insight in words. Without figures when numbers are hidden. */
export const describeCycle = (m, { hidden = false } = {}) => {
  const kicker = m.kind === "cycle" ? `THIS CYCLE · DAY ${m.cycleDay}` : m.kind === "two-cycles" ? "YOUR LAST CYCLE AND THIS ONE" : "THE LAST 4 WEEKS";
  if (!m.logged) {
    return {
      kicker,
      headline: m.treats ? "Enjoy your treat days" : "Your picture is just beginning",
      line: "Log a few days of food and your cycle's picture will appear here.",
      notes: [],
      working: [],
    };
  }
  const v = verdict(m, hidden);
  const notes = [];
  if (m.lutealExtra != null && m.lutealExtra >= 100) {
    notes.push({ kind: "luteal", text: hidden ? "You ate more in your luteal phase. That's your body asking for it, and it's expected." : `You ate about ${fmt(m.lutealExtra)} more a day in your luteal phase. That's your body asking for it, and it's expected.` });
  }
  if (m.strength && m.strengthProtein != null) {
    notes.push({
      kind: "protein",
      text: m.strengthProtein === m.strength
        ? `Protein was there on every strength day. That's what your muscles build from.`
        : `Protein reached your goal on ${m.strengthProtein} of ${m.strength} strength ${m.strength === 1 ? "day" : "days"}. A protein-rich meal after training helps you recover.`,
    });
  }
  if (m.treats) notes.push({ kind: "treat", text: `${m.treats === 1 ? "1 treat day" : `${m.treats} treat days`}, not counted in any of this. They're part of a normal life.` });

  const working = hidden
    ? [`Based on ${m.logged} logged ${m.logged === 1 ? "day" : "days"}. Turn numbers back on in Profile to see the working.`]
    : [
        `On an average logged day your body used about ${fmt(m.avgUsed)} kcal: ${fmt(m.avgOwn)} just keeping you going, and ${fmt(m.avgUsed - m.avgOwn)} through your usual activity, movement and steps.`,
        `You ate about ${fmt(m.avgEaten)} kcal on an average logged day. Your daily goal is ${fmt(m.goalKcal)}.`,
        `Based on ${m.logged} logged ${m.logged === 1 ? "day" : "days"}; days you didn't log are simply left out.`,
        ...(m.estimated ? ["What your body uses is estimated for a typical body. Add your height and weight in Your goals for a closer figure."] : []),
      ];
  return { kicker, headline: v.headline, line: v.line, tone: v.tone, notes, working };
};
