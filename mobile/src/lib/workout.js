import { exerciseById } from "./exercises";

/* ---------------------------------------------------------------
   WORKOUT — the arithmetic of sets, sessions and progress.
   Pure functions only.
   --------------------------------------------------------------- */

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** How this exercise is logged in a workout: a timed target wins, else the exercise's own type. */
export const entryType = (ex, item = {}) => {
  if (item.seconds) return "duration";
  const t = ex?.type ?? "weight";
  return t === "duration" && item.reps ? "reps" : t;
};

export const blankSet = (item = {}) => ({ kg: "", reps: item.reps ? String(item.reps) : "", seconds: item.seconds ? String(item.seconds) : "", done: false, warmup: false });

/** A workout entry from a routine item (or a freshly picked exercise). */
export const entryFrom = (item, custom = []) => {
  const ex = exerciseById(item.id, custom);
  return { id: item.id, type: entryType(ex, item), rest: item.rest ?? 90, sets: Array.from({ length: item.sets ?? 3 }, () => blankSet(item)) };
};

/** The sets from the last time this exercise was done, for the "Previous" column. */
export const previousSets = (workouts = [], id) => {
  for (const w of workouts) {
    const e = w.exercises?.find((x) => x.id === id);
    if (e?.sets?.length) return e.sets.filter((s) => !s.warmup);
  }
  return [];
};

export const setVolume = (s) => (s.done && !s.warmup ? num(s.kg) * num(s.reps) : 0);

/** Totals for a workout: volume (kg), finished sets, reps. */
export const workoutTotals = (w) => {
  let volume = 0;
  let sets = 0;
  let reps = 0;
  for (const e of w?.exercises ?? []) {
    for (const s of e.sets) {
      if (!s.done) continue;
      sets += 1;
      reps += num(s.reps);
      volume += setVolume(s);
    }
  }
  return { volume: Math.round(volume), sets, reps };
};

export const minutesOf = (w) => Math.max(0, Math.round(((w.endedAt ?? Date.now()) - w.startedAt) / 60000));

/** Estimated one-rep max (Epley). */
export const oneRepMax = (kg, reps) => (num(reps) <= 1 ? num(kg) : Math.round(num(kg) * (1 + num(reps) / 30) * 10) / 10);

/**
 * Warm-up sets before a working weight: about 40%, 60% and 80%, rounded
 * to 2.5 kg. Light working weights get fewer.
 */
export const warmupSets = (workingKg) => {
  const w = num(workingKg);
  if (w < 10) return [];
  const steps = w < 30 ? [[0.5, 8]] : w < 60 ? [[0.5, 8], [0.75, 4]] : [[0.4, 8], [0.6, 5], [0.8, 3]];
  return steps.map(([p, reps]) => ({ kg: String(Math.max(2.5, Math.round((w * p) / 2.5) * 2.5)), reps: String(reps), seconds: "", done: false, warmup: true }));
};

/** Every time an exercise was done, oldest first, with its best numbers. */
export const exerciseHistory = (workouts = [], id) =>
  workouts
    .map((w) => {
      const sets = (w.exercises?.find((x) => x.id === id)?.sets ?? []).filter((s) => s.done !== false && !s.warmup);
      if (!sets.length) return null;
      const heaviest = Math.max(...sets.map((s) => num(s.kg)));
      const best = sets.reduce((b, s) => (num(s.kg) * num(s.reps) > num(b.kg) * num(b.reps) ? s : b), sets[0]);
      return {
        date: w.date,
        heaviest,
        oneRm: Math.max(...sets.map((s) => oneRepMax(s.kg, s.reps))),
        bestSet: `${num(best.kg)} kg × ${num(best.reps)}`,
        reps: Math.max(...sets.map((s) => num(s.reps))),
        seconds: Math.max(...sets.map((s) => num(s.seconds))),
        sets,
      };
    })
    .filter(Boolean)
    .reverse();

/** Personal records for an exercise. */
export const personalRecords = (workouts, id) => {
  const h = exerciseHistory(workouts, id);
  if (!h.length) return null;
  return {
    heaviest: Math.max(...h.map((x) => x.heaviest)),
    oneRm: Math.max(...h.map((x) => x.oneRm)),
    reps: Math.max(...h.map((x) => x.reps)),
    seconds: Math.max(...h.map((x) => x.seconds)),
  };
};

const shift = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const x = new Date(y, m - 1, d + n, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/** Monday of the week a date is in. */
export const weekStart = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const day = (new Date(y, m - 1, d, 12).getDay() + 6) % 7;
  return shift(iso, -day);
};

/** Minutes, volume and reps per week for the last `weeks` weeks, oldest first. */
export const weeklyTotals = (workouts = [], todayKey, weeks = 12) => {
  const last = weekStart(todayKey);
  return Array.from({ length: weeks }, (_, i) => {
    const start = shift(last, (i - (weeks - 1)) * 7);
    const end = shift(start, 7);
    const inWeek = workouts.filter((w) => w.date >= start && w.date < end);
    const t = inWeek.map(workoutTotals);
    return {
      week: start,
      minutes: inWeek.reduce((a, w) => a + minutesOf(w), 0),
      volume: t.reduce((a, x) => a + x.volume, 0),
      reps: t.reduce((a, x) => a + x.reps, 0),
      count: inWeek.length,
    };
  });
};

/** Finished sets per muscle since a date, for the statistics page. */
export const setsPerMuscle = (workouts = [], since, custom = []) => {
  const out = {};
  for (const w of workouts) {
    if (w.date < since) continue;
    for (const e of w.exercises ?? []) {
      const ex = exerciseById(e.id, custom);
      const n = e.sets.filter((s) => s.done !== false && !s.warmup).length;
      for (const m of ex?.p ?? []) out[m] = (out[m] ?? 0) + n;
    }
  }
  return out;
};
