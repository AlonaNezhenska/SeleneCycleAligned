import { dayTotals } from "./food";
import { dayMovement, DEFAULT_KG } from "./activity";

/* ---------------------------------------------------------------
   JOURNEY — the last days or weeks at a glance: food eaten, energy
   burned, minutes of exercise, yoga and meditation, and steps.
   Pure functions over the saved days.
   --------------------------------------------------------------- */

const shift = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const x = new Date(y, m - 1, d + n, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/** One summary per day, oldest first, ending today. */
export const journeyDays = (days = {}, todayKey, n = 7, kg = DEFAULT_KG) =>
  Array.from({ length: n }, (_, i) => {
    const date = shift(todayKey, i - (n - 1));
    const day = days[date];
    const eaten = dayTotals(day);
    const move = dayMovement(day, kg);
    return {
      date,
      eaten: eaten.kcal,
      protein: eaten.protein,
      logged: (day?.food?.entries ?? []).length > 0,
      burned: move.kcal,
      exercise: move.minutes.exercise,
      yoga: move.minutes.yoga,
      meditation: move.minutes.meditation,
      steps: move.steps,
    };
  });

/** The same, added up week by week, oldest first. */
export const journeyWeeks = (days, todayKey, weeks = 4, kg = DEFAULT_KG) => {
  const all = journeyDays(days, todayKey, weeks * 7, kg);
  return Array.from({ length: weeks }, (_, w) => {
    const part = all.slice(w * 7, w * 7 + 7);
    const sum = (k) => part.reduce((t, d) => t + d[k], 0);
    const loggedDays = part.filter((d) => d.logged);
    return {
      date: part[0].date,
      // food is averaged over the days something was logged, so a blank day doesn't drag it down
      eaten: loggedDays.length ? Math.round(loggedDays.reduce((t, d) => t + d.eaten, 0) / loggedDays.length) : 0,
      logged: loggedDays.length > 0,
      burned: sum("burned"),
      exercise: sum("exercise"),
      yoga: sum("yoga"),
      meditation: sum("meditation"),
      steps: Math.round(sum("steps") / 7),
    };
  });
};

/** Totals for a summary line. */
export const totals = (rows) => ({
  exercise: rows.reduce((t, r) => t + r.exercise, 0),
  yoga: rows.reduce((t, r) => t + r.yoga, 0),
  meditation: rows.reduce((t, r) => t + r.meditation, 0),
  burned: rows.reduce((t, r) => t + r.burned, 0),
  steps: rows.length ? Math.round(rows.reduce((t, r) => t + r.steps, 0) / rows.length) : 0,
});
