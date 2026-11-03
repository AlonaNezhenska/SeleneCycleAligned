import { dayTotals } from "./food";
import { dayMovement, DEFAULT_KG } from "./activity";
import { goalFromBody } from "./energy";

/* ---------------------------------------------------------------
   SMART INSIGHTS — the month as a whole, so one big day is seen in
   proportion. Energy eaten against energy used, how many days were
   close to the goal, and a word on consistency.

   A treat day is counted generously in the month's total eaten, so
   the insight never pretends it away; the figure itself is never shown
   on its own. Words here must pass the copy blocklist.
   --------------------------------------------------------------- */

const TREAT_DAY_KCAL = 5000;
const ON_RHYTHM = { min: 0.8, max: 1.1 };

const pad = (n) => String(n).padStart(2, "0");

/** Every date of the current month up to and including today. */
const monthSoFar = (todayKey) => {
  const [y, m, d] = todayKey.split("-").map(Number);
  return Array.from({ length: d }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
};

/**
 * The month so far. `used` (energy the body used) is only known when
 * the body details are in the profile; without them only movement is.
 */
export const monthInsight = ({ days = {}, todayKey, profile = {}, goalKcal }) => {
  const kg = profile.body?.kg > 0 ? profile.body.kg : DEFAULT_KG;
  const body = profile.body?.kg ? goalFromBody({ ...profile.body, kg: profile.body.kg }) : null;
  const dates = monthSoFar(todayKey);

  let eaten = 0;
  let moved = 0;
  let usedOnLogged = 0;
  let logged = 0;
  let onRhythm = 0;
  let treats = 0;
  for (const date of dates) {
    const day = days[date];
    const move = dayMovement(day, kg);
    moved += move.kcal;
    const food = dayTotals(day).kcal;
    const treat = !!day?.food?.treat;
    if (!food && !treat) continue;
    logged += 1;
    if (treat) treats += 1;
    else if (food >= goalKcal * ON_RHYTHM.min && food <= goalKcal * ON_RHYTHM.max) onRhythm += 1;
    eaten += food + (treat ? TREAT_DAY_KCAL : 0);
    // a quiet day's use (resting × 1.2) plus the movement actually logged
    if (body) usedOnLogged += body.resting * 1.2 + move.kcal;
  }

  const avgEaten = logged ? Math.round(eaten / logged) : 0;
  return {
    daysSoFar: dates.length,
    logged,
    treats,
    onRhythm,
    eaten: Math.round(eaten),
    moved: Math.round(moved),
    used: body ? Math.round(usedOnLogged) : null,
    avgEaten,
    // how the average logged day sits against the goal, as a share
    vsGoal: logged && goalKcal ? avgEaten / goalKcal : null,
  };
};

const fmt = (n) => Math.round(n).toLocaleString("en-GB");

/** The insight in words: a headline and a few lines. Without numbers when hidden. */
export const describeMonth = (m, { hidden = false } = {}) => {
  if (!m.logged) {
    return { headline: "Your month is just beginning", lines: ["Log a few days of food and movement and your monthly picture will appear here."] };
  }
  const steady = m.onRhythm + m.treats >= Math.ceil(m.logged * 0.6);
  const headline = steady ? "A steady month" : "Every logged day counts";
  const lines = [];

  if (hidden) {
    lines.push(`You logged food on ${m.logged} of ${m.daysSoFar} days and moved on many of them.`);
  } else {
    lines.push(`You ate about ${fmt(m.eaten)} kcal over ${m.logged} logged days, and burned about ${fmt(m.moved)} kcal through movement and steps.`);
    if (m.used != null) {
      const diff = Math.round((m.eaten - m.used) / m.logged);
      lines.push(
        Math.abs(diff) < 100
          ? "On the days you logged, you ate about what your body used. Beautifully balanced."
          : `On the days you logged, you ate about ${fmt(Math.abs(diff))} kcal a day ${diff < 0 ? "less" : "more"} than your body used.`
      );
    }
  }

  if (m.treats) {
    lines.push(
      `${m.treats === 1 ? "Your treat day is" : `Your ${m.treats} treat days are`} part of the picture, and the month as a whole still holds its shape. Consistency is what matters, not any single day.`
    );
  } else if (m.onRhythm) {
    lines.push(`${m.onRhythm} ${m.onRhythm === 1 ? "day was" : "days were"} close to your goal. That steady rhythm is what makes the difference.`);
  } else {
    lines.push("Each day you log builds the picture. Consistency matters more than any single day.");
  }
  return { headline, lines };
};
