import RAW from "../content/exercises.json";

/* ---------------------------------------------------------------
   EXERCISES — the library behind workouts.

   876 exercises from free-exercise-db (github.com/yuhonas/free-exercise-db,
   released into the public domain under the Unlicense), joined by 1,183
   more from exercises-dataset (github.com/hasaneyldrm/exercises-dataset,
   MIT, © 2026 Hasan Emir Yıldırım; see content/LICENSE-exercises-dataset.txt),
   which adds the gym's machines, cables and Smith machine. Names, muscles,
   equipment and instructions are taken; each exercise is shown on Selena's
   own body figure, with the working muscles lit. `gv` is the exercise's
   picture in that dataset, shown for personal use only (content/exerciseMedia.js).
   Machines named as Hevy names them, two machines the datasets lack and
   yoga poses are Selena's own (`own`), written for this app.
   The user's own exercises join the list from her library.
   --------------------------------------------------------------- */

export const EQUIPMENT = {
  "body only": "Bodyweight",
  dumbbell: "Dumbbell",
  barbell: "Barbell",
  kettlebells: "Kettlebell",
  machine: "Machine",
  "smith machine": "Smith machine",
  cable: "Cable",
  bands: "Band",
  "medicine ball": "Medicine ball",
  "exercise ball": "Exercise ball",
  "e-z curl bar": "EZ bar",
  "foam roll": "Foam roller",
  yoga: "Yoga",
  other: "Other",
};

export const MUSCLES = {
  abdominals: "Abs",
  abductors: "Abductors",
  adductors: "Adductors",
  biceps: "Biceps",
  calves: "Calves",
  chest: "Chest",
  forearms: "Forearms",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  lats: "Lats",
  "lower back": "Lower back",
  "middle back": "Upper back",
  neck: "Neck",
  quadriceps: "Quads",
  shoulders: "Shoulders",
  traps: "Traps",
  triceps: "Triceps",
};

/**
 * How a set is logged:
 *   weight    kg × reps
 *   reps      reps only (bodyweight; weight can still be added)
 *   duration  time held or moved (stretches, cardio, planks)
 *   breaths   yoga poses, held for a number of breaths
 */
export const logType = (ex) => {
  if (ex.type) return ex.type;
  if (ex.cat === "yoga") return "breaths";
  if (ex.cat === "cardio" || ex.cat === "stretching" || /plank|bridge hold|wall sit/i.test(ex.name)) return "duration";
  if (ex.eq === "body only" || ex.eq === "other" || ex.cat === "plyometrics") return "reps";
  return "weight";
};

export const LIBRARY = RAW.map((e) => ({ ...e, type: logType(e) }));
const BY_ID = Object.fromEntries(LIBRARY.map((e) => [e.id, e]));
// the list to choose from holds exercises with a picture and Selena's own
// (machines and yoga poses, shown on the body figure); the rest stay
// reachable by id, for past workouts and a few classics in the programs
const PICTURED = LIBRARY.filter((e) => e.gv || e.own);

/** An exercise by id, from the library or the user's own. */
export const exerciseById = (id, custom = []) => BY_ID[id] ?? custom.find((c) => c.id === id) ?? null;

export const muscleLabel = (m) => MUSCLES[m] ?? m;
export const equipmentLabel = (e) => EQUIPMENT[e] ?? "Other";

const norm = (s) => (s ?? "").toLowerCase();

/** Search by words, then narrow by equipment and muscle. Beginner-friendly first. */
export const findExercises = ({ query = "", equipment = null, muscle = null, custom = [], limit = 80 }) => {
  const words = norm(query).split(/\s+/).filter(Boolean);
  const LEVEL = { beginner: 0, intermediate: 1, expert: 2 };
  return [...custom, ...PICTURED]
    .filter((e) => (!equipment || e.eq === equipment) && (!muscle || e.p.includes(muscle)))
    .filter((e) => words.every((w) => norm(`${e.name} ${e.aka ?? ""} ${equipmentLabel(e.eq)} ${(e.p ?? []).map(muscleLabel).join(" ")}`).includes(w)))
    .sort((a, b) => (LEVEL[a.lvl] ?? 0) - (LEVEL[b.lvl] ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
};

/** A new exercise of her own. */
export const customExercise = ({ id, name, eq = "other", p = [], type = "weight" }) => ({ id, name: name.trim(), eq, cat: "strength", lvl: "beginner", p, s: [], how: [], type, custom: true });
