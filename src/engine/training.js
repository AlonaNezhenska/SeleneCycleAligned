/* ---------------------------------------------------------------
   TRAINING NUDGES — Pre-Flight, Bailout and the post-session window.
   --------------------------------------------------------------- */

export const PRE_FLIGHT = Object.freeze({ cutoffHour: 11, proteinGrams: 15 });
export const BAILOUT_MINUTES = 10;
export const POST_WINDOW = Object.freeze({ minutes: 45, proteinGrams: 35 });

/** A workout starting before 11:00 gets the 15g nudge. */
export const preFlightNudge = (startTime) => {
  const d = new Date(startTime);
  return d.getHours() < PRE_FLIGHT.cutoffHour ? { proteinGrams: PRE_FLIGHT.proteinGrams } : null;
};

/** Fires once per session, from the tenth minute on. */
export const shouldOfferBailout = (elapsedMs, alreadyOffered = false) =>
  !alreadyOffered && elapsedMs >= BAILOUT_MINUTES * 60 * 1000;

export const postWorkoutWindow = (endTime) => {
  const end = new Date(endTime).getTime();
  return {
    proteinGrams: POST_WINDOW.proteinGrams,
    minutes: POST_WINDOW.minutes,
    closesAt: end + POST_WINDOW.minutes * 60 * 1000,
  };
};

/** Milliseconds left in the window, never negative. */
export const windowRemaining = (window, now) => Math.max(0, window.closesAt - new Date(now).getTime());
