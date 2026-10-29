/* ---------------------------------------------------------------
   FORGIVENESS ENGINE — a day is either done or paused.
   There is no third state; the streak cannot break.
   --------------------------------------------------------------- */

export const STATUS = { DONE: "done", PAUSED: "paused" };

/** A high-symptom window: any one heavy signal, or cramps stacked with
 *  fatigue or bloating. Triad signal ids, not display labels. */
export const isHighSymptom = (signals = []) => {
  const s = new Set(signals);
  if (s.has("flow-heavy") || s.has("clots") || s.has("exhaustion")) return true;
  return s.has("cramps") && (s.has("fatigue") || s.has("bloating"));
};

/**
 * entry: { prescribed: "rest"|"strength", completed?: boolean } | null
 * Prescribed rest that was taken counts exactly like a completed lift —
 * including, and especially, in a high-symptom window.
 */
export const dayStatus = (entry) => {
  if (!entry || entry.completed !== true) return STATUS.PAUSED;
  return STATUS.DONE;
};

/** Count of done days. Paused days add nothing and take nothing away. */
export const streak = (entries = []) => entries.filter((e) => dayStatus(e) === STATUS.DONE).length;

export const timeline = (entries = []) => entries.map(dayStatus);
