/* ---------------------------------------------------------------
   MODE — Inward / Steady / Outward for today.
   The user's own Vibe Check always outranks the calendar.
   --------------------------------------------------------------- */

import { getPhase } from "./phase.js";

export const MODES = ["Inward", "Steady", "Outward"];

export const CALENDAR_MODE = {
  menstrual: "Inward",
  follicular: "Outward",
  ovulatory: "Outward",
  earlyLuteal: "Steady",
  lateLuteal: "Inward",
};

const isMode = (v) => MODES.includes(v);

/** Late Luteal Fork (days 26–28 on the reference cycle). Returns null outside
 *  that window or when hormonal birth control switches the calendar off.
 *  `path` stays null until the expanded check-in is answered. */
export const lateLutealFork = ({ day, length, onBirthControl = false, checkIn = null }) => {
  if (onBirthControl || getPhase(day, length) !== "lateLuteal") return null;
  if (!checkIn || (!checkIn.social && !checkIn.drive)) return { expanded: true, path: null };
  const wipeout = checkIn.social === "hermit" || checkIn.drive === "low";
  return { expanded: true, path: wipeout ? "wipeout" : "surge" };
};

/**
 * @returns {{ mode: string, source: "vibe"|"fork"|"calendar"|"default", promptVibeCheck: boolean }}
 */
export const resolveMode = ({ vibe = null, day, length, onBirthControl = false, checkIn = null }) => {
  if (isMode(vibe)) return { mode: vibe, source: "vibe", promptVibeCheck: false };

  if (onBirthControl) return { mode: "Steady", source: "default", promptVibeCheck: true };

  const fork = lateLutealFork({ day, length, onBirthControl, checkIn });
  if (fork?.path) {
    return { mode: fork.path === "wipeout" ? "Inward" : "Outward", source: "fork", promptVibeCheck: false };
  }

  return { mode: CALENDAR_MODE[getPhase(day, length)], source: "calendar", promptVibeCheck: false };
};
