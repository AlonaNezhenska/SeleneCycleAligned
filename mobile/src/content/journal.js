import {
  Leaf, Soup, Flower2, Sun, Moon, Sparkles, Candy, Heart, Footprints, Droplets, Pill, Shield, Sprout, Stethoscope,
  Zap, CircleDot, Brain, HeartCrack, BatteryLow, Weight, PersonStanding, Anchor, Frown, Wind, Cookie,
  Hourglass, Ban, Utensils, TriangleAlert, Angry, CloudDrizzle, Shuffle, Feather, Smile, UserMinus, CloudRain,
  TrendingUp, CloudFog, Target, Lightbulb, AlarmClock, BedDouble, Cloud, MoonStar, Droplet, Flame, Scissors,
  Wheat, Milk, Apple, Sandwich, Dumbbell, Bike, Waves, Activity, Coffee, Plus, CalendarClock, CalendarX,
  Thermometer, Minus, Repeat, HandHeart, Ellipsis,
} from "lucide-react-native";

/* ---------------------------------------------------------------
   THE JOURNAL — every category the tracker offers, grouped into three
   calm collections, and the kind of input each one needs:

   symptoms      pick many; each gets its own intensity 1–5 and note.
                 `rows` lays the tiles out line by line, so opposites
                 (low / high energy) and close relatives sit side by side.
                 Intensity is drawn as one peony: difficult symptoms close
                 it as they grow; positive states (`positive`) open it.
   choices       single-choice scales plus optional observations
   activities    pick many; each gets a duration and its own extra field
   dated group   pick many; each gets a date and a note (flow's cycle changes)
   entries       a list of named items (medication, supplements)
   contraception a profile with daily notes
   health        a profile with optional daily observations

   `signal` links an option to the engine (tips, deload, buffer).
   Nothing here diagnoses anything.
   --------------------------------------------------------------- */

export const COLLECTIONS = [
  { key: "body", label: "Body & wellbeing" },
  { key: "lifestyle", label: "Lifestyle & intimacy" },
  { key: "health", label: "Cycle & health" },
];

const s = (key, label, icon, signal) => ({ key, label, icon, signal });
/** A state that is good to have more of: its flower blooms as intensity rises. */
const p = (key, label, icon) => ({ key, label, icon, positive: true });

