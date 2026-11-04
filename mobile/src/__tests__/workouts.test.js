import React from "react";
import { View } from "react-native";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { AppProvider, useApp, dateKey, STATE_KEY } from "../state/AppState";
import { TrackerSessionProvider } from "../state/TrackerSession";
import { findBlocked, AGREEMENT_VERSION } from "../shared";
import { Training } from "../screens/Training";
import { WorkoutLog } from "../screens/WorkoutLog";
import { ExercisePicker } from "../screens/ExercisePicker";
import { ExerciseDetail } from "../screens/ExerciseDetail";
import { Explore, ProgramDetail, Trainer, Place } from "../screens/Explore";
import { RoutineEditor } from "../screens/RoutineEditor";
import { WorkoutStats, Measures, WorkoutCalendar, WorkoutDetail } from "../screens/WorkoutPages";
import { Profile } from "../screens/Profile";
import { Fuel } from "../screens/Fuel";
import { LIBRARY, findExercises, logType, exerciseById } from "../lib/exercises";
import { exercisePicture } from "../content/exerciseMedia";
import { entryFrom, warmupSets, oneRepMax, workoutTotals, previousSets, exerciseHistory, weeklyTotals, setsPerMuscle } from "../lib/workout";
import { PROGRAMS } from "../content/programs";
import { sendPicked } from "../state/pickBus";

const NOW = new Date(2026, 9, 29, 15, 0);
const TODAY = dateKey(NOW);
const daysAgo = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return dateKey(d);
};
const Ready = ({ children }) => (useApp().ready ? <View testID="ready" style={{ flex: 1 }}>{children}</View> : null);

const mount = async (Screen, { params = {}, initial = {} } = {}) => {
  useLocalSearchParams.mockReturnValue(params);
  await render(
    <AppProvider
      now={NOW}
      initial={{
        onboarded: true,
        agreement: { version: AGREEMENT_VERSION, acceptedAt: "2026-10-01T09:00:00.000Z" },
        ...initial,
        profile: { lastPeriod: daysAgo(20), ...initial.profile },
      }}
    >
      <TrackerSessionProvider>
        <Ready>
          <Screen />
        </Ready>
      </TrackerSessionProvider>
    </AppProvider>
  );
  await screen.findByTestId("ready");
};
const stored = async () => {
  await act(async () => {});
  return JSON.parse(await AsyncStorage.getItem(STATE_KEY));
};
const allText = (node) => {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(allText).join(" ");
  return allText(node.children);
};

const PAST = {
  id: "w1",
  name: "Legs",
  date: daysAgo(3),
  startedAt: NOW.getTime() - 3 * 86400000,
  endedAt: NOW.getTime() - 3 * 86400000 + 50 * 60000,
  exercises: [{ id: "Barbell_Glute_Bridge", type: "weight", rest: 90, sets: [{ kg: "60", reps: "10", done: true }, { kg: "70", reps: "8", done: true }] }],
};

beforeEach(async () => {
  await AsyncStorage.clear();
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
});

