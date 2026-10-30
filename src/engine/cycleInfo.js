/* ---------------------------------------------------------------
   CYCLE INFO — turning what the user remembers into lengths.
   People rarely know their numbers, so every value can be "not sure":
   dates beat typed numbers, typed numbers beat estimates, and the
   28-day reference is only the last resort.
   --------------------------------------------------------------- */

import { MIN_LENGTH, MAX_LENGTH, REFERENCE_LENGTH } from "./phase.js";

export const MIN_PERIOD = 1;
export const MAX_PERIOD = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar date from "YYYY-MM-DD", immune to time zones. */
const utc = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Whole days from a to b (b later is positive). */
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / MS_PER_DAY);

export const addDays = (iso, n) => {
  const d = new Date(utc(iso) + n * MS_PER_DAY);
  return d.toISOString().slice(0, 10);
};

/** Days from the start of one period to the start of the next, if plausible. */
export const estimateCycleLength = (previousStart, lastStart) => {
  if (!previousStart || !lastStart) return null;
  const d = daysBetween(previousStart, lastStart);
  return d >= MIN_LENGTH && d <= MAX_LENGTH ? d : null;
};

/** Inclusive length of a period from its first and last day. */
export const periodLengthFromDates = (start, end) => {
  if (!start || !end) return null;
  const d = daysBetween(start, end) + 1;
  return d >= MIN_PERIOD && d <= MAX_PERIOD ? d : null;
};

const mid = (a, b) => Math.round((a + b) / 2);

/**
 * The cycle length the engine should use, and where it came from:
 * "range" (it varies), "entered", "estimated" (from two start dates)
 * or "default" (nothing known yet).
 */
export const resolveCycleLength = (p = {}) => {
  if (p.cycleVaries && p.cycleLengthMin && p.cycleLengthMax) {
    return { length: mid(p.cycleLengthMin, p.cycleLengthMax), source: "range" };
  }
  if (p.cycleLength) return { length: p.cycleLength, source: "entered" };
  const estimate = estimateCycleLength(p.previousPeriod, p.lastPeriod);
  if (estimate) return { length: estimate, source: "estimated" };
  return { length: REFERENCE_LENGTH, source: "default" };
};

/** Period length: from the logged dates first, then what was typed. */
export const resolvePeriodLength = (p = {}) => {
  const fromDates = periodLengthFromDates(p.lastPeriod, p.lastPeriodEnd);
  if (fromDates) return { length: fromDates, source: "dates" };
  if (p.periodVaries && p.periodLengthMin && p.periodLengthMax) {
    return { length: mid(p.periodLengthMin, p.periodLengthMax), source: "range" };
  }
  if (p.periodLength) return { length: p.periodLength, source: "entered" };
  return { length: null, source: "unknown" };
};

/** Expected start of the next period, or null without a last start. */
export const nextPeriodStart = (p = {}) => (p.lastPeriod ? addDays(p.lastPeriod, resolveCycleLength(p).length) : null);
