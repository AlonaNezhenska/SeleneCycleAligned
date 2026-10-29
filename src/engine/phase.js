/* ---------------------------------------------------------------
   PHASE — where in the cycle a given day sits.
   Boundaries are written for a 28-day reference cycle and scaled
   proportionally to the user's own length.
   --------------------------------------------------------------- */

export const REFERENCE_LENGTH = 28;
export const MIN_LENGTH = 21;
export const MAX_LENGTH = 45;

/** Last reference day of each phase, in order. */
export const PHASES = [
  { key: "menstrual", label: "Menstrual", end: 5 },
  { key: "follicular", label: "Follicular", end: 13 },
  { key: "ovulatory", label: "Ovulatory", end: 16 },
  { key: "earlyLuteal", label: "Early luteal", end: 25 },
  { key: "lateLuteal", label: "Late luteal", end: 28 },
];

const LUTEAL = new Set(["earlyLuteal", "lateLuteal"]);

/** Unknown or implausible lengths fall back to the reference cycle. */
export const normalizeLength = (length) =>
  Number.isFinite(length) && length >= MIN_LENGTH && length <= MAX_LENGTH
    ? Math.round(length)
    : REFERENCE_LENGTH;

/** Day 0 or below clamps to day 1. Past the cycle length clamps to the last
 *  day: a late period means the body is still luteal, not starting over. */
export const clampDay = (day, length = REFERENCE_LENGTH) => {
  const len = normalizeLength(length);
  if (!Number.isFinite(day)) return 1;
  return Math.min(Math.max(Math.round(day), 1), len);
};

/** Map a day in the user's cycle onto the 28-day reference. */
export const toReferenceDay = (day, length = REFERENCE_LENGTH) => {
  const len = normalizeLength(length);
  const d = clampDay(day, len);
  return Math.min(REFERENCE_LENGTH, Math.max(1, Math.ceil((d * REFERENCE_LENGTH) / len)));
};

export const getPhase = (day, length = REFERENCE_LENGTH) => {
  const ref = toReferenceDay(day, length);
  return PHASES.find((p) => ref <= p.end).key;
};

export const isLuteal = (phase) => LUTEAL.has(phase);

/** The day range a phase covers for this cycle length, for legends. */
export const phaseRange = (phaseKey, length = REFERENCE_LENGTH) => {
  const len = normalizeLength(length);
  const days = [];
  for (let d = 1; d <= len; d++) if (getPhase(d, len) === phaseKey) days.push(d);
  return { start: days[0], end: days[days.length - 1] };
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Day 1 is the day the last period started. Uses calendar days, so the
 *  hour of the day never shifts the count. */
export const cycleDay = (lastPeriodStart, today = new Date()) => {
  const a = new Date(lastPeriodStart);
  const b = new Date(today);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcB - utcA) / MS_PER_DAY) + 1;
};