describe("the exercise library", () => {
  it("has every program exercise, with sensible ways to log them", () => {
    expect(LIBRARY.length).toBeGreaterThan(800);
    for (const p of PROGRAMS) for (const r of p.routines) for (const e of r.exercises) expect(exerciseById(e.id)).toBeTruthy();
    expect(logType(exerciseById("Barbell_Squat"))).toBe("weight");
    expect(logType(exerciseById("Pushups"))).toBe("reps");
    expect(logType(exerciseById("Childs_Pose"))).toBe("duration");
    expect(entryFrom({ id: "Plank", sets: 3, seconds: 30 }).type).toBe("duration");
    expect(entryFrom({ id: "Superman", sets: 3, reps: 12 }).type).toBe("reps");
  });

  it("searches and filters by equipment and muscle", () => {
    const glutes = findExercises({ query: "glute bridge" });
    expect(glutes.some((e) => e.id === "Barbell_Glute_Bridge")).toBe(true);
    // only pictured exercises are offered; her own always are
    expect(findExercises({ limit: 9999 }).every((e) => e.gv)).toBe(true);
    expect(findExercises({ query: "mine", custom: [{ id: "c1", name: "Mine", p: [] }] })[0].id).toBe("c1");
    expect(findExercises({ equipment: "bands", limit: 999 }).every((e) => e.eq === "bands")).toBe(true);
    expect(findExercises({ muscle: "glutes", limit: 999 }).every((e) => e.p.includes("glutes"))).toBe(true);
  });

  it("covers the gym's machines and cables, with a picture where the dataset has one", () => {
    expect(LIBRARY.length).toBeGreaterThan(2000);
    expect(findExercises({ equipment: "smith machine", limit: 999 }).length).toBeGreaterThan(30);
    expect(findExercises({ query: "lat pulldown", equipment: "cable" }).length).toBeGreaterThan(3);
    const row = findExercises({ query: "cable seated row" })[0];
    expect(row.eq).toBe("cable");
    expect(row.p).toContain("middle back");
    expect(row.how.length).toBeGreaterThan(2);
    // pictures are linked, never copied in, and only stills, never animations
    expect(LIBRARY.filter((e) => e.gv).length).toBeGreaterThan(1300);
    expect(exercisePicture(LIBRARY.find((e) => e.gv)).uri).toMatch(/^https:\/\/raw\.githubusercontent\.com\/.+\.jpg$/);
    expect(exercisePicture({ id: "mine" })).toBeNull();
  });
});

describe("workout arithmetic", () => {
  it("works out warm-ups, one-rep max and totals", () => {
    expect(warmupSets(80).map((s) => s.kg)).toEqual(["32.5", "47.5", "65"]);
    expect(warmupSets(40).map((s) => s.kg)).toEqual(["20", "30"]);
    expect(warmupSets(5)).toEqual([]);
    expect(oneRepMax(100, 5)).toBe(116.7);
    expect(workoutTotals(PAST)).toEqual({ volume: 1160, sets: 2, reps: 18 });
  });

  it("reads history, weeks and muscles", () => {
    expect(previousSets([PAST], "Barbell_Glute_Bridge")[1]).toMatchObject({ kg: "70" });
    expect(exerciseHistory([PAST], "Barbell_Glute_Bridge")[0]).toMatchObject({ heaviest: 70, bestSet: "60 kg × 10" });
    const weeks = weeklyTotals([PAST], TODAY, 12);
    expect(weeks.reduce((a, w) => a + w.count, 0)).toBe(1);
    expect(setsPerMuscle([PAST], daysAgo(30))).toEqual({ glutes: 2 });
  });
});

