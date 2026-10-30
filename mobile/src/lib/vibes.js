/* ---------------------------------------------------------------
   WEEKLY VIBES — what fills the mood bubble.
   A week runs Monday to Sunday. Only vibes the user chose count;
   a day the calendar guessed is not something she felt.
   --------------------------------------------------------------- */

export const VIBE_COLORS = {
  Inward: "#4A6E9A", // blue — rest, the marble
  Steady: "#E79BB2", // pink — balance
  Outward: "#5F8F4E", // green — energy, the spiral
};

export const VIBE_NAMES = { Inward: "Inward", Steady: "Balance", Outward: "Outward" };

const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The Monday on or before a date. */
export const weekStart = (date) => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoOf(d);
};

/** The seven dates of the week that starts on `startIso`. */
export const weekDates = (startIso) => {
  const d = new Date(`${startIso}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return isoOf(x);
  });
};

/** Monday-first list of the week's vibes; null for days with no choice. */
export const weekVibes = (days = {}, startIso) => weekDates(startIso).map((date) => days[date]?.vibe ?? null);

/** Counts, how full the bubble is, and a one-line read of the week. */
export const summarizeWeek = (vibes) => {
  const counts = { Inward: 0, Steady: 0, Outward: 0 };
  for (const v of vibes) if (v in counts) counts[v] += 1;
  const logged = counts.Inward + counts.Steady + counts.Outward;
  const ranked = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  let headline;
  if (logged === 0) headline = "Your bubble fills as you check in each day.";
  else if (ranked.length === 1) headline = `All ${VIBE_NAMES[ranked[0][0]]} so far.`;
  else if (ranked[0][1] > ranked[1][1]) headline = `Mostly ${VIBE_NAMES[ranked[0][0]]}, with a little of everything else.`;
  else headline = "A mixed week. Your energy moved around.";

  return { counts, logged, fill: logged / 7, headline };
};

/** Start dates of this week and the `n - 1` weeks before it, oldest first. */
export const recentWeeks = (today, n = 4) => {
  const start = new Date(`${weekStart(today)}T12:00:00`);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() - 7 * (n - 1 - i));
    return isoOf(d);
  });
};
