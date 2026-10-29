/* ---------------------------------------------------------------
   PRESCRIPTION — what today's session looks like.
   --------------------------------------------------------------- */

export const AGE_GROUPS = ["20s/30s", "40+"];

/** Polarized cardio: easy or very hard, never the grey middle. */
export const ALLOWED_CARDIO = ["zone2", "sit"];

const PLANS = {
  Inward: {
    kind: "rest",
    load: null,
    title: "Recovery Day",
    summary: "This is productive rest.",
    options: ["Rest", "Mobility & stretching", "Chill Zone 2 walk"],
    cardio: "zone2",
  },
  Steady: {
    kind: "strength",
    load: "baseline",
    title: "Baseline Strength",
    summary: "Solid, repeatable work. Leave the session feeling capable.",
    options: ["Compound lifts at working weight", "Accessory circuit", "Zone 2 cooldown"],
    cardio: "zone2",
  },
  Outward: {
    kind: "strength",
    load: "heavy",
    title: "Heavy Strength or SIT",
    summary: "Your energy is high. Lift heavy or sprint hard, then stop.",
    options: ["Heavy compound lifts", "Sprint intervals (SIT)", "Short mobility reset"],
    cardio: "sit",
  },
};

/** Coerce any requested cardio into the polarized model for this mode.
 *  Rest days only ever get the easy end. */
export const normalizeCardio = (requested, mode) => {
  const fallback = mode === "Outward" ? "sit" : "zone2";
  if (mode === "Inward") {
    return { cardio: "zone2", replaced: requested != null && requested !== "zone2", requested };
  }
  if (ALLOWED_CARDIO.includes(requested)) return { cardio: requested, replaced: false, requested };
  return { cardio: fallback, replaced: requested != null, requested };
};

export const prescribe = ({ mode, ageGroup = "20s/30s", cardio = null }) => {
  const plan = PLANS[mode] ?? PLANS.Steady;
  const resolvedMode = PLANS[mode] ? mode : "Steady";
  const training = plan.kind === "strength";
  const over40 = ageGroup === "40+";

  return {
    mode: resolvedMode,
    ...plan,
    strength: training
      ? over40
        ? { toFailure: false, rir: { min: 2, max: 3 } }
        : { toFailure: true, rir: null }
      : null,
    plyometrics: training && over40,
    cardio: normalizeCardio(cardio ?? plan.cardio, resolvedMode),
  };
};
