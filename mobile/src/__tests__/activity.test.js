import React from "react";
import { View } from "react-native";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { AppProvider, useApp, dateKey, STATE_KEY } from "../state/AppState";
import { TrackerSessionProvider } from "../state/TrackerSession";
import { findBlocked, AGREEMENT_VERSION } from "../shared";
import { Training } from "../screens/Training";
import { WorkoutToday } from "../screens/WorkoutToday";
import { ActivityAdd } from "../screens/ActivityAdd";
import { Meditate } from "../screens/Meditate";
import { Photos } from "../screens/Photos";
import { Profile } from "../screens/Profile";
import { ProfileSection } from "../screens/ProfileSection";
const part = (section) => () => <ProfileSection section={section} />;
import { FoodGoal } from "../screens/FoodGoal";
import { Home } from "../screens/Home";
import { caloriesFor, stepCalories, activitiesOf, dayMovement, youTubeId, fetchVideoTitle, youTubeSearch } from "../lib/activity";
import { encouragement } from "../lib/encourage";
import { macrosFor, goalFromBody } from "../lib/energy";
import { journeyDays, journeyWeeks } from "../lib/journey";
import { toBackup } from "../lib/backup";

const NOW = new Date(2026, 9, 29, 15, 0);
const TODAY = dateKey(NOW);
const daysAgo = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return dateKey(d);
};

const Ready = ({ children }) => (useApp().ready ? <View testID="ready" style={{ flex: 1 }}>{children}</View> : null);

/** Day 21 of 28 by default: the luteal phase. */
const mount = async (Screen, { params = {}, profile = {}, days } = {}) => {
  useLocalSearchParams.mockReturnValue(params);
  await render(
    <AppProvider
      now={NOW}
      initial={{
        onboarded: true,
        agreement: { version: AGREEMENT_VERSION, acceptedAt: "2026-10-01T09:00:00.000Z" },
        profile: { lastPeriod: daysAgo(20), ...profile },
        ...(days ? { days } : {}),
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
const showNumbers = () => AsyncStorage.setItem("selena.hideNumbers", "false");
const allText = (node) => {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(allText).join(" ");
  return allText(node.children);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  global.fetch.mockReset();
  global.fetch.mockImplementation(() => Promise.reject(new Error("offline in tests")));
  router.push.mockClear();
  router.back.mockClear();
});

describe("energy burned", () => {
  it("uses MET values and body weight", () => {
    expect(caloriesFor({ kind: "yoga", minutes: 30 }, 65)).toBe(81);
    expect(caloriesFor({ kind: "run", minutes: 30 }, 60)).toBe(240);
    expect(caloriesFor({ kind: "meditation", minutes: 20 }, 65)).toBe(0);
    expect(stepCalories(8000, 70)).toBe(320);
    expect(stepCalories(8000, 65)).toBe(297);
  });

  it("counts the tracker's activities as well as its own, by group", () => {
    const day = {
      steps: 5000,
      activities: [
        { id: "a", kind: "yoga", minutes: 20 },
        { id: "b", kind: "meditation", minutes: 10 },
      ],
      journal: { activities: { items: { running: { duration: 30 }, rest: {} } } },
    };
    expect(activitiesOf(day).map((a) => a.kind)).toEqual(["yoga", "meditation", "run"]);
    const m = dayMovement(day, 65);
    expect(m.minutes).toEqual({ exercise: 30, yoga: 20, meditation: 10 });
    expect(m.kcal).toBe(caloriesFor({ kind: "yoga", minutes: 20 }, 65) + caloriesFor({ kind: "run", minutes: 30 }, 65) + stepCalories(5000, 65));
    expect(m.moved).toBe(true);
    expect(dayMovement({ activities: [{ kind: "meditation", minutes: 10 }] }).moved).toBe(false);
  });

  it("reads YouTube links and fetches a title without an account", async () => {
    expect(youTubeId("https://www.youtube.com/watch?v=abcdefghijk&t=10s")).toBe("abcdefghijk");
    expect(youTubeId("https://youtu.be/abcdefghijk")).toBe("abcdefghijk");
    expect(youTubeId("https://www.youtube.com/shorts/abcdefghijk")).toBe("abcdefghijk");
    expect(youTubeId("https://example.com/video")).toBeNull();
    global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ title: "Yin yoga, 20 minutes" }) }));
    expect(await fetchVideoTitle("https://youtu.be/abcdefghijk")).toBe("Yin yoga, 20 minutes");
    expect(global.fetch.mock.calls[0][0]).toMatch(/^https:\/\/www\.youtube\.com\/oembed\?format=json&url=/);
    expect(youTubeSearch("yin yoga")).toBe("https://www.youtube.com/results?search_query=yin%20yoga");
  });
});

