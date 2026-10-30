import React from "react";
import { View } from "react-native";
import { render, screen, fireEvent, act, within, cleanup } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AppProvider, useApp, dateKey, STATE_KEY } from "../state/AppState";
import { findBlocked, AGREEMENT_VERSION } from "../shared";
import { Privacy } from "../screens/Privacy";
import { AuthCallback } from "../screens/AuthCallback";
import { Profile } from "../screens/Profile";
import { EditCycle, EditAbout } from "../screens/EditProfile";
import { Home } from "../screens/Home";
import { Triad } from "../screens/Triad";
import { Cycle } from "../screens/Cycle";
import { Training } from "../screens/Training";
import { Fuel } from "../screens/Fuel";
import { Onboarding } from "../screens/Onboarding";

/** A fixed afternoon so the Pre-Flight nudge stays out of the way. */
const NOW = new Date(2026, 9, 29, 15, 0);
const periodDaysAgo = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return dateKey(d);
};

/** Children render only once saved data has loaded, as in the app. */
const Ready = ({ children }) => (useApp().ready ? <View testID="ready" style={{ flex: 1 }}>{children}</View> : null);

const mount = async (Screen, { profile = {}, onboarded = true, now = NOW, days } = {}) => {
  await render(
    <AppProvider
      now={now}
      initial={{
        onboarded,
        agreement: onboarded ? { version: AGREEMENT_VERSION, acceptedAt: "2026-10-01T09:00:00.000Z" } : null,
        profile: { lastPeriod: periodDaysAgo(20), ...profile },
        ...(days ? { days } : {}),
      }}
    >
      <Ready>
        <Screen />
      </Ready>
    </AppProvider>
  );
  await screen.findByTestId("ready");
};

/** Every string on screen, for copy checks. */
const allText = (node) => {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(allText).join(" ");
  return allText(node.children);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  router.replace.mockClear();
  router.push.mockClear();
});
afterEach(() => jest.useRealTimers());

describe("Hide Numbers", () => {
  it("is on by default and masks every value as ••", async () => {
    await mount(Fuel);
    expect(screen.getByRole("switch", { name: "Hide numbers" })).toBeChecked();
    expect(screen.getByTestId("meter-Energy")).toHaveTextContent("••");
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("••");
  });

  it("persists after the app is closed and reopened", async () => {
    await mount(Fuel);
    await fireEvent.press(screen.getByRole("switch", { name: "Hide numbers" }));
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("0 / 110 g");
    // closing the app: cleanup(), not unmount(), keeps later renders working
    await cleanup();

    await mount(Fuel);
    expect(screen.getByRole("switch", { name: "Hide numbers" })).not.toBeChecked();
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("0 / 110 g");
  });
});

