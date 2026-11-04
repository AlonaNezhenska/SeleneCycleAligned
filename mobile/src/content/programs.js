/* ---------------------------------------------------------------
   PROGRAMS — ready routines built from the exercise library.

   Each program has a level, a goal, the equipment it needs, where it
   fits (place) and the cycle phases it suits. Each routine lists its
   exercises with target sets and reps (or seconds) and rest.
   --------------------------------------------------------------- */

const x = (id, sets, target, rest = 90) => ({ id, sets, ...(typeof target === "string" ? { seconds: parseInt(target, 10) } : { reps: target }), rest });

export const LEVELS = ["beginner", "intermediate"];
export const GOALS = [
  { key: "strength", label: "Strength" },
  { key: "glutes", label: "Glutes & legs" },
  { key: "tone", label: "Tone & condition" },
  { key: "cardio", label: "Cardio & stamina" },
  { key: "mobility", label: "Mobility & calm" },
];

/** The places shown as tiles on Explore. */
export const PLACES = [
  { key: "home", label: "At home" },
  { key: "travel", label: "Travel" },
  { key: "dumbbells", label: "Dumbbells only" },
  { key: "band", label: "Band" },
  { key: "cardio", label: "Cardio & HIIT" },
  { key: "gym", label: "Gym" },
  { key: "bodyweight", label: "Bodyweight" },
  { key: "kettlebell", label: "Kettlebell" },
  { key: "stretch", label: "Stretch & mobility" },
];

