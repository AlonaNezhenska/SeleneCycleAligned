/* ---------------------------------------------------------------
   ENERGY — a daily goal worked out from the body, if the user wants.

   Resting energy uses the Mifflin–St Jeor equation for women. If waist,
   hip and neck are measured, body fat is estimated with the US Navy
   tape method and resting energy uses Katch–McArdle instead, which
   follows lean mass. Daily energy is resting energy times activity.

   A gentle loss goal takes 15% off and never goes below 1,200 kcal or
   below resting energy; a gain goal adds 10%. The eating style shares
   that energy out: balanced is 1.6 g protein per kg (1.8 g when
   losing) and 30% fat, with carbs making up the rest.
   Everything here is an estimate, and the user can always type her own.
   --------------------------------------------------------------- */

/** NHS guide for an adult woman, shown as a reference point. */
export const NHS_WOMAN_KCAL = 2000;
export const MIN_KCAL = 1200;

export const ACTIVITY = [
  { key: "rest", label: "Mostly sitting", sub: "Desk days, little exercise", factor: 1.2 },
  { key: "light", label: "Lightly active", sub: "Walks, exercise 1–3 days a week", factor: 1.375 },
  { key: "moderate", label: "Moderately active", sub: "Exercise 3–5 days a week", factor: 1.55 },
  { key: "very", label: "Very active", sub: "Hard exercise 6–7 days a week", factor: 1.725 },
  { key: "athlete", label: "Training hard", sub: "Physical job or twice-a-day training", factor: 1.9 },
];

export const AIMS = [
  { key: "lose", label: "Lose gently", factor: 0.85 },
  { key: "maintain", label: "Stay as I am", factor: 1 },
  { key: "gain", label: "Build or gain", factor: 1.1 },
];

/**
 * Eating styles: how the day's energy is shared between protein, fat
 * and carbs. Protein is per kg of body weight when the weight is known,
 * otherwise a share of energy. Carbs make up whatever is left.
 */
export const DIETS = [
  { key: "balanced", label: "Balanced", sub: "An even, everyday mix", proteinPerKg: 1.6, proteinShare: 0.2, fatShare: 0.3 },
  { key: "high-protein", label: "High protein", sub: "More protein for strength and fullness", proteinPerKg: 2, proteinShare: 0.3, fatShare: 0.3 },
  { key: "low-carb", label: "Low carb", sub: "Fewer carbs, more fat and protein", proteinPerKg: 1.8, proteinShare: 0.3, fatShare: 0.45 },
  { key: "low-fat", label: "Low fat", sub: "Lighter on fat, more carbs", proteinPerKg: 1.6, proteinShare: 0.2, fatShare: 0.2 },
  { key: "mediterranean", label: "Mediterranean", sub: "Olive oil, fish, beans and grains", proteinPerKg: 1.4, proteinShare: 0.18, fatShare: 0.35 },
];
export const DIET = Object.fromEntries(DIETS.map((d) => [d.key, d]));

/** Grams of protein, fat and carbs for an energy goal and eating style. */
export const macrosFor = (kcal, { diet = "balanced", kg = 0, aim = "maintain" } = {}) => {
  const d = DIET[diet] ?? DIET.balanced;
  // a little more protein while losing keeps strength
  const perKg = d.proteinPerKg + (aim === "lose" ? 0.2 : 0);
  const protein = Math.round(kg > 0 ? kg * perKg : (kcal * d.proteinShare) / 4);
  const fat = Math.round((kcal * d.fatShare) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
};

/* ---- units ---- */

export const kgFromStones = (st = 0, lb = 0) => (Number(st) || 0) * 6.35029 + (Number(lb) || 0) * 0.453592;
export const cmFromFeet = (ft = 0, inch = 0) => ((Number(ft) || 0) * 12 + (Number(inch) || 0)) * 2.54;

/* ---- the sums ---- */

/** Resting energy from weight, height and age (Mifflin–St Jeor, women). */
export const mifflin = ({ kg, cm, age }) => 10 * kg + 6.25 * cm - 5 * age - 161;

/** Body fat % from tape measurements in cm (US Navy method, women), or null. */
export const navyBodyFat = ({ cm, waist, hip, neck }) => {
  if (!(cm > 0 && waist > 0 && hip > 0 && neck > 0) || waist + hip - neck <= 0) return null;
  // the metric form of the formula; the better-known one with 163.205 is for inches
  const bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(cm)) - 450;
  return bf > 5 && bf < 60 ? Math.round(bf * 10) / 10 : null;
};

/** Resting energy from lean mass (Katch–McArdle). */
export const katch = ({ kg, bodyFat }) => 370 + 21.6 * kg * (1 - bodyFat / 100);

const round10 = (n) => Math.round(n / 10) * 10;

/**
 * A full daily goal from the body, or null if weight, height or age is
 * missing. Returns the working too, so the screen can explain it.
 */
export const goalFromBody = ({ kg, cm, age, activity = "light", aim = "maintain", diet = "balanced", waist, hip, neck }) => {
  if (!(kg > 0 && cm > 0 && age > 0)) return null;
  const bodyFat = navyBodyFat({ cm, waist, hip, neck });
  const resting = Math.round(bodyFat != null ? katch({ kg, bodyFat }) : mifflin({ kg, cm, age }));
  const factor = ACTIVITY.find((a) => a.key === activity)?.factor ?? 1.375;
  const daily = Math.round(resting * factor);
  const aimFactor = AIMS.find((a) => a.key === aim)?.factor ?? 1;
  let kcal = round10(daily * aimFactor);
  if (aim === "lose") kcal = Math.max(kcal, round10(Math.max(MIN_KCAL, resting)));
  const { protein, carbs, fat } = macrosFor(kcal, { diet, kg, aim });
  return { kcal, protein, carbs, fat, resting, daily, bodyFat };
};

/** Default age when only the age group is known. */
export const ageFromGroup = (group) => (group === "40+" ? 45 : 30);
