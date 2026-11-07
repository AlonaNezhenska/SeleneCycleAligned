import { addDays, groupForDay, nextPeriodStart, resolveCycleLength, EVENING, SUNSET_HOURS } from "../shared";

/* ---------------------------------------------------------------
   MOMENTS — a picture and one funny line at the right time in the cycle.

   Some follow the calendar (the four days before a period, the start of
   the follicular phase, ovulation). Some follow what she does (a period
   logged, a strength workout, a treat day). Nothing is predicted on
   birth control, and nothing here looks at anything but the calendar.
   --------------------------------------------------------------- */

export const MOMENT_TEXT = {
  "before-4": "4 days to go. the mood swings are warming up.",
  "before-3": "3 days to go. crying at adverts is now valid.",
  "before-2": "2 days to go. you may sit in the corner.",
  "before-1": "tomorrow-ish. biting things is allowed.",
  follicular: "period's gone. another day, another slay.",
  "ovulation-1": "ovulation day. you are dangerously hot.",
  "ovulation-2": "still ovulating. still a menace.",
  "ovulation-3": "last hot day. flirt responsibly.",
  "period-here": "heey, it's here, sorry..",
  "period-prime": "but you're not pregnant, live in primeeee",
  "period-risky": "girllll, it was risky but here it comes",
  "period-survive": "let's survive togetheeer....",
  strength: "wooow good job! now let's take a picture of the most gorgeous girl and eat some proteeein, let's goooo",
  treat: "treat day. today we eat like No-Face.",
};

const LATE_DAYS = 2;

/** Which two moments a logged period brings: a late one flips the order. */
export const periodMoments = (profile, todayKey) => {
  const expected = nextPeriodStart(profile);
  const late = !profile.onBirthControl && expected != null && todayKey >= addDays(expected, LATE_DAYS);
  return late ? ["period-risky", "period-survive"] : ["period-here", "period-prime"];
};

/** The calendar's moments for this cycle, soonest first, from today on. */
export const upcomingMoments = (profile, todayKey) => {
  if (profile.onBirthControl || !profile.lastPeriod) return [];
  const length = resolveCycleLength(profile).length;
  const dayOf = (d) => addDays(profile.lastPeriod, d - 1);
  const days = Array.from({ length }, (_, i) => i + 1);
  const firstOf = (key) => days.find((d) => groupForDay(d, length).key === key);
  const follicular = firstOf("follicular");
  const ovulation = firstOf("ovulation");
  const next = nextPeriodStart(profile);
  return [
    ...(follicular ? [{ key: "follicular", date: dayOf(follicular) }] : []),
    ...(ovulation ? [0, 1, 2].map((i) => ({ key: `ovulation-${i + 1}`, date: dayOf(ovulation + i) })) : []),
    ...[4, 3, 2, 1].map((n) => ({ key: `before-${n}`, date: addDays(next, -n) })),
  ]
    .filter((m) => m.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));
};

/** Evening only, and only as far ahead as the 72-hour sunset allows. */
export const notificationTimes = (moments, now) => {
  const stop = now.getTime() + SUNSET_HOURS * 60 * 60 * 1000;
  return moments
    .map((m) => {
      const [y, mo, d] = m.date.split("-").map(Number);
      return { ...m, at: new Date(y, mo - 1, d, EVENING.startHour, 30, 0, 0) };
    })
    .filter((m) => m.at.getTime() > now.getTime() && m.at.getTime() <= stop);
};