describe("encouragement", () => {
  it("celebrates moving through the luteal phase", () => {
    expect(encouragement({ phase: "luteal", moved: true }).title).toBe("Wow, look at you!");
    expect(encouragement({ phase: "menstruation", moved: true }).key).toBe("period-moved");
  });

  it("celebrates rest when the body asked for it", () => {
    const m = encouragement({ phase: "luteal", moved: false, signals: ["sugar"] });
    expect(m.key).toBe("rest-right");
    expect(m.body).toMatch(/not giving up/);
  });

  it("stays quiet with nothing to say, and never uses a blocked phrase", () => {
    expect(encouragement({ phase: "follicular", moved: false })).toBeNull();
    const all = [
      { phase: "luteal", moved: true },
      { phase: "menstruation", moved: true },
      { phase: "follicular", moved: true, signals: ["fatigue"] },
      { phase: "ovulation", moved: true },
      { phase: "luteal", signals: ["cramps"] },
      { phase: "luteal", meditated: true },
    ].map(encouragement);
    for (const m of all) expect(findBlocked(`${m.title} ${m.body}`)).toEqual([]);
  });
});

describe("eating styles", () => {
  it("shares the same energy differently for each style", () => {
    expect(macrosFor(2000, { diet: "balanced", kg: 60 })).toEqual({ protein: 96, carbs: 253, fat: 67 });
    expect(macrosFor(2000, { diet: "high-protein", kg: 60 }).protein).toBe(120);
    expect(macrosFor(2000, { diet: "low-carb", kg: 60 }).carbs).toBeLessThan(macrosFor(2000, { diet: "balanced", kg: 60 }).carbs);
    expect(macrosFor(2000, { diet: "low-fat" }).fat).toBe(44);
    // without a weight, protein is a share of energy
    expect(macrosFor(2000, { diet: "balanced" }).protein).toBe(100);
  });

  it("keeps the balanced goal as before", () => {
    expect(goalFromBody({ kg: 65, cm: 165, age: 30 })).toMatchObject({ kcal: 1880, protein: 104, fat: 63, carbs: 224 });
  });
});

describe("journey numbers", () => {
  it("adds up days and weeks", () => {
    const days = {
      [TODAY]: { food: { entries: [{ meal: "lunch", fixed: { kcal: 500 }, portions: 1 }] }, activities: [{ id: "a", kind: "yoga", minutes: 30 }], steps: 7000 },
      [daysAgo(1)]: { activities: [{ id: "b", kind: "meditation", minutes: 10 }] },
    };
    const week = journeyDays(days, TODAY, 7, 65);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ date: TODAY, eaten: 500, yoga: 30, steps: 7000, logged: true });
    expect(week[5]).toMatchObject({ meditation: 10, logged: false });
    const month = journeyWeeks(days, TODAY, 4, 65);
    expect(month[3]).toMatchObject({ eaten: 500, yoga: 30, meditation: 10, steps: 1000 });
  });
});

describe("the Workouts tab", () => {
  it("shows today's activity, reads steps from the iPhone and encourages luteal training", async () => {
    await showNumbers();
    await mount(WorkoutToday);
    await fireEvent.press(screen.getByRole("button", { name: "Get steps from iPhone" }));
    await act(async () => {});
    expect(screen.getByTestId("steps-value")).toHaveTextContent("6,400 / 8,000");
    expect((await stored()).days[TODAY].steps).toBe(6400);
    // a walk logged today, in the luteal phase
    await fireEvent.press(screen.getByRole("button", { name: "Type your steps" }));
    await fireEvent.changeText(screen.getByLabelText("Steps today"), "9000");
    await fireEvent.press(screen.getByRole("button", { name: "Save steps" }));
    expect(screen.getByTestId("steps-value")).toHaveTextContent("9,000 / 8,000");
  });

  it("encourages, and offers a progress photo, after moving in the luteal phase", async () => {
    await mount(Training, {
      profile: { photoReminder: true },
      days: { [TODAY]: { activities: [{ id: "x", kind: "yoga", minutes: 25, title: "Yin yoga" }] } },
    });
    expect(screen.getByTestId("encouragement")).toHaveTextContent(/Wow, look at you!/);
    await fireEvent.press(screen.getByRole("button", { name: "Take a progress photo" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/photos", params: { take: "1" } });
    await fireEvent.press(screen.getByRole("button", { name: "Not today" }));
    expect(screen.queryByTestId("photo-nudge")).toBeNull();
  });

  it("praises rest when the tracker shows cravings and nothing was done", async () => {
    await mount(Home, { days: { [TODAY]: { journal: { cravings: { items: { chocolate: { intensity: 4 } } } } } } });
    expect(screen.getByTestId("encouragement")).toHaveTextContent(/Rest is exactly right today/);
  });

  it("logs a yoga video with its title from YouTube", async () => {
    global.fetch.mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ title: "Yoga for cramps" }) }));
    await mount(ActivityAdd, { params: { kind: "yoga" } });
    expect(screen.getByRole("button", { name: "Yoga" })).toHaveProp("accessibilityState", expect.objectContaining({ selected: true }));
    await fireEvent.press(screen.getByRole("button", { name: "20" }));
    await fireEvent.changeText(screen.getByLabelText("YouTube link"), "https://youtu.be/abcdefghijk");
    await act(async () => {});
    expect(screen.getByLabelText("Activity name").props.value).toBe("Yoga for cramps");
    await fireEvent.press(screen.getByRole("button", { name: "Save activity" }));
    expect((await stored()).days[TODAY].activities[0]).toMatchObject({
      kind: "yoga",
      minutes: 20,
      title: "Yoga for cramps",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
    });
  });

  it("adds calm minutes from the meditation timer", async () => {
    await mount(Meditate);
    await fireEvent.press(screen.getByRole("button", { name: "10 min" }));
    expect(screen.getByTestId("meditation-time")).toHaveTextContent("10:00");
    await fireEvent.press(screen.getByRole("button", { name: "Begin" }));
    await fireEvent.press(screen.getByRole("button", { name: "Finish now" }));
    expect((await stored()).days[TODAY].activities[0]).toMatchObject({ kind: "meditation", minutes: 1 });
  });
});

