import { cycleDay, normalizeLength, getPhase, groupForPhase } from "../shared";
import { CATEGORIES, CONTRACEPTION_SIDE_EFFECTS, titleOf } from "../content/journal";
import { intensityWord } from "../content/bloom";

/* ---------------------------------------------------------------
   CYCLE MONTH — what the month calendar shows for each date.

   Phases are projected forwards and backwards from the last period by
   the usual cycle length, so they are an estimate, never a promise.
   Period days come from what was logged (flow, period start and end);
   symptoms come from the tracker's saved journal for that date.
   --------------------------------------------------------------- */

/** The four phase colours from the garden palette: oxblood, olive, honey and dusk violet. */
export const PHASE_TINT = {
  menstruation: "#722F27",
  follicular: "#A59D6C",
  ovulation: "#DFC276",
  luteal: "#7E6C86",
};

/** Phases deep enough that a filled day needs light text on it. */
export const DEEP_PHASES = new Set(["menstruation", "luteal"]);

const BLEEDING = new Set(["spotting", "light", "medium", "heavy", "very-heavy"]);

export const isoOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const noon = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
const addDays = (iso, n) => {
  const d = noon(iso);
  d.setDate(d.getDate() + n);
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Day of the cycle a date falls on, repeating the usual length both ways. */
export const projectedDay = (lastPeriod, iso, length) => {
  const n = normalizeLength(length);
  const raw = cycleDay(noon(lastPeriod), noon(iso));
  return ((((raw - 1) % n) + n) % n) + 1;
};

/** Ovulation is usually about 14 days before the next period. */
export const ovulationDay = (length) => Math.max(10, normalizeLength(length) - 14);

/** How long her period usually lasts: what she told Selena, or learned from her last one. */
export const usualPeriodLength = (profile = {}) => {
  const n =
    profile.periodVaries && profile.periodLengthMin && profile.periodLengthMax
      ? Math.round((profile.periodLengthMin + profile.periodLengthMax) / 2)
      : profile.periodLength ?? 5;
  return Math.max(2, Math.min(10, n));
};

/**
 * The last day of the most recent period. Nobody logs every bleeding day,
 * and few remember to log the end, so it ends by itself after her usual
 * length; flow logged on later days stretches it, and a logged end wins.
 */
export const periodEnd = (profile = {}, days = {}, todayIso) => {
  if (!profile.lastPeriod) return null;
  if (profile.lastPeriodEnd) return profile.lastPeriodEnd;
  let end = addDays(profile.lastPeriod, usualPeriodLength(profile) - 1);
  // flow logged straight after (a day's gap allowed) carries it on; spotting a week later doesn't
  for (let guard = 0; guard < 9; guard++) {
    const next = [addDays(end, 1), addDays(end, 2)].find((d) => loggedFlow(days[d]));
    if (!next) break;
    end = next;
  }
  return end;
};

/** Whether the period is still going today. */
export const periodOngoingOn = (profile = {}, days = {}, todayIso) => {
  const end = periodEnd(profile, days, todayIso);
  return Boolean(end && profile.lastPeriod <= todayIso && todayIso <= end && !profile.lastPeriodEnd);
};

/** The days of the most recent period on record, as dates. */
const recordedPeriod = (profile, todayIso, days) => {
  if (!profile.lastPeriod) return new Set();
  const end = periodEnd(profile, days, todayIso);
  const out = new Set();
  for (let d = profile.lastPeriod, guard = 0; d <= end && guard < 15; d = addDays(d, 1), guard++) out.add(d);
  return out;
};

/** The flow logged on a date, or null. */
export const loggedFlow = (day) => {
  const level = day?.journal?.flow?.choices?.level;
  return BLEEDING.has(level) ? level : null;
};

/** Everything the calendar needs for one month, keyed by date. */
export const monthDays = ({ year, month, profile = {}, days = {}, todayIso, length }) => {
  const known = Boolean(profile.lastPeriod);
  const period = recordedPeriod(profile, todayIso, days);
  const ovu = ovulationDay(length);
  const count = new Date(year, month + 1, 0).getDate();
  const out = {};
  for (let d = 1; d <= count; d++) {
    const iso = isoOf(year, month, d);
    const day = days[iso];
    const cd = known ? projectedDay(profile.lastPeriod, iso, length) : null;
    // which repeat of the cycle this date is in, so one phase stretch can be lit as a whole
    const cycle = known ? Math.floor((cycleDay(noon(profile.lastPeriod), noon(iso)) - 1) / normalizeLength(length)) : null;
    const group = cd ? groupForPhase(getPhase(cd, length)).key : null;
    const flow = loggedFlow(day);
    const bled = Boolean(flow) || period.has(iso);
    out[iso] = {
      iso,
      cycleDay: cd,
      cycle,
      group,
      period: bled,
      // a future date in the menstruation phase is when the next period is likely
      expectedPeriod: !bled && iso > todayIso && group === "menstruation",
      ovulation: cd === ovu,
      logged: hasEntries(day?.journal),
    };
  }
  return out;
};

/* ---- reading back one day's journal ---- */

const optionsOf = (cat) => [
  ...(cat.options ?? []),
  ...(cat.observations ?? []),
  ...(cat.groups ?? []).flatMap((g) => g.options),
  ...(cat.type === "contraception" ? CONTRACEPTION_SIDE_EFFECTS : []),
];

export const hasEntries = (journal) => describeJournal(journal).length > 0;

/** One readable line per thing logged, grouped by category, in tracker order. */
export const describeJournal = (journal = {}) => {
  const out = [];
  for (const cat of CATEGORIES) {
    const e = journal?.[cat.key];
    if (!e) continue;
    const opts = optionsOf(cat);
    const lines = [];
    for (const g of cat.groups ?? []) {
      const chosen = g.single && g.options.find((o) => o.key === e.choices?.[g.key]);
      if (chosen) lines.push(`${g.label}: ${chosen.label}`);
    }
    for (const [k, v] of Object.entries(e.items ?? {})) {
      if (k === "notTaken") {
        lines.push(`Pills not taken: ${v.count}`);
        continue;
      }
      const o = opts.find((x) => x.key === k);
      if (!o) continue;
      const bits = [o.label];
      if (v.intensity) bits.push(intensityWord(v.intensity).toLowerCase());
      if (v.duration) bits.push(`${v.duration} min`);
      lines.push(bits.join(" · ") + (v.note ? ` — ${v.note}` : ""));
    }
    for (const x of e.entries ?? []) lines.push([x.name, x.dosage].filter(Boolean).join(" · "));
    if (e.note) lines.push(`Note: ${e.note}`);
    if (lines.length) out.push({ key: cat.key, title: titleOf(cat), lines });
  }
  return out;
};

/** The same phase in the same cycle: what lights up together when a date is tapped. */
export const samePhase = (a, b) => Boolean(a?.group) && a.group === b?.group && a.cycle === b?.cycle;

/** First and last date of the phase stretch a date belongs to. */
export const phaseSpan = (info, profile, length) => {
  if (!info?.group) return null;
  const n = normalizeLength(length);
  const at = (iso) => {
    const cd = projectedDay(profile.lastPeriod, iso, n);
    return { group: groupForPhase(getPhase(cd, n)).key, cycle: Math.floor((cycleDay(noon(profile.lastPeriod), noon(iso)) - 1) / n) };
  };
  let start = info.iso;
  let end = info.iso;
  while (samePhase(at(addDays(start, -1)), info)) start = addDays(start, -1);
  while (samePhase(at(addDays(end, 1)), info)) end = addDays(end, 1);
  return { start, end };
};
