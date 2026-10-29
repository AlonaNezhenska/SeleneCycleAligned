/* ---------------------------------------------------------------
   FUEL — the Luteal Buffer and number masking.
   --------------------------------------------------------------- */

import { getPhase, isLuteal } from "./phase.js";

export const LUTEAL_BUFFER = Object.freeze({ min: 150, max: 300, optional: true });

export const MASK = "••";

/** Offered only in luteal days and only when the calendar is meaningful. */
export const lutealBuffer = ({ day, length, onBirthControl = false }) =>
  !onBirthControl && isLuteal(getPhase(day, length)) ? { ...LUTEAL_BUFFER } : null;

/** The buffer is a range the user can choose to eat into. It never moves
 *  the target unless the user has accepted it themselves. */
export const applyBuffer = (target, buffer, accepted = false) =>
  buffer && accepted === true
    ? { base: target, min: target + buffer.min, max: target + buffer.max }
    : { base: target, min: target, max: target };

export const maskValue = (value, hidden) => (hidden ? MASK : String(value));