describe("progress photos", () => {
  it("keeps a photo with a note, and the reminder choice", async () => {
    await mount(Photos);
    await fireEvent.press(screen.getByRole("button", { name: "Take a photo" }));
    await act(async () => {});
    await fireEvent.changeText(screen.getByLabelText("Photo note"), "Stronger on the stairs");
    await fireEvent.press(screen.getByRole("button", { name: "Save photo" }));
    await fireEvent.press(screen.getByRole("button", { name: "On" }));
    const data = await stored();
    expect(data.photos[0]).toMatchObject({ date: TODAY, note: "Stronger on the stairs" });
    expect(data.photos[0].uri).toMatch(/progress-photos/);
    expect(data.profile.photoReminder).toBe(true);
  });

  it("never backs up photos, but backs up activity and steps", () => {
    const data = { profile: {}, photos: [{ id: "p", uri: "file://x" }], days: { [TODAY]: { activities: [{ kind: "yoga", minutes: 20 }], steps: 4000 } } };
    expect(JSON.stringify(toBackup(data, "training"))).not.toMatch(/file:\/\//);
    expect(toBackup(data, "training").days[TODAY]).toEqual({ activities: [{ kind: "yoga", minutes: 20 }], steps: 4000 });
  });
});

describe("Profile", () => {
  it("shows the journey and every goal, hiding figures when asked", async () => {
    await mount(part("journey"), { days: { [TODAY]: { activities: [{ id: "a", kind: "yoga", minutes: 30 }] } } });
    expect(screen.getByTestId("journey")).toBeOnTheScreen();
    expect(screen.getByTestId("journey-move")).toHaveTextContent(/Yoga 30 min/);
    expect(screen.queryByTestId("journey-burned")).toBeNull();
    // the month's insight lives on its own page now
    expect(screen.queryByTestId("month-insight")).toBeNull();
    await cleanup();
    await mount(part("insights"));
    expect(screen.getByTestId("month-insight")).toBeOnTheScreen();
    await cleanup();
    await mount(part("goals"));
    expect(screen.getByTestId("profile-energy")).toHaveTextContent(/Hidden/);
    await fireEvent.press(screen.getByRole("button", { name: "Edit your goals" }));
    expect(router.push).toHaveBeenCalledWith("/food/goal");
  });

  it("shows figures when numbers are on", async () => {
    await showNumbers();
    await mount(part("goals"), { profile: { nutritionGoal: { kcal: 1700, protein: 100, carbs: 180, fat: 60 }, diet: "low-fat" } });
    expect(screen.getByTestId("profile-energy")).toHaveTextContent(/1,700 kcal a day/);
    expect(screen.getByTestId("profile-diet")).toHaveTextContent(/Low fat/);
  });

  it("picks an eating style and a steps goal in the goal screen", async () => {
    await mount(FoodGoal);
    await fireEvent.changeText(screen.getByLabelText("Weight in kilograms"), "65");
    await fireEvent.changeText(screen.getByLabelText("Height in centimetres"), "165");
    await fireEvent.press(screen.getByRole("radio", { name: "High protein" }));
    expect(screen.getByTestId("goal-result")).toHaveTextContent(/Protein 130 g/);
    await fireEvent.changeText(screen.getByLabelText("Steps goal"), "10000");
    await fireEvent.press(screen.getByRole("button", { name: "Use this goal" }));
    const { profile } = await stored();
    expect(profile).toMatchObject({ diet: "high-protein", stepGoal: 10000, nutritionGoal: expect.objectContaining({ protein: 130 }) });
  });

  it.each([
    ["Training", Training],
    ["ActivityAdd", ActivityAdd],
    ["Meditate", Meditate],
    ["Photos", Photos],
    ["Profile", Profile],
  ])("%s shows no blocked phrase", async (_n, Screen) => {
    await mount(Screen);
    expect(findBlocked(allText(screen.toJSON()))).toEqual([]);
  });
});