export const PROGRAMS = [
  {
    id: "gym-full-body",
    name: "Beginner full body",
    level: "beginner",
    goal: "strength",
    places: ["gym"],
    phases: ["follicular", "ovulation", "luteal"],
    about: "Two simple full-body days to learn the main lifts. Alternate them, two or three times a week.",
    routines: [
      { name: "Full body A", exercises: [x("edb-0739", 3, 10), x("edb-0586", 3, 12), x("edb-0861", 3, 10), x("edb-0405", 3, 10), x("Plank", 3, "30", 60)] },
      {
        name: "Full body B",
        exercises: [x("edb-1760", 3, 10), x("edb-0085", 3, 8), x("edb-2330", 3, 10), x("edb-0025", 3, 8), x("Dead_Bug", 3, 10, 60)],
      },
    ],
  },
  {
    id: "gym-glutes",
    name: "Glutes & legs focus",
    level: "intermediate",
    goal: "glutes",
    places: ["gym"],
    phases: ["follicular", "ovulation"],
    about: "Hip thrusts, hinges and single-leg work for strong glutes and hamstrings.",
    routines: [
      {
        name: "Glutes & hamstrings",
        exercises: [x("Barbell_Glute_Bridge", 4, 10, 120), x("edb-0085", 3, 8, 120), x("edb-0410", 3, 10), x("edb-0597", 3, 15, 60), x("edb-0599", 3, 12, 60)],
      },
      { name: "Quads & calves", exercises: [x("Barbell_Full_Squat", 4, 8, 150), x("edb-0739", 3, 12), x("edb-0585", 3, 12, 60), x("edb-0336", 3, 10), x("edb-0594", 3, 15, 60)] },
    ],
  },
  {
    id: "gym-upper-lower",
    name: "Upper / lower",
    level: "intermediate",
    goal: "strength",
    places: ["gym"],
    phases: ["follicular", "ovulation"],
    about: "Four days a week, or two when life is busy. Upper and lower body on separate days.",
    routines: [
      {
        name: "Upper body",
        exercises: [
          x("edb-0025", 4, 8, 120),
          x("edb-0027", 4, 8, 120),
          x("edb-0405", 3, 10),
          x("edb-2330", 3, 10),
          x("edb-0313", 3, 12, 60),
          x("edb-0200", 3, 12, 60),
        ],
      },
      {
        name: "Lower body",
        exercises: [x("Barbell_Full_Squat", 4, 6, 150), x("edb-0085", 3, 8, 120), x("edb-0739", 3, 10), x("edb-0586", 3, 12, 60), x("edb-0594", 3, 15, 60), x("Hanging_Leg_Raise", 3, 10, 60)],
      },
    ],
  },
  {
    id: "dumbbells",
    name: "Dumbbells only",
    level: "beginner",
    goal: "tone",
    places: ["dumbbells", "home"],
    phases: ["follicular", "ovulation", "luteal"],
    about: "One pair of dumbbells, the whole body.",
    routines: [
      {
        name: "Dumbbell full body",
        exercises: [
          x("edb-0410", 3, 10),
          x("edb-0336", 3, 10),
          x("edb-0292", 3, 10),
          x("edb-0405", 3, 10),
          x("edb-0294", 3, 12, 60),
          x("Russian_Twist", 3, 16, 60),
        ],
      },
    ],
  },
  {
    id: "home-bodyweight",
    name: "At home, no equipment",
    level: "beginner",
    goal: "tone",
    places: ["home", "bodyweight"],
    phases: ["menstruation", "follicular", "luteal"],
    about: "Nothing needed but a little floor space.",
    routines: [
      {
        name: "Bodyweight full body",
        exercises: [
          x("Bodyweight_Squat", 3, 15, 60),
          x("Incline_Push-Up", 3, 10, 60),
          x("edb-3645", 3, 12, 60),
          x("Split_Squats", 3, 10, 60),
          x("Superman", 3, 12, 45),
          x("Plank", 3, "30", 45),
        ],
      },
    ],
  },
  {
    id: "travel",
    name: "Hotel room, 20 minutes",
    level: "beginner",
    goal: "tone",
    places: ["travel", "bodyweight"],
    phases: ["follicular", "ovulation", "luteal"],
    about: "A quick circuit for small spaces. Short rests, steady pace.",
    routines: [
      {
        name: "Travel circuit",
        exercises: [x("edb-1460", 3, 12, 30), x("edb-0662", 3, 10, 30), x("edb-0630", 3, "40", 30), x("Flutter_Kicks", 3, "30", 30), x("Superman", 3, 12, 30)],
      },
    ],
  },
  {
    id: "band",
    name: "Resistance band",
    level: "beginner",
    goal: "tone",
    places: ["band", "home", "travel"],
    phases: ["menstruation", "follicular", "luteal"],
    about: "A light band goes anywhere. Gentle on joints, good for posture.",
    routines: [
      {
        name: "Band full body",
        exercises: [
          x("edb-0991", 3, 12, 60),
          x("edb-3667", 3, 15, 45),
          x("edb-1022", 3, 15, 45),
          x("edb-0977", 3, 12, 45),
          x("edb-0993", 3, 12, 45),
          x("edb-1369", 3, 15, 45),
        ],
      },
    ],
  },
  {
    id: "kettlebell",
    name: "Kettlebell basics",
    level: "beginner",
    goal: "strength",
    places: ["kettlebell", "home"],
    phases: ["follicular", "ovulation"],
    about: "Squats and swings with a single kettlebell.",
    routines: [{ name: "Kettlebell full body", exercises: [x("edb-1760", 3, 12), x("edb-0549", 4, 12), x("Russian_Twist", 3, 16, 60), x("Plank", 3, "40", 45)] }],
  },
  {
    id: "cardio-hiit",
    name: "Cardio & HIIT",
    level: "beginner",
    goal: "cardio",
    places: ["cardio", "gym"],
    phases: ["follicular", "ovulation"],
    about: "Steady cardio on a machine, or short bursts when energy is high.",
    routines: [
      { name: "Steady cardio", exercises: [x("edb-2141", 1, "1200", 60), x("Rowing_Stationary", 1, "600", 60)] },
      { name: "Short intervals", exercises: [x("edb-2612", 6, "40", 40), x("edb-0630", 4, "30", 30), x("edb-2138", 1, "600", 60)] },
    ],
  },
  {
    id: "core",
    name: "Core & posture",
    level: "beginner",
    goal: "tone",
    places: ["home", "bodyweight"],
    phases: ["menstruation", "follicular", "ovulation", "luteal"],
    about: "A steady middle for everything else. Slow and controlled.",
    routines: [{ name: "Core", exercises: [x("Dead_Bug", 3, 10, 45), x("Plank", 3, "30", 45), x("edb-3544", 3, "20", 45), x("Russian_Twist", 3, 16, 45), x("Superman", 3, 12, 45)] }],
  },
  {
    id: "stretch",
    name: "Gentle stretch & mobility",
    level: "beginner",
    goal: "mobility",
    places: ["stretch", "home", "travel"],
    phases: ["menstruation", "luteal"],
    about: "Slow, soft stretches for heavy or tired days. Breathe into each one.",
    routines: [
      {
        name: "Gentle stretch",
        exercises: [
          x("Childs_Pose", 2, "60", 15),
          x("Cat_Stretch", 2, "45", 15),
          x("Intermediate_Hip_Flexor_and_Quad_Stretch", 2, "45", 15),
          x("Hamstring_Stretch", 2, "45", 15),
          x("edb-1559", 2, "30", 15),
        ],
      },
    ],
  },
];

export const PROGRAM = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));