export const CATEGORIES = [
  /* ---- Body & wellbeing ---- */
  {
    key: "physical",
    rows: [["cramps", "pelvic", "back"], ["bloating", "nausea"], ["headache", "dizziness"], ["fatigue", "muscles"], ["breast", "cravings"]],
    label: "Physical",
    collection: "body",
    icon: Leaf,
    type: "symptoms",
    options: [
      s("cramps", "Cramps", Zap, "cramps"),
      s("bloating", "Bloating", CircleDot, "bloating"),
      s("headache", "Headache", Brain),
      s("breast", "Breast tenderness", HeartCrack),
      s("fatigue", "Fatigue", BatteryLow, "fatigue"),
      s("muscles", "Muscle aches", Weight),
      s("back", "Lower back pain", PersonStanding),
      s("pelvic", "Pelvic pain", Anchor),
      s("nausea", "Nausea", Frown),
      s("dizziness", "Dizziness", Wind),
      s("cravings", "Food cravings", Cookie),
    ],
  },
  {
    key: "emotional",
    rows: [["anxiety", "calm"], ["sadness", "low", "happy"], ["irritability", "swings"], ["sensitivity", "alone"]],
    label: "Emotional",
    title: "Emotional & mood",
    collection: "body",
    icon: Flower2,
    type: "symptoms",
    options: [
      s("anxiety", "Anxiety", TriangleAlert, "anxiety"),
      s("irritability", "Irritability", Angry),
      s("sadness", "Sadness", CloudDrizzle),
      s("swings", "Mood swings", Shuffle),
      s("sensitivity", "Sensitivity", Feather),
      s("low", "Low mood", CloudRain),
      s("alone", "Need to be alone", UserMinus, "hermit"),
      p("calm", "Feeling calm", Leaf),
      p("happy", "Happiness", Smile),
    ],
  },
  {
    key: "energy",
    rows: [["low", "high"], ["fatigue", "motivation"], ["fog", "focus", "clarity"]],
    label: "Energy",
    title: "Energy & focus",
    collection: "body",
    icon: Sun,
    type: "symptoms",
    options: [
      s("low", "Low energy", BatteryLow),
      s("fatigue", "Fatigue", Weight, "fatigue"),
      p("high", "High energy", TrendingUp),
      s("fog", "Brain fog", CloudFog, "brain-fog"),
      p("focus", "Good concentration", Target),
      p("motivation", "Motivated", Zap),
      p("clarity", "Mental clarity", Lightbulb),
    ],
  },
  {
    key: "sleep",
    rows: [["insomnia", "oversleeping"], ["restless", "restful"], ["waking", "dreams"]],
    label: "Sleep",
    collection: "lifestyle",
    icon: Moon,
    type: "symptoms",
    options: [
      s("insomnia", "Insomnia", AlarmClock),
      s("restless", "Restless sleep", Footprints),
      s("waking", "Waking up", MoonStar),
      s("dreams", "Vivid dreams", Cloud),
      s("oversleeping", "Oversleeping", BedDouble),
      p("restful", "Restful sleep", Moon),
    ],
  },
  {
    key: "skin",
    rows: [["acne", "glow"], ["dry", "oily", "sensitive"], ["shedding", "greasy"]],
    label: "Skin",
    title: "Skin & hair",
    collection: "body",
    icon: Sparkles,
    type: "symptoms",
    options: [
      s("acne", "Acne", Sparkles),
      s("dry", "Dryness", Feather),
      s("oily", "Oiliness", Droplets),
      s("sensitive", "Sensitivity", Flame),
      p("glow", "Glow", Sun),
      s("shedding", "Hair shedding", Scissors),
      s("greasy", "Greasy hair", Droplet),
    ],
  },
  {
    key: "digestion",
    rows: [["low", "increased"], ["constipation", "diarrhoea"], ["bloating", "nausea", "aversions"]],
    label: "Digestion",
    title: "Digestion & appetite",
    collection: "body",
    icon: Soup,
    type: "symptoms",
    options: [
      s("bloating", "Bloating", CircleDot, "bloating"),
      s("constipation", "Constipation", Hourglass),
      s("diarrhoea", "Diarrhoea", Wind),
      s("nausea", "Nausea", Frown),
      s("low", "Low appetite", Ban),
      s("increased", "Increased appetite", Utensils, "bottomless"),
      s("aversions", "Food aversions", Minus),
    ],
  },

  {
    key: "flow",
    label: "Flow",
    collection: "body",
    icon: Droplet,
    type: "choices",
    noteLabel: "Note (optional)",
    title: "Flow & cycle changes",
    hint: "Period started today sets day 1 of your cycle when you save.",
    groups: [
      {
        key: "level",
        label: "Flow today",
        single: true,
        options: [
          s("none", "No bleeding", Minus),
          s("spotting", "Spotting", Droplet),
          s("light", "Light", Droplets),
          s("medium", "Medium", CloudDrizzle),
          s("heavy", "Heavy", CloudRain, "flow-heavy"),
          s("very-heavy", "Very heavy", CloudRain, "flow-heavy"),
        ],
      },
      {
        key: "events",
        label: "Also today",
        rows: [["started", "ended"], ["clots", "flooding"]],
        options: [
          s("started", "Period started today", CalendarClock),
          s("ended", "Period ended today", CalendarX),
          s("clots", "Clots", CircleDot, "clots"),
          s("flooding", "Flooding or leaking", Droplets),
        ],
      },
      {
        // each change keeps its own date and note
        key: "changes",
        label: "Cycle changes",
        dated: true,
        rows: [["early", "late", "absent"], ["heavy-cycle", "light-cycle"], ["longer", "shorter"], ["between", "unexpected"], ["irregular", "length"]],
        options: [
          s("early", "Period came earlier than expected", CalendarClock),
          s("late", "Period came later than expected", CalendarClock),
          s("absent", "Period hasn't come this cycle", CalendarX),
          s("between", "Spotting between periods", Droplet),
          s("unexpected", "Unexpected bleeding", Droplets),
          s("heavy-cycle", "Unusually heavy flow", CloudRain, "flow-heavy"),
          s("light-cycle", "Unusually light flow", CloudDrizzle),
          s("longer", "Longer period than usual", Plus),
          s("shorter", "Shorter period than usual", Minus),
          s("irregular", "Irregular cycle", Shuffle),
          s("length", "Change in cycle length", Repeat),
        ],
      },
    ],
  },

  /* ---- Lifestyle & intimacy ---- */
  {
    key: "cravings",
    rows: [["chocolate", "sweet"], ["salty", "fastfood"], ["carbs", "dairy"], ["fruit", "specific"], ["none"]],
    label: "Cravings",
    collection: "lifestyle",
    icon: Candy,
    type: "symptoms",
    noteLabel: "Describe the craving (optional)",
    options: [
      s("chocolate", "Chocolate", Candy, "sugar"),
      s("sweet", "Sweet foods", Cookie, "sugar"),
      s("salty", "Salty foods", Soup, "salt"),
      s("carbs", "Carbohydrates", Wheat, "heavy-carb"),
      s("dairy", "Dairy", Milk),
      s("fruit", "Fruit", Apple),
      s("fastfood", "Fast food", Sandwich),
      s("specific", "Specific food", Utensils),
      { ...s("none", "No particular cravings", Minus), noIntensity: true },
    ],
  },
  {
    key: "intimacy",
    label: "Sex & intimacy",
    collection: "lifestyle",
    icon: Heart,
    type: "choices",
    private: true,
    groups: [
      {
        key: "drive",
        label: "Sex drive",
        single: true,
        options: [
          s("very-low", "Very low", Minus),
          s("low", "Low", CloudDrizzle),
          s("moderate", "Moderate", Leaf),
          s("high", "High", Flame),
          s("very-high", "Very high", Sparkles),
          s("changing", "Changes through the day", Repeat),
        ],
      },
      {
        key: "activity",
        label: "Sexual activity",
        single: true,
        options: [
          s("yes", "Sexual activity", Heart),
          s("no", "No sexual activity", Moon),
          s("intimacy", "Intimacy without sex", HandHeart),
        ],
      },
      {
        key: "observations",
        label: "Observations",
        rows: [["more-desire", "less-desire"], ["dryness", "lubrication"], ["pain", "comfort"]],
        options: [
          s("more-desire", "Increased desire", TrendingUp),
          s("less-desire", "Decreased desire", CloudDrizzle),
          s("dryness", "Vaginal dryness", Feather),
          s("lubrication", "Increased lubrication", Droplets),
          s("pain", "Pain or discomfort during sex", TriangleAlert),
          s("comfort", "Changes in sexual comfort", Shuffle),
        ],
      },
    ],
  },
  {
    key: "activities",
    label: "Activities",
    collection: "lifestyle",
    icon: Footprints,
    type: "activities",
    options: [
      { key: "strength", label: "Strength training", icon: Dumbbell, extra: "intensity" },
      { key: "running", label: "Running", icon: Footprints, extra: "distance" },
      { key: "walking", label: "Walking", icon: Footprints, extra: "steps" },
      { key: "yoga", label: "Yoga", icon: Flower2, extra: "type" },
      { key: "pilates", label: "Pilates", icon: Activity },
      { key: "swimming", label: "Swimming", icon: Waves },
      { key: "cycling", label: "Cycling", icon: Bike },
      { key: "rest", label: "Rest day", icon: Coffee, extra: "recovery", noDuration: true },
      { key: "other", label: "Other", icon: Plus, extra: "name" },
    ],
  },

  /* ---- Cycle & health ---- */
  {
    key: "contraception",
    label: "Birth control",
    collection: "health",
    icon: Shield,
    type: "contraception",
    private: true,
  },
  {
    key: "medication",
    label: "Medication",
    collection: "health",
    icon: Pill,
    type: "entries",
    private: true,
    fields: ["name", "dosage", "time", "frequency", "reason", "notes"],
    suggestions: [],
  },
  {
    key: "supplements",
    label: "Supplements",
    collection: "health",
    icon: Sprout,
    type: "entries",
    fields: ["name", "dosage", "time", "frequency", "notes"],
    suggestions: ["Magnesium", "Vitamin D", "Iron", "Omega-3"],
  },
  {
    key: "conditions",
    label: "Health profile",
    collection: "health",
    icon: Stethoscope,
    type: "health",
    private: true,
    observations: [
      s("pelvic", "Pelvic pain", Anchor),
      s("painful-periods", "Painful periods", Zap),
      s("sex-pain", "Pain during or after sex", TriangleAlert),
      s("bowel", "Bowel discomfort", Soup),
      s("urinary", "Urinary discomfort", Droplets),
      s("fatigue", "Fatigue", BatteryLow),
    ],
  },
];

