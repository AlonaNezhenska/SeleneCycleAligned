/* ---------------------------------------------------------------
   ENCOURAGEMENT — a warm word that fits the day.

   Moving in the harder phases gets celebrated; resting on a day the
   body asked for rest gets celebrated just as much. Never a word about
   what was not done. Words here must pass the copy blocklist.
   --------------------------------------------------------------- */

/** Signals from the tracker that say the body is asking for gentleness. */
const ASKING_FOR_REST = new Set(["cramps", "fatigue", "brain-fog", "anxiety", "hermit", "sugar", "salt", "heavy-carb", "bottomless", "flow-heavy", "bloating"]);

/**
 * @param phase      menstruation | follicular | ovulation | luteal | null
 * @param moved      any exercise, yoga or a walk logged today
 * @param meditated  a meditation logged today
 * @param signals    tracker signal ids for today
 */
export const encouragement = ({ phase, moved, meditated, signals = [] }) => {
  const askingForRest = signals.some((s) => ASKING_FOR_REST.has(s));
  if (moved && phase === "luteal") {
    return {
      key: "luteal-moved",
      title: "Wow, look at you!",
      body: "Training in your luteal phase takes real grit, and you showed up anyway. You're pushing through the hard days beautifully.",
    };
  }
  if (moved && phase === "menstruation") {
    return {
      key: "period-moved",
      title: "Moving on your period. Amazing.",
      body: "That takes strength. Be proud of today, and keep it gentle.",
    };
  }
  if (moved && askingForRest) {
    return {
      key: "moved-anyway",
      title: "You moved with care today",
      body: "Your body had a lot going on and you still made time for it. That's something to feel good about.",
    };
  }
  if (moved) {
    return {
      key: "moved",
      title: "Lovely work today",
      body: phase === "ovulation" || phase === "follicular" ? "Your body is in its stride. Enjoy that energy." : "Every bit of movement counts. Well done.",
    };
  }
  if (askingForRest) {
    return {
      key: "rest-right",
      title: "Rest is exactly right today",
      body: "Your body asked for a slower day and you listened. That's strength too, and you're not giving up on yourself. You're doing so well.",
    };
  }
  if (meditated) {
    return { key: "meditated", title: "A quiet mind is practice too", body: "Those calm minutes count. Thank you for making space for them." };
  }
  return null;
};
