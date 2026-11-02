import { EVERYDAY_FOODS, EVERYDAY } from "../content/foods";

/* ---------------------------------------------------------------
   FOOD — the arithmetic behind the diary. Pure functions only.

   A food carries its values per 100 g and, when it has one, an everyday
   portion. A diary entry keeps a copy of the food it came from plus how
   much was eaten, so editing a food later never rewrites the past.
   Quick adds and recipe portions carry fixed values instead.
   --------------------------------------------------------------- */

export const MEALS = [
  { key: "breakfast", label: "Breakfast", share: 0.25 },
  { key: "lunch", label: "Lunch", share: 0.35 },
  { key: "dinner", label: "Dinner", share: 0.3 },
  { key: "snacks", label: "Snacks", share: 0.1 },
];
export const MEAL = Object.fromEntries(MEALS.map((m) => [m.key, m]));

/** A steady everyday goal; the user can change any of it. */
export const DEFAULT_GOAL = { kcal: 1850, protein: 110, carbs: 215, fat: 62 };
export const MACROS = [
  { key: "carbs", label: "Carbs" },
  { key: "protein", label: "Protein" },
  { key: "fat", label: "Fat" },
];

const ZERO = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
const round1 = (n) => Math.round(n * 10) / 10;

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Values for an amount of a food, in grams. */
export const scale = (per100, grams) => ({
  kcal: Math.round(((per100?.kcal ?? 0) * grams) / 100),
  protein: round1(((per100?.protein ?? 0) * grams) / 100),
  carbs: round1(((per100?.carbs ?? 0) * grams) / 100),
  fat: round1(((per100?.fat ?? 0) * grams) / 100),
});

/** What one diary entry adds up to. */
export const nutrientsOf = (entry) => {
  if (entry.fixed) {
    const n = entry.portions ?? 1;
    return {
      kcal: Math.round(entry.fixed.kcal * n),
      protein: round1((entry.fixed.protein ?? 0) * n),
      carbs: round1((entry.fixed.carbs ?? 0) * n),
      fat: round1((entry.fixed.fat ?? 0) * n),
    };
  }
  return scale(entry.food?.per100, entry.grams ?? 0);
};

export const sum = (list) =>
  list.reduce(
    (t, n) => ({ kcal: t.kcal + n.kcal, protein: round1(t.protein + n.protein), carbs: round1(t.carbs + n.carbs), fat: round1(t.fat + n.fat) }),
    { ...ZERO }
  );

export const entriesOf = (day) => day?.food?.entries ?? [];
export const mealEntries = (day, meal) => entriesOf(day).filter((e) => e.meal === meal);
export const dayTotals = (day) => sum(entriesOf(day).map(nutrientsOf));
export const mealTotals = (day, meal) => sum(mealEntries(day, meal).map(nutrientsOf));

/** The usual amount to add with one tap: last time's amount, else its portion, else 100 g. */
export const defaultGrams = (food, recent = []) => recent.find((r) => r.id === food.id)?.lastGrams ?? food.serving?.grams ?? 100;

/** How an amount reads: "1 slice (36 g)", "2 slices (72 g)" or "150 g". */
export const amountLabel = (food, grams) => {
  const s = food?.serving;
  if (s && s.grams > 0) {
    const n = grams / s.grams;
    // a label from a packet may already carry its weight, e.g. "2 biscuits (38 g)"
    if (Math.abs(n - 1) < 0.01 && /\d\s*g\b/i.test(s.label)) return s.label;
    if (Math.abs(n - Math.round(n)) < 0.01 && Math.round(n) === 1) return `${s.label} (${grams} g)`;
    if (Math.abs(n * 2 - Math.round(n * 2)) < 0.01) return `${n} × ${s.label} (${grams} g)`;
  }
  return `${grams} g`;
};

/** A diary entry for a food and an amount in grams. */
export const foodEntry = (meal, food, grams) => ({
  id: newId(),
  meal,
  name: food.name,
  brand: food.brand ?? null,
  food: { id: food.id, name: food.name, brand: food.brand ?? null, per100: food.per100, serving: food.serving ?? null, source: food.source },
  grams,
});

/** A diary entry with values typed straight in. */
export const quickEntry = (meal, { name, kcal, protein = 0, carbs = 0, fat = 0 }) => ({
  id: newId(),
  meal,
  name: name?.trim() || "Quick add",
  fixed: { kcal: Number(kcal) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0 },
  portions: 1,
});

/* ---- recipes and saved meals ---- */

/** Everything a list of { food, grams } adds up to. */
export const itemsTotal = (items = []) => sum(items.map((i) => scale(i.food.per100, i.grams)));

/** One serving of a recipe. */
export const perServing = (recipe) => {
  const t = itemsTotal(recipe.items);
  const n = Math.max(1, recipe.servings ?? 1);
  return { kcal: Math.round(t.kcal / n), protein: round1(t.protein / n), carbs: round1(t.carbs / n), fat: round1(t.fat / n) };
};

export const recipeEntry = (meal, recipe, portions = 1) => ({
  id: newId(),
  meal,
  name: recipe.name,
  recipeId: recipe.id,
  fixed: perServing(recipe),
  portions,
});

/** A saved meal goes in as one entry per food, so each stays editable. */
export const savedMealEntries = (meal, saved) => saved.items.map((i) => foodEntry(meal, i.food, i.grams));

/* ---- the user's own library ---- */

export const emptyLibrary = () => ({ foods: [], meals: [], recipes: [], recent: [] });

/** Remember what was just eaten, newest first, at most 40 foods. */
export const remember = (recent = [], food, grams) => [{ ...food, lastGrams: grams }, ...recent.filter((r) => r.id !== food.id)].slice(0, 40);

/* ---- search across what is on the phone ---- */

const norm = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Every word of the query appears in the name or brand. */
export const matches = (item, query) => {
  const hay = norm(`${item.name} ${item.brand ?? ""} ${item.aka ?? ""}`);
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

/** Foods on the phone for a query: the user's own first, then everyday foods. */
export const searchLocal = (query, library = emptyLibrary()) => {
  const q = query.trim();
  const mine = [...library.foods, ...library.recent];
  const seen = new Set();
  const uniq = (list) => list.filter((f) => !seen.has(f.id) && seen.add(f.id));
  if (!q) return { foods: uniq(mine), meals: library.meals, recipes: library.recipes, everyday: [] };
  return {
    foods: uniq(mine.filter((f) => matches(f, q))),
    meals: library.meals.filter((m) => matches(m, q)),
    recipes: library.recipes.filter((r) => matches(r, q)),
    everyday: uniq(EVERYDAY_FOODS.filter((f) => matches(f, q))),
  };
};

export { EVERYDAY };

/* ---- gentle words instead of numbers ---- */

/** How full a bar is, as words, for when numbers are hidden. */
export const fullnessWord = (value, goal) => {
  const r = goal > 0 ? value / goal : 0;
  if (r <= 0) return "Not started";
  if (r < 0.35) return "Just started";
  if (r < 0.7) return "On your way";
  if (r < 0.9) return "Nearly there";
  return "Well fed";
};

/** Share of a goal, capped so a bar never runs past its end. */
export const share = (value, goal) => (goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0);