describe("logging a workout", () => {
  it("starts an empty workout, adds an exercise, ticks a set and finishes", async () => {
    await mount(Training);
    await fireEvent.press(screen.getByRole("button", { name: "Start empty workout" }));
    expect(router.push).toHaveBeenCalledWith("/workout/log");
    await act(async () => {});
    let data = await stored();
    expect(data.activeWorkout).toMatchObject({ name: "Workout", exercises: [] });
    await cleanup();

    await mount(ExercisePicker, { params: { for: "workout" } });
    await fireEvent.changeText(screen.getByLabelText("Search exercise"), "barbell glute bridge");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Barbell Glute Bridge" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add 1 exercise" }));
    data = await stored();
    expect(data.activeWorkout.exercises).toEqual([expect.objectContaining({ id: "Barbell_Glute_Bridge", type: "weight" })]);
    await cleanup();

    await mount(WorkoutLog, { initial: { workouts: [PAST] } });
    expect(screen.getByTestId("exercise-0")).toHaveTextContent(/60 kg × 10/);
    await fireEvent.changeText(screen.getByLabelText("Set 1 kilograms"), "65");
    await fireEvent.changeText(screen.getByLabelText("Set 1 reps"), "10");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Set 1 done" }));
    expect(screen.getByTestId("rest-bar")).toHaveTextContent(/Rest 1:/);
    expect(screen.getByTestId("workout-volume")).toHaveTextContent("650 kg");
    // an empty set takes last time's numbers when ticked
    await fireEvent.press(screen.getByRole("checkbox", { name: "Set 2 done" }));
    expect(screen.getByTestId("workout-sets")).toHaveTextContent("2");
    await fireEvent.press(screen.getByRole("button", { name: "Finish" }));
    await fireEvent.changeText(screen.getByLabelText("Workout note"), "Felt strong");
    await fireEvent.press(screen.getByRole("button", { name: "Save workout" }));
    data = await stored();
    expect(data.activeWorkout).toBeNull();
    expect(data.workouts[0]).toMatchObject({ note: "Felt strong", date: TODAY });
    expect(data.workouts[0].exercises[0].sets.map((s) => [s.kg, s.reps])).toEqual([
      ["65", "10"],
      ["70", "8"],
    ]);
    expect(data.days[TODAY].activities[0]).toMatchObject({ kind: "strength", workoutId: data.workouts[0].id });
    expect(data.days[TODAY].entry).toMatchObject({ completed: true });
  });

  it("adds warm-up sets from the first working weight", async () => {
    await mount(WorkoutLog, {
      initial: { activeWorkout: { id: "a", name: "Legs", startedAt: NOW.getTime(), exercises: [entryFrom({ id: "Barbell_Squat", sets: 3, reps: 8 })] } },
    });
    await fireEvent.changeText(screen.getByLabelText("Set 1 kilograms"), "60");
    await fireEvent.press(screen.getByRole("button", { name: "Options for Barbell Squat" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add warm-up sets" }));
    expect(screen.getAllByText("W")).toHaveLength(3);
  });

  it("discards a workout", async () => {
    await mount(WorkoutLog, { initial: { activeWorkout: { id: "a", name: "Legs", startedAt: NOW.getTime(), exercises: [] } } });
    expect(screen.getByText("Get started")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Discard workout" }));
    await fireEvent.press(screen.getByRole("button", { name: "Yes, discard" }));
    expect((await stored()).activeWorkout).toBeNull();
  });

  it("starts the routine suggested for today's phase", async () => {
    await mount(Training);
    expect(screen.getByTestId("today-plan")).toBeOnTheScreen();
    const start = screen.getAllByRole("button", { name: /^Start / }).find((b) => b.props.accessibilityLabel !== "Start empty workout");
    await fireEvent.press(start);
    expect((await stored()).activeWorkout.exercises.length).toBeGreaterThan(2);
  });
});

describe("routines and explore", () => {
  it("builds a routine from picked exercises", async () => {
    await mount(RoutineEditor);
    await fireEvent.changeText(screen.getByLabelText("Routine name"), "Glute day");
    await act(async () => sendPicked(["Barbell_Glute_Bridge", "Plank"]));
    expect(screen.getByTestId("routine-items")).toHaveTextContent(/Barbell Glute Bridge/);
    await fireEvent.press(screen.getAllByRole("button", { name: "More sets" })[0]);
    await fireEvent.press(screen.getByRole("button", { name: "Save routine" }));
    const { routines } = await stored();
    expect(routines[0]).toMatchObject({ name: "Glute day" });
    expect(routines[0].exercises).toEqual([
      { id: "Barbell_Glute_Bridge", sets: 4, reps: 10, rest: 90 },
      { id: "Plank", sets: 3, seconds: 30, rest: 60 },
    ]);
  });

  it("filters programs and saves one to my routines", async () => {
    await mount(Explore);
    // the equipment filter chip comes before the routine tile of the same name
    await fireEvent.press(screen.getAllByRole("button", { name: "Band" })[0]);
    expect(screen.getByTestId("programs")).toHaveTextContent(/Resistance band/);
    expect(screen.getByTestId("programs")).not.toHaveTextContent(/Upper \/ lower/);
    await cleanup();

    await mount(ProgramDetail, { params: { id: "gym-glutes" } });
    await fireEvent.press(screen.getByRole("button", { name: "Save to my routines" }));
    expect((await stored()).routines.map((r) => r.name)).toEqual(["Quads & calves", "Glutes & hamstrings"]);
  });

  it("lets the trainer pick a program for the answers", async () => {
    await mount(Trainer);
    await fireEvent.press(screen.getByRole("button", { name: "Glutes & legs" }));
    expect(screen.getByTestId("trainer-pick")).toHaveTextContent(/Glutes & legs focus/);
    await fireEvent.press(screen.getByRole("button", { name: "Band" }));
    await fireEvent.press(screen.getByRole("button", { name: "Tone & condition" }));
    expect(screen.getByTestId("trainer-pick")).toHaveTextContent(/Resistance band/);
  });

  it("shows yoga and meditation with the stretch program", async () => {
    await mount(Place, { params: { key: "yoga" } });
    expect(screen.getByTestId("yoga-meditation")).toBeOnTheScreen();
    expect(screen.getByText("Gentle stretch & mobility")).toBeOnTheScreen();
  });
});

describe("exercise page", () => {
  it("shows the figure, progress, records and how-to", async () => {
    await mount(ExerciseDetail, { params: { id: "Barbell_Glute_Bridge" }, initial: { workouts: [PAST] } });
    expect(screen.getByTestId("body-figure")).toBeOnTheScreen();
    expect(screen.getByText("Primary: Glutes")).toBeOnTheScreen();
    expect(screen.getByTestId("personal-records")).toHaveTextContent(/Heaviest weight: 70 kg/);
    await fireEvent.press(screen.getByRole("tab", { name: "How to" }));
    expect(screen.getByText(/public-domain library/)).toBeOnTheScreen();
  });
});

describe("Profile training", () => {
  it("shows hours this week, the dashboard and recent workouts", async () => {
    await mount(Profile, { initial: { workouts: [{ ...PAST, date: TODAY }] } });
    expect(screen.getByTestId("training-stats")).toHaveTextContent(/0.8 hours this week · 1 workout/);
    await fireEvent.press(screen.getByRole("button", { name: "Statistics" }));
    expect(router.push).toHaveBeenCalledWith("/workout/stats");
  });

  it("counts sets per muscle", async () => {
    await mount(WorkoutStats, { initial: { workouts: [PAST] } });
    expect(screen.getByTestId("muscle-sets")).toHaveTextContent(/Glutes2 sets/);
  });

  it("keeps body measurements on the phone, never in a backup", async () => {
    await mount(Measures);
    await fireEvent.changeText(screen.getByLabelText("Weight in kg"), "62.5");
    await fireEvent.changeText(screen.getByLabelText("Waist in cm"), "70");
    await fireEvent.press(screen.getByRole("button", { name: "Save measurements" }));
    const data = await stored();
    expect(data.measures[0]).toMatchObject({ weight: 62.5, waist: 70, date: TODAY });
    const { toBackup } = require("../lib/backup");
    for (const c of ["cycle", "logs", "training", "nutrition"]) expect(JSON.stringify(toBackup(data, c))).not.toMatch(/62\.5/);
  });

  it("marks workout days on the calendar and opens a workout", async () => {
    await mount(WorkoutCalendar, { initial: { workouts: [PAST] } });
    await fireEvent.press(screen.getByTestId(`wday-${PAST.date}`));
    expect(screen.getByText("Legs")).toBeOnTheScreen();
    await cleanup();
    await mount(WorkoutDetail, { params: { id: "w1" }, initial: { workouts: [PAST] } });
    expect(screen.getByText(/70 kg × 8 reps/)).toBeOnTheScreen();
  });
});

describe("treat day", () => {
  it("is one tap in the diary and shows only a kind word", async () => {
    await mount(Fuel);
    await fireEvent.press(screen.getByRole("switch", { name: "Treat day" }));
    expect(screen.getByTestId("treat-note")).toHaveTextContent(/One day never undoes a steady rhythm/);
    expect(allText(screen.toJSON())).not.toMatch(/5,?000/);
    expect((await stored()).days[TODAY].food.treat).toBe(true);
  });
});

describe("copy", () => {
  it.each([
    ["Training", Training, {}],
    ["Explore", Explore, {}],
    ["Trainer", Trainer, {}],
    ["Measures", Measures, {}],
    ["WorkoutStats", WorkoutStats, {}],
  ])("%s shows no blocked phrase", async (_n, Screen, params) => {
    await mount(Screen, { params });
    expect(findBlocked(allText(screen.toJSON()))).toEqual([]);
  });
});