export const CONTRACEPTION_METHODS = [
  { key: "combined-pill", label: "Combined pill", hormonal: true, pill: true },
  { key: "pop", label: "Progestogen-only pill", hormonal: true, pill: true },
  { key: "hormonal-iud", label: "Hormonal IUD", hormonal: true },
  { key: "copper-iud", label: "Copper IUD", hormonal: false },
  { key: "implant", label: "Implant", hormonal: true },
  { key: "injection", label: "Injection", hormonal: true },
  { key: "patch", label: "Patch", hormonal: true, pill: true },
  { key: "ring", label: "Vaginal ring", hormonal: true },
  { key: "condoms", label: "Condoms", hormonal: false },
  { key: "other", label: "Other", hormonal: false },
  { key: "none", label: "Not using birth control", hormonal: false },
];

export const CONTRACEPTION_SIDE_EFFECTS = [
  s("spotting", "Spotting", Droplet),
  s("headache", "Headaches", Brain),
  s("mood", "Mood changes", Shuffle),
  s("nausea", "Nausea", Frown),
  s("breast", "Breast tenderness", HeartCrack),
  s("libido", "Lower sex drive", CloudDrizzle),
  s("skin", "Skin changes", Sparkles),
  s("weight", "Appetite or weight changes", Utensils),
];

