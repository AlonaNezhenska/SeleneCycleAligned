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
} from "./engine/index.js";

export const deriveToday = ({ profile, today, now = new Date(), dayOverride = null }) => {
  const length = normalizeLength(profile.cycleLength);
  const rawDay = dayOverride ?? cycleDay(profile.lastPeriod, now);
  const day = clampDay(rawDay, length);
  const phase = getPhase(day, length);
  const base = { day, length, onBirthControl: profile.onBirthControl };

  const mode = resolveMode({ ...base, vibe: today.vibe, checkIn: today.checkIn });

  return {
    day,
    length,
    phase,
    phaseLabel: PHASES.find((p) => p.key === phase).label,
    ...mode,
    fork: lateLutealFork({ ...base, checkIn: today.checkIn }),
    prescription: prescribe({ mode: mode.mode, ageGroup: profile.ageGroup, cardio: today.cardio }),
    buffer: lutealBuffer(base),
    affirmation: affirmationFor(phase, day),
  };
};