describe("Fuel log", () => {
  it("adds protein and keeps it for the day", async () => {
    await mount(Fuel);
    await fireEvent.press(screen.getByRole("switch", { name: "Hide numbers" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add 30 grams of protein" }));
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("30 / 110 g");
    await act(async () => {});
    // closing the app: cleanup(), not unmount(), keeps later renders working
    await cleanup();

    await mount(Fuel);
    expect(screen.getByTestId("meter-Protein")).toHaveTextContent("30 / 110 g");
  });
});

describe("Vibe Check", () => {
  it("each option changes the prescription card", async () => {
    await mount(Home);
    for (const [mode, title] of [
      ["Inward", "Recovery Day"],
      ["Steady", "Baseline Strength"],
      ["Outward", "Heavy Strength or SIT"],
    ]) {
      await fireEvent.press(screen.getByRole("radio", { name: new RegExp(`^${mode}`) }));
      expect(within(screen.getByTestId("prescription")).getByText(title)).toBeOnTheScreen();
    }
  });

  it("prompts for a Vibe Check on birth control and defaults to Steady", async () => {
    await mount(Home, { profile: { onBirthControl: true } });
    expect(screen.getByText(/tell us how today feels/i)).toBeOnTheScreen();
    expect(within(screen.getByTestId("prescription")).getByText("Baseline Strength")).toBeOnTheScreen();
  });
});

describe("Weekly mood bubble", () => {
  it("fills with each vibe chosen this week", async () => {
    await mount(Home);
    expect(screen.getByTestId("week-headline")).toHaveTextContent(/fills as you check in/);
    await fireEvent.press(screen.getByRole("radio", { name: /^Inward/ }));
    expect(screen.getByTestId("week-headline")).toHaveTextContent("All Inward so far.");
    expect(screen.getByLabelText(/Mood bubble, 1 Inward, 0 Balance, 0 Outward, 1 of 7 days/)).toBeOnTheScreen();
  });

  it("shows earlier weeks when their bubble is tapped", async () => {
    // NOW is Thursday 29 October; the week before starts Monday 19 October
    await mount(Home, {
      days: {
        "2026-10-19": { vibe: "Outward" },
        "2026-10-20": { vibe: "Outward" },
        "2026-10-21": { vibe: "Steady" },
      },
    });
    await fireEvent.press(screen.getByRole("button", { name: /^Last week: 0 Inward, 1 Balance, 2 Outward/ }));
    expect(screen.getByTestId("week-headline")).toHaveTextContent(/Mostly Outward/);
  });

  it("uses the new names on the Vibe Check", async () => {
    await mount(Home);
    expect(screen.getByRole("radio", { name: "Steady, Balance" })).toBeOnTheScreen();
  });
});

describe("Today's motivation", () => {
  it("shows a picture at the top of Home and opens it full size", async () => {
    await mount(Home);
    const card = screen.getByRole("imagebutton", { name: /Today's motivation/ });
    await fireEvent.press(card);
    expect(screen.getByRole("button", { name: "Close picture" })).toBeOnTheScreen();
  });

  it("no longer shows the Showing up streak", async () => {
    await mount(Home);
    expect(screen.queryByText(/Showing up/i)).toBeNull();
    expect(screen.queryByLabelText("Paused")).toBeNull();
  });
});

describe("Late Luteal Fork", () => {
  it("shows on day 27 and routes Hermit to the wipeout path", async () => {
    await mount(Home, { profile: { lastPeriod: periodDaysAgo(26) } });
    await fireEvent.press(screen.getByRole("button", { name: "The Hermit" }));
    expect(screen.getByText(/low tide/i)).toBeOnTheScreen();
    expect(within(screen.getByTestId("prescription")).getByText("Recovery Day")).toBeOnTheScreen();
  });
});

describe("Triad Tracker", () => {
  it("saving shows exactly one tip", async () => {
    await mount(Triad);
    await fireEvent.press(screen.getByRole("button", { name: /^Fuel:/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Sweet / sugar" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save entry" }));
    const tips = screen.getAllByTestId("tip");
    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent(/dark chocolate/i);
  });

  it("keeps the day's log after reopening", async () => {
    await mount(Triad);
    await fireEvent.press(screen.getByRole("button", { name: "Heavy" }));
    await act(async () => {});
    // closing the app: cleanup(), not unmount(), keeps later renders working
    await cleanup();
    await mount(Triad);
    expect(screen.getByRole("button", { name: "Heavy" })).toBeSelected();
    expect(JSON.parse(await AsyncStorage.getItem(STATE_KEY)).days[dateKey(NOW)].triad.flow).toEqual(["Heavy"]);
  });
});

describe("Training Protocol", () => {
  it("offers the Bailout at ten minutes, once", async () => {
    jest.useFakeTimers({ now: NOW });
    await mount(Training);
    await fireEvent.press(screen.getByRole("button", { name: "Start session" }));

    await act(async () => jest.advanceTimersByTime(9 * 60 * 1000 + 59 * 1000));
    expect(screen.queryByTestId("bailout")).toBeNull();
    await act(async () => jest.advanceTimersByTime(1000));
    expect(screen.getByTestId("bailout")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Keep going" }));
    await act(async () => jest.advanceTimersByTime(5 * 60 * 1000));
    expect(screen.queryByTestId("bailout")).toBeNull();
  });

  it("ending a session opens the 45-minute 35g window and earns the check", async () => {
    jest.useFakeTimers({ now: NOW });
    await mount(Training);
    await fireEvent.press(screen.getByRole("button", { name: "Start session" }));
    await act(async () => jest.advanceTimersByTime(20 * 60 * 1000));
    await fireEvent.press(screen.getByRole("button", { name: "End session" }));
    const win = screen.getByTestId("protein-window");
    expect(win).toHaveTextContent(/35g\+/);
    expect(win).toHaveTextContent(/45:00/);
    expect(screen.getByLabelText("Done today")).toBeOnTheScreen();
  });

  it("shows the 15g Pre-Flight nudge before 11:00", async () => {
    await mount(Training, { now: new Date(2026, 9, 29, 7, 0) });
    expect(screen.getByTestId("preflight")).toHaveTextContent(/15g/);
  });

  it("swaps spin to SIT on an Outward day", async () => {
    await mount(Training, { profile: { lastPeriod: periodDaysAgo(8) } });
    await fireEvent.press(screen.getByRole("button", { name: "Spin class" }));
    expect(screen.getByText(/Spin class swaps to SIT/)).toBeOnTheScreen();
  });

  it("40+ on an Inward day gets rest with no plyometrics", async () => {
    await mount(Training, { profile: { ageGroup: "40+", lastPeriod: periodDaysAgo(1) } });
    expect(screen.getByText("Recovery Day")).toBeOnTheScreen();
    expect(screen.queryByText(/plyometrics/i)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Rest taken" }));
    expect(screen.getByLabelText("Done today")).toBeOnTheScreen();
  });
});

describe("Luteal Buffer", () => {
  it("is offered in the luteal phase", async () => {
    await mount(Fuel);
    expect(screen.getByTestId("luteal-buffer")).toBeOnTheScreen();
  });

  it("is hidden in the follicular phase", async () => {
    await mount(Fuel, { profile: { lastPeriod: periodDaysAgo(8) } });
    expect(screen.queryByTestId("luteal-buffer")).toBeNull();
  });

  it("is hidden on hormonal birth control", async () => {
    await mount(Fuel, { profile: { onBirthControl: true } });
    expect(screen.queryByTestId("luteal-buffer")).toBeNull();
  });

  it("only moves the target once accepted", async () => {
    await mount(Fuel);
    await fireEvent.press(screen.getByRole("switch", { name: "Hide numbers" }));
    expect(screen.getByTestId("meter-Energy")).toHaveTextContent("0 / 1,850 kcal");
    await fireEvent.press(screen.getByRole("button", { name: "Use the buffer" }));
    expect(screen.getByTestId("meter-Energy")).toHaveTextContent("0 / 2,000–2,150 kcal");
  });
});

describe("Cycle Calendar", () => {
  const layout = () =>
    fireEvent(screen.getByTestId("phase-column"), "layout", {
      nativeEvent: { layout: { width: 340, height: 500 } },
    });

  it("marks today and lets a phase label jump the marker", async () => {
    await mount(Cycle);
    await layout();
    expect(screen.getByTestId("selected-day")).toHaveTextContent("Today · Day 21 of 28 · Early luteal");
    expect(screen.getByTestId("cycle-slider").props.accessibilityValue.text).toBe("Day 21 of 28");
    await fireEvent.press(screen.getByRole("button", { name: "Ovulation, days 14 to 16" }));
    expect(screen.getByTestId("selected-day")).toHaveTextContent("Exploring · Day 14 of 28 · Ovulatory");
    await fireEvent.press(screen.getByRole("button", { name: "Back to today" }));
    expect(screen.getByTestId("selected-day")).toHaveTextContent(/Today · Day 21/);
  });

  it("moves day by day for screen readers", async () => {
    await mount(Cycle);
    await layout();
    const slider = screen.getByTestId("cycle-slider");
    await fireEvent(slider, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(screen.getByTestId("selected-day")).toHaveTextContent(/Day 22 of 28/);
  });

  it("scales the ranges to a 35-day cycle", async () => {
    await mount(Cycle, { profile: { cycleLength: 35 } });
    await layout();
    expect(screen.getByRole("button", { name: "Luteal, days 21 to 35" })).toBeOnTheScreen();
  });
});

describe("Onboarding", () => {
  it("walks through every step, saves the answers and opens the app", async () => {
    await mount(Onboarding, { onboarded: false, profile: { lastPeriod: null } });
    const texts = [];
    const snap = () => texts.push(allText(screen.toJSON()));

    snap();
    await fireEvent.press(screen.getByRole("button", { name: "Get started" }));
    snap();
    expect(screen.getByRole("button", { name: "Tick the box to continue" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("checkbox", { name: /never shared/i }));
    await fireEvent.press(screen.getByRole("button", { name: "Agree and continue" }));
    snap();
    await fireEvent.press(screen.getByRole("radio", { name: "Stronger" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();
    expect(screen.getByRole("checkbox", { name: "Cycle, always on" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Training" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();
    await fireEvent.press(screen.getAllByRole("button", { name: "40+" })[0]);
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();

    // last period: first day, then last day, on the calendar
    await fireEvent.press(screen.getByRole("button", { name: "Thursday, 22 October 2026" }));
    await fireEvent.press(screen.getByRole("button", { name: "Monday, 26 October 2026" }));
    expect(screen.getByTestId("last-period-summary")).toHaveTextContent(/5 days/);
    expect(screen.getByRole("button", { name: "Saturday, 31 October 2026" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();

    // cycle length unknown: work it out from the period before
    await fireEvent.press(screen.getByRole("button", { name: "I don't know" }));
    await fireEvent.press(screen.getByRole("button", { name: "Previous month" }));
    await fireEvent.press(screen.getByRole("button", { name: "Wednesday, 23 September 2026" }));
    expect(screen.getByTestId("cycle-estimate")).toHaveTextContent(/about 29 days/);
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();

    await fireEvent.press(screen.getByRole("checkbox", { name: "PMDD" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Luteal drag" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();
    await fireEvent.press(screen.getByRole("radio", { name: "Visual plates" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    snap();
    expect(screen.getAllByText(/scales lie/i).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole("button", { name: "Choose from library" }));
    await act(async () => {});
    expect(screen.getByLabelText("Your baseline photo, face softened")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Enter the sanctuary" }));
    await act(async () => {});

    expect(router.replace).toHaveBeenCalledWith("/");
    const stored = JSON.parse(await AsyncStorage.getItem(STATE_KEY));
    expect(stored.onboarded).toBe(true);
    expect(stored.agreement.version).toBe(AGREEMENT_VERSION);
    expect(stored.profile).toMatchObject({
      goal: "Stronger",
      ageGroup: "40+",
      lastPeriod: "2026-10-22",
      lastPeriodEnd: "2026-10-26",
      periodLength: 5,
      cycleMode: "unknown",
      previousPeriod: "2026-09-23",
      hurdles: ["PMDD", "Luteal drag"],
      trackingStyle: "Visual plates",
      tracking: { training: false, nutrition: true },
    });
    for (const t of texts) expect(findBlocked(t)).toEqual([]);
  });
});

describe("What Selena follows", () => {
  it("hides the training plan on Home when training is switched off", async () => {
    await mount(Home, { profile: { tracking: { training: false, nutrition: true } } });
    expect(screen.queryByTestId("prescription")).toBeNull();
    expect(screen.getByTestId("motivation")).toBeOnTheScreen();
  });

  it("can be changed later from You & your data, with the cycle locked on", async () => {
    await mount(Privacy);
    expect(screen.getByRole("checkbox", { name: "Cycle, always on" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Nutrition" }));
    await act(async () => {});
    expect(screen.getByRole("checkbox", { name: "Nutrition" })).not.toBeChecked();
    expect(JSON.parse(await AsyncStorage.getItem(STATE_KEY)).profile.tracking.nutrition).toBe(false);
  });

  it("explains that backup is off when no database is configured", async () => {
    await mount(Privacy);
    expect(screen.getByText(/Online backup is not switched on/)).toBeOnTheScreen();
  });
});

describe("Not remembering", () => {
  it("lets the last period be unknown and says so on the Cycle tab", async () => {
    await mount(Cycle, { profile: { lastPeriod: null, lastPeriodUnknown: true } });
    expect(screen.getByTestId("cycle-unknown")).toBeOnTheScreen();
    expect(screen.getByTestId("selected-day")).toHaveTextContent("Tap a phase to explore it.");
    await fireEvent.press(screen.getByRole("button", { name: "Add your last period" }));
    expect(router.push).toHaveBeenCalledWith("/edit-cycle");
  });

  it("falls back to the Vibe Check on Home without a last period", async () => {
    await mount(Home, { profile: { lastPeriod: null } });
    expect(screen.getByText(/tell us how today feels/i)).toBeOnTheScreen();
  });

  it("offers I don't remember on the last period calendar", async () => {
    await mount(EditCycle, { profile: { lastPeriod: null } });
    await fireEvent.press(screen.getByRole("button", { name: "I don't remember" }));
    expect(screen.getByTestId("last-period-unknown")).toBeOnTheScreen();
    expect(JSON.parse(await AsyncStorage.getItem(STATE_KEY)).profile.lastPeriodUnknown).toBe(true);
  });

  it("lets a varying period be entered as a range", async () => {
    await mount(EditCycle);
    await fireEvent.press(screen.getAllByRole("button", { name: "It varies" })[0]);
    await fireEvent.press(screen.getByRole("button", { name: "Longest period, more days" }));
    await act(async () => {});
    const p = JSON.parse(await AsyncStorage.getItem(STATE_KEY)).profile;
    expect(p).toMatchObject({ periodMode: "varies", periodVaries: true, periodLengthMin: 3, periodLengthMax: 8 });
  });
});

describe("Profile tab", () => {
  it("shows the cycle details in plain language", async () => {
    await mount(Profile, {
      profile: {
        lastPeriod: periodDaysAgo(20),
        lastPeriodEnd: periodDaysAgo(16),
        cycleMode: "varies",
        cycleVaries: true,
        cycleLengthMin: 27,
        cycleLengthMax: 31,
        hurdles: ["PMDD", "Poor sleep"],
      },
    });
    expect(screen.getByTestId("profile-period-length")).toHaveTextContent(/5 days/);
    expect(screen.getByTestId("profile-cycle-length")).toHaveTextContent(/27–31 days \(varies\)/);
    expect(screen.getByTestId("profile-next-period")).toHaveTextContent(/Around/);
    expect(screen.getByTestId("profile-hurdles")).toHaveTextContent(/PMDD, Poor sleep/);
  });

  it("says not sure instead of inventing numbers", async () => {
    await mount(Profile, { profile: { lastPeriod: null, cycleMode: "unknown", cycleLength: null } });
    expect(screen.getByTestId("profile-last-period")).toHaveTextContent(/Not sure yet/);
    expect(screen.getByTestId("profile-cycle-length")).toHaveTextContent(/using 28 days for now/);
    expect(screen.getByTestId("profile-next-period")).toHaveTextContent(/Not sure yet/);
  });

  it("opens the edit screens", async () => {
    await mount(Profile);
    await fireEvent.press(screen.getByRole("button", { name: "Edit cycle details" }));
    expect(router.push).toHaveBeenCalledWith("/edit-cycle");
    await fireEvent.press(screen.getByRole("button", { name: "Edit about you" }));
    expect(router.push).toHaveBeenCalledWith("/edit-about");
  });

  it("saves hurdle changes from Edit about you", async () => {
    await mount(EditAbout);
    await fireEvent.press(screen.getByRole("checkbox", { name: "Fear of leaking" }));
    await act(async () => {});
    expect(JSON.parse(await AsyncStorage.getItem(STATE_KEY)).profile.hurdles).toContain("Fear of leaking");
  });
});

describe("Sign-in link landing", () => {
  it("explains a link without a code instead of hanging", async () => {
    await mount(AuthCallback);
    expect(screen.getByText("That link did not work")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Back to my data" }));
    expect(router.replace).toHaveBeenCalledWith("/privacy");
  });
});

describe("Privacy & data", () => {
  it("shows the agreement and when it was accepted", async () => {
    await mount(Privacy);
    expect(screen.getByText("Your data stays yours.")).toBeOnTheScreen();
    expect(screen.getByText("Never shared with anyone")).toBeOnTheScreen();
    expect(screen.getByText(/You agreed on 1 October 2026/)).toBeOnTheScreen();
  });

  it("deletes every saved key after confirming", async () => {
    await mount(Privacy);
    await AsyncStorage.setItem("selena.hideNumbers", "false");
    await fireEvent.press(screen.getByRole("button", { name: "Delete all my data" }));
    expect(screen.getByTestId("confirm-delete")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Yes, delete everything" }));
    await act(async () => {});
    expect(router.replace).toHaveBeenCalledWith("/onboarding");
    expect(await AsyncStorage.getItem("selena.hideNumbers")).toBeNull();
    const stored = JSON.parse((await AsyncStorage.getItem(STATE_KEY)) ?? "{}");
    expect(stored.onboarded ?? false).toBe(false);
    expect(stored.agreement ?? null).toBeNull();
  });

  it("keeps everything when the user changes their mind", async () => {
    await mount(Privacy);
    await fireEvent.press(screen.getByRole("button", { name: "Delete all my data" }));
    await fireEvent.press(screen.getByRole("button", { name: "Keep my data" }));
    expect(screen.queryByTestId("confirm-delete")).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("Copy on screen", () => {
  it.each([
    ["Home", Home],
    ["Triad", Triad],
    ["Cycle", Cycle],
    ["Training", Training],
    ["Fuel", Fuel],
    ["Privacy", Privacy],
    ["Profile", Profile],
    ["EditCycle", EditCycle],
    ["EditAbout", EditAbout],
  ])("%s shows no blocked phrase", async (_name, Screen) => {
    await mount(Screen);
    expect(findBlocked(allText(screen.toJSON()))).toEqual([]);
  });
});
