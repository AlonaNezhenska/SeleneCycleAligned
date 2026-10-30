/* Everything the screens read about today, computed once from state. */

import {
  cycleDay,
  clampDay,
  normalizeLength,
  getPhase,
  PHASES,
  resolveMode,
  lateLutealFork,
  prescribe,
  lutealBuffer,
  affirmationFor,
  resolveCycleLength,
} from "./engine/index.js";

export const deriveToday = ({ profile, today, now = new Date(), dayOverride = null }) => {
  const cycle = resolveCycleLength(profile);
  const length = normalizeLength(cycle.length);
  // Without a last period start there is no calendar to read, so Selena
  // follows the Vibe Check alone, exactly as it does on birth control.
  const calendarKnown = Boolean(profile.lastPeriod);
  const rawDay = dayOverride ?? (calendarKnown ? cycleDay(profile.lastPeriod, now) : 1);
  const day = clampDay(rawDay, length);
  const phase = getPhase(day, length);
  const base = { day, length, onBirthControl: profile.onBirthControl || !calendarKnown };

  const mode = resolveMode({ ...base, vibe: today.vibe, checkIn: today.checkIn });

  return {
    day,
    length,
    calendarKnown,
    cycleLengthSource: cycle.source,
    phase,
    phaseLabel: PHASES.find((p) => p.key === phase).label,
    ...mode,
    fork: lateLutealFork({ ...base, checkIn: today.checkIn }),
    prescription: prescribe({ mode: mode.mode, ageGroup: profile.ageGroup, cardio: today.cardio }),
    buffer: lutealBuffer(base),
    affirmation: affirmationFor(phase, day),
  };
};
