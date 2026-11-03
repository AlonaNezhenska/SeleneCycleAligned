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
      { name: "Full body A", exercises: [x("Leg_Press", 3, 10), x("Lying_Leg_Curls", 3, 12), x("Seated_Cable_Rows", 3, 10), x("Dumbbell_Shoulder_Press", 3, 10), x("Plank", 3, "30", 60)] },
      {
        name: "Full body B",
        exercises: [x("Goblet_Squat", 3, 10), x("Romanian_Deadlift", 3, 8), x("Full_Range-Of-Motion_Lat_Pulldown", 3, 10), x("Barbell_Bench_Press_-_Medium_Grip", 3, 8), x("Dead_Bug", 3, 10, 60)],
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
        exercises: [x("Barbell_Hip_Thrust", 4, 10, 120), x("Romanian_Deadlift", 3, 8, 120), x("Split_Squat_with_Dumbbells", 3, 10), x("Thigh_Abductor", 3, 15, 60), x("Seated_Leg_Curl", 3, 12, 60)],
      },
      { name: "Quads & calves", exercises: [x("Barbell_Squat", 4, 8, 150), x("Leg_Press", 3, 12), x("Leg_Extensions", 3, 12, 60), x("Dumbbell_Lunges", 3, 10), x("Seated_Calf_Raise", 3, 15, 60)] },
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
          x("Barbell_Bench_Press_-_Medium_Grip", 4, 8, 120),
          x("Bent_Over_Barbell_Row", 4, 8, 120),
          x("Dumbbell_Shoulder_Press", 3, 10),
          x("Full_Range-Of-Motion_Lat_Pulldown", 3, 10),
          x("Hammer_Curls", 3, 12, 60),
          x("Triceps_Pushdown_-_Rope_Attachment", 3, 12, 60),
        ],
      },
      {
        name: "Lower body",
        exercises: [x("Barbell_Squat", 4, 6, 150), x("Romanian_Deadlift", 3, 8, 120), x("Leg_Press", 3, 10), x("Lying_Leg_Curls", 3, 12, 60), x("Seated_Calf_Raise", 3, 15, 60), x("Hanging_Leg_Raise", 3, 10, 60)],
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
          x("Split_Squat_with_Dumbbells", 3, 10),
          x("Dumbbell_Lunges", 3, 10),
          x("One-Arm_Dumbbell_Row", 3, 10),
          x("Dumbbell_Shoulder_Press", 3, 10),
          x("Dumbbell_Bicep_Curl", 3, 12, 60),
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
          x("Single_Leg_Glute_Bridge", 3, 12, 60),
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
        exercises: [x("Bodyweight_Walking_Lunge", 3, 12, 30), x("Pushups", 3, 10, 30), x("Mountain_Climbers", 3, "40", 30), x("Flutter_Kicks", 3, "30", 30), x("Superman", 3, 12, 30)],
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
          x("Band_Good_Morning", 3, 12, 60),
          x("Band_Hip_Adductions", 3, 15, 45),
          x("Band_Pull_Apart", 3, 15, 45),
          x("Lateral_Raise_-_With_Bands", 3, 12, 45),
          x("Back_Flyes_-_With_Bands", 3, 12, 45),
          x("Calf_Raises_-_With_Bands", 3, 15, 45),
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
    routines: [{ name: "Kettlebell full body", exercises: [x("Goblet_Squat", 3, 12), x("One-Arm_Kettlebell_Swings", 4, 12), x("Russian_Twist", 3, 16, 60), x("Plank", 3, "40", 45)] }],
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
      { name: "Steady cardio", exercises: [x("Elliptical_Trainer", 1, "1200", 60), x("Rowing_Stationary", 1, "600", 60)] },
      { name: "Short intervals", exercises: [x("Rope_Jumping", 6, "40", 40), x("Mountain_Climbers", 4, "30", 30), x("Bicycling_Stationary", 1, "600", 60)] },
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
    routines: [{ name: "Core", exercises: [x("Dead_Bug", 3, 10, 45), x("Plank", 3, "30", 45), x("Side_Bridge", 3, "20", 45), x("Russian_Twist", 3, 16, 45), x("Superman", 3, 12, 45)] }],
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
          x("Kneeling_Hip_Flexor", 2, "45", 15),
          x("Seated_Floor_Hamstring_Stretch", 2, "45", 15),
          x("Standing_Hip_Flexors", 2, "30", 15),
        ],
      },
    ],
  },
];

export const PROGRAM = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));