export const CONDITIONS = [
  { key: "endo-diagnosed", label: "Diagnosed endometriosis" },
  { key: "endo-suspected", label: "Suspected endometriosis" },
  { key: "pcos", label: "PCOS" },
  { key: "other", label: "Another diagnosed condition" },
];

export const FREQUENCIES = ["Once", "Twice a day", "Daily", "As needed"];

export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
export const inCollection = (key) => CATEGORIES.filter((c) => c.collection === key);
export const titleOf = (c) => c.title ?? c.label;

/* ---- reading a day's journal ---- */

const optionsOf = (cat) =>
  cat.options ?? cat.observations ?? (cat.groups ? cat.groups.flatMap((g) => g.options) : []);

/** How many things are recorded in one category of a journal. */
export const countIn = (journal = {}, key) => {
  const e = journal[key];
  if (!e) return 0;
  const items = Object.keys(e.items ?? {}).length;
  const choices = Object.values(e.choices ?? {}).filter(Boolean).length;
  const entries = (e.entries ?? []).length;
  const extra = e.profileChange ? 1 : 0;
  return items + choices + entries + extra;
};

/** Engine signal ids in a journal, for tips and the deload card. */
export const journalSignals = (journal = {}) => {
  const out = new Set();
  for (const cat of CATEGORIES) {
    const items = journal[cat.key]?.items ?? {};
    for (const o of optionsOf(cat)) if (o.signal && items[o.key]) out.add(o.signal);
    // single-choice scales (flow level) carry signals too
    for (const g of cat.groups ?? []) {
      const chosen = g.single && g.options.find((o) => o.key === journal[cat.key]?.choices?.[g.key]);
      if (chosen?.signal) out.add(chosen.signal);
    }
  }
  return [...out];
};

/** Tiles arranged line by line: the listed rows first, anything left over three to a line. */
export const tileRows = (options, rows = []) => {
  const byKey = Object.fromEntries(options.map((o) => [o.key, o]));
  const placed = new Set(rows.flat());
  const out = rows.map((r) => r.map((k) => byKey[k]).filter(Boolean)).filter((r) => r.length);
  const rest = options.filter((o) => !placed.has(o.key));
  for (let i = 0; i < rest.length; i += 3) out.push(rest.slice(i, i + 3));
  return out;
};
