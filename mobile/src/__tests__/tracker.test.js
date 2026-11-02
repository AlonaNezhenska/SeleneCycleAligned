import React, { useState } from "react";
import { View } from "react-native";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AppProvider, useApp, dateKey, STATE_KEY } from "../state/AppState";
import { TrackerSessionProvider } from "../state/TrackerSession";
import { AGREEMENT_VERSION, findBlocked } from "../shared";
import { Triad } from "../screens/Triad";
import { TrackCategory } from "../screens/TrackCategory";
import { CATEGORIES } from "../content/journal";
import { toBackup } from "../lib/backup";

const NOW = new Date(2026, 9, 29, 15, 0);
const TODAY = dateKey(NOW);

/** Give every bubble constellation on screen a size, as a phone does on layout. */
const layoutAll = async () => {
  for (const key of ["body", "lifestyle", "health"]) {
    const c = screen.queryByTestId(`constellation-${key}`);
    if (c) await fireEvent(c, "layout", { nativeEvent: { layout: { width: 340, height: 333 } } });
  }
};

const Ready = ({ children }) => (useApp().ready ? <View testID="ready" style={{ flex: 1 }}>{children}</View> : null);

/** The tracker and its category pages, sharing one session, with routing faked. */
const Journey = () => {
  const [page, setPage] = useState(null);
  useState(() => {
    router.push.mockImplementation((p) => setPage(String(p).split("/").pop()));
    router.back.mockImplementation(() => setPage(null));
    router.canGoBack.mockReturnValue(true);
  });
  return page ? <TrackCategory categoryKey={page} /> : <Triad />;
};

const mount = async (ui = <Journey />, profile = {}) => {
  await render(
    <AppProvider
      now={NOW}
      initial={{
        onboarded: true,
        agreement: { version: AGREEMENT_VERSION, acceptedAt: "2026-10-01T09:00:00.000Z" },
        profile: { lastPeriod: "2026-10-14", ...profile },
      }}
    >
      <TrackerSessionProvider>
        <Ready>{ui}</Ready>
      </TrackerSessionProvider>
    </AppProvider>
  );
  await screen.findByTestId("ready");
  await layoutAll();
};

const press = async (role, name) => {
  await fireEvent.press(screen.getByRole(role, { name }));
  await layoutAll();
};
/** Move a symptom's slider to a level the way a screen reader would. */
const setLevel = async (label, level) => {
  const slider = () => screen.getByLabelText(`${label} intensity`, { exact: true });
  for (let guard = 0; guard < 6; guard++) {
    const now = slider().props.accessibilityValue.now;
    if (now === level) return;
    await fireEvent(slider(), "accessibilityAction", { nativeEvent: { actionName: now < level ? "increment" : "decrement" } });
  }
};

const stored = async () => JSON.parse((await AsyncStorage.getItem(STATE_KEY)) ?? "{}");

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  router.canGoBack.mockReturnValue(false);
});

describe("main tracker", () => {
  it("shows the day, the heading, every category and a disabled Save", async () => {
    await mount();
    expect(screen.getByText("Cycle Day 16 · Ovulatory phase")).toBeOnTheScreen();
    expect(screen.getByText("How are you feeling today?")).toBeOnTheScreen();
    for (const name of [
      "Physical", "Emotional", "Energy", "Skin", "Digestion", "Flow",
      "Sleep", "Cravings", "Sex & intimacy", "Activities",
      "Cycle changes", "Birth control", "Medication", "Supplements", "Health profile",
    ]) {
      expect(screen.getByRole("button", { name })).toBeOnTheScreen();
    }
    expect(screen.getByRole("button", { name: "Save symptoms" })).toBeDisabled();
  });
});

describe("one tracking session, one save", () => {
  it("keeps several categories in memory and writes them all together", async () => {
    await mount();

    // Physical: three symptoms, each with its own intensity, one with a note
    await press("button", "Physical");
    expect(screen.getByText(/Select what you're experiencing/)).toBeOnTheScreen();
    await press("checkbox", "Cramps");
    await press("checkbox", "Bloating");
    await press("checkbox", "Headache");
    expect(screen.getByTestId("category-popup")).toBeOnTheScreen();
    // each tap opens the sliding window for that symptom; the chips switch between them
    expect(screen.getByTestId("intensity-panel")).toHaveTextContent(/How intense is headache\?/);
    await press("button", "Cramps");
    await setLevel("Cramps", 4);
    await fireEvent.changeText(screen.getByLabelText("Note for Cramps"), "worse in the morning");
    await press("button", "Bloating");
    await setLevel("Bloating", 2);
    await press("button", "Done");
    expect(screen.queryByTestId("intensity-panel")).toBeNull();
    await press("button", "Continue");

    // back on the tracker: nothing saved yet, but the session remembers
    expect(screen.getByRole("button", { name: "Physical, 3 selected" })).toBeOnTheScreen();
    expect(screen.getByTestId("unsaved")).toBeOnTheScreen();
    expect((await stored()).days?.[TODAY]?.journal ?? {}).toEqual({});

    // Emotional: another category in the same session
    await press("button", "Emotional");
    await press("checkbox", "Anxiety");
    await setLevel("Anxiety", 5);
    await press("button", "Done");
    await press("button", "Continue");
    expect(screen.getByRole("button", { name: "Physical, 3 selected" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Emotional, 1 selected" })).toBeOnTheScreen();
    expect(screen.queryByTestId("review")).toBeNull(); // no separate entries list

    // the single save
    await press("button", "Save symptoms");
    await act(async () => {});
    const journal = (await stored()).days[TODAY].journal;
    expect(journal.physical.items).toEqual({
      cramps: { intensity: 4, note: "worse in the morning" },
      bloating: { intensity: 2 },
      headache: { intensity: 3 },
    });
    expect(journal.emotional.items).toEqual({ anxiety: { intensity: 5 } });
    expect(screen.getByTestId("saved-confirmation")).toHaveTextContent("Saved for today");
    expect(screen.queryByTestId("unsaved")).toBeNull();
    expect(screen.getByTestId("tip")).toBeOnTheScreen();
  });

  it("lets a category be revisited and a symptom deselected before saving", async () => {
    await mount();
    await press("button", "Physical");
    await press("checkbox", "Cramps");
    await press("checkbox", "Nausea");
    await press("button", "Continue");
    await press("button", "Physical, 2 selected");
    expect(screen.getByRole("checkbox", { name: "Cramps" })).toBeChecked();
    await press("checkbox", "Cramps"); // opens its window again
    expect(screen.getByRole("checkbox", { name: "Cramps" })).toBeChecked();
    await press("button", "Remove Cramps");
    expect(screen.getByRole("checkbox", { name: "Cramps" })).not.toBeChecked();
    expect(screen.queryByTestId("intensity-panel")).toBeNull();
    await press("button", "Continue");
    expect(screen.getByRole("button", { name: "Physical, 1 selected" })).toBeOnTheScreen();
    await press("button", "Save symptoms");
    await act(async () => {});
    expect(Object.keys((await stored()).days[TODAY].journal.physical.items)).toEqual(["nausea"]);
  });

  it("discards the session without writing anything", async () => {
    await mount();
    await press("button", "Sleep");
    await press("checkbox", "Insomnia");
    await press("button", "Continue");
    await press("button", "Discard");
    expect(screen.getByRole("button", { name: "Sleep" })).toBeOnTheScreen();
    expect(screen.queryByTestId("unsaved")).toBeNull();
    expect((await stored()).days?.[TODAY]?.journal ?? {}).toEqual({});
  });

  it("asks before leaving with unsaved changes", async () => {
    await mount();
    await press("button", "Skin");
    await press("checkbox", "Acne");
    await press("button", "Continue");
    await press("button", "Back");
    expect(screen.getByTestId("leave-confirm")).toBeOnTheScreen();
    await press("button", "Keep editing");
    expect(router.navigate).not.toHaveBeenCalled();
    await press("button", "Back");
    await press("button", "Discard and leave");
    expect(router.navigate).toHaveBeenCalledWith("/");
    expect((await stored()).days?.[TODAY]?.journal ?? {}).toEqual({});
  });

  it("leaves straight away when nothing is unsaved", async () => {
    await mount();
    await press("button", "Back");
    expect(router.navigate).toHaveBeenCalledWith("/");
  });
});

describe("special categories", () => {
  it("records activities with duration and their own extra detail", async () => {
    await mount(<TrackCategory categoryKey="activities" />);
    await press("checkbox", "Running");
    await press("button", "More duration");
    await press("button", "More distance");
    await press("button", "More distance");
    await press("checkbox", "Rest day");
    await press("button", "Gentle movement");
    expect(screen.getByLabelText("Running details")).toHaveTextContent(/35 min/);
    expect(screen.getByLabelText("Running details")).toHaveTextContent(/1 km/);
  });

  it("keeps sex and intimacy private and optional, with single-choice scales", async () => {
    await mount(<TrackCategory categoryKey="intimacy" />);
    expect(screen.getByText(/never backed up/)).toBeOnTheScreen();
    await press("button", "High");
    await press("button", "Moderate");
    expect(screen.getByRole("button", { name: "Moderate" })).toBeSelected();
    expect(screen.getByRole("button", { name: "High" })).not.toBeSelected();
  });

  it("adds and removes medication entries", async () => {
    await mount(<TrackCategory categoryKey="medication" />);
    expect(screen.getByRole("button", { name: "Add medication" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Ibuprofen");
    await fireEvent.changeText(screen.getByLabelText("Dosage"), "200 mg");
    await press("button", "As needed");
    await press("button", "Add medication");
    expect(screen.getByLabelText("Ibuprofen · 200 mg details")).toBeOnTheScreen();
    await press("button", "Remove Ibuprofen");
    expect(screen.queryByLabelText("Ibuprofen · 200 mg details")).toBeNull();
  });

  it("offers supplement suggestions", async () => {
    await mount(<TrackCategory categoryKey="supplements" />);
    await press("button", "Magnesium");
    await press("button", "Add supplement");
    expect(screen.getByLabelText("Magnesium details")).toBeOnTheScreen();
  });

  it("dates each cycle disruption", async () => {
    await mount(<TrackCategory categoryKey="disruptions" />);
    await press("checkbox", "Spotting");
    expect(screen.getByLabelText("Spotting details")).toHaveTextContent(/Date: Thu 29 Oct/);
  });

  it("applies a birth control change to the profile only on save", async () => {
    await mount();
    await press("button", "Birth control");
    await press("button", "Hormonal IUD");
    await press("button", "Continue");
    expect((await stored()).profile.onBirthControl).toBe(false);
    await press("button", "Save symptoms");
    await act(async () => {});
    const data = await stored();
    expect(data.profile.contraception).toMatchObject({ method: "hormonal-iud", changedOn: TODAY });
    expect(data.profile.onBirthControl).toBe(true);
  });

  it("keeps the health profile non-diagnostic and saves it to the profile", async () => {
    await mount();
    await press("button", "Health profile");
    expect(screen.getByText(/never guesses at a condition/)).toBeOnTheScreen();
    await press("button", "Suspected endometriosis");
    await press("checkbox", "Pelvic pain");
    await press("button", "Continue");
    await press("button", "Save symptoms");
    await act(async () => {});
    const data = await stored();
    expect(data.profile.health.conditions).toEqual(["endo-suspected"]);
    expect(data.days[TODAY].journal.conditions.items.pelvic).toEqual({ intensity: 3 });
  });
});

describe("Flow", () => {
  it("logs the flow level and moves day 1 of the cycle when a period starts", async () => {
    await mount();
    await press("button", "Flow");
    await press("button", "Heavy");
    await press("checkbox", "Period started today");
    expect(screen.getByText(/sets day 1 of your cycle when you save/)).toBeOnTheScreen();
    await press("button", "Continue");
    expect((await stored()).profile.lastPeriod).toBe("2026-10-14");
    await press("button", "Save symptoms");
    await act(async () => {});
    const data = await stored();
    expect(data.days[TODAY].journal.flow).toMatchObject({ choices: { level: "heavy" }, items: { started: {} } });
    expect(data.profile).toMatchObject({ lastPeriod: TODAY, periodOngoing: true });
    expect(screen.getByText("Today asks for less.")).toBeOnTheScreen();
  });
});

describe("one flower for intensity", () => {
  it("wilts the drawn flower for a difficult symptom, described in words", async () => {
    await mount(<TrackCategory categoryKey="physical" />);
    await press("checkbox", "Cramps");
    expect(screen.getByLabelText("Cramps: Moderate")).toBeOnTheScreen();
    await setLevel("Cramps", 5);
    expect(screen.getByLabelText("Cramps: Very intense")).toBeOnTheScreen();
    await setLevel("Cramps", 1);
    expect(screen.getByLabelText("Cramps: Very mild")).toBeOnTheScreen();
    expect(screen.getAllByTestId("flower")).toHaveLength(1);
  });

  it("shows no 1–5 numbers, only words", async () => {
    await mount(<TrackCategory categoryKey="physical" />);
    await press("checkbox", "Cramps");
    expect(screen.queryByRole("radio", { name: /intensity \d of 5/ })).toBeNull();
    expect(screen.getByText("Very mild", { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByText("Very intense", { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it("uses the peony bloom for a positive state", async () => {
    await mount(<TrackCategory categoryKey="energy" />);
    await press("checkbox", "High energy");
    await setLevel("High energy", 5);
    expect(screen.getByLabelText("High energy: Very intense")).toBeOnTheScreen();
    expect(screen.getAllByTestId("flower")).toHaveLength(1);
  });

  it("keeps one flower even with several symptoms chosen", async () => {
    await mount(<TrackCategory categoryKey="physical" />);
    await press("checkbox", "Cramps");
    await press("checkbox", "Headache");
    await press("checkbox", "Nausea");
    expect(screen.getAllByTestId("flower")).toHaveLength(1);
    expect(screen.getByText("How intense is nausea?")).toBeOnTheScreen();
  });

  it("closes the sliding window without losing the choice", async () => {
    await mount(<TrackCategory categoryKey="physical" />);
    await press("checkbox", "Cramps");
    await setLevel("Cramps", 4);
    await press("button", "Close");
    expect(screen.queryByTestId("intensity-panel")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Cramps" })).toBeChecked();
    await press("checkbox", "Cramps");
    expect(screen.getByLabelText("Cramps: Intense")).toBeOnTheScreen();
  });
});

describe("watercolour companions", () => {
  it("gives every category its own animal", async () => {
    for (const cat of CATEGORIES) {
      await mount(<TrackCategory categoryKey={cat.key} />);
      expect(screen.getByTestId(`companion-${cat.key}`, { includeHiddenElements: true })).toBeTruthy();
    }
  });
});

describe("privacy and copy", () => {
  it("never puts private categories into a backup", () => {
    const data = {
      profile: {},
      days: {
        [TODAY]: {
          journal: {
            physical: { items: { cramps: { intensity: 2 } } },
            intimacy: { choices: { drive: "high" } },
            contraception: { items: { spotting: {} } },
            medication: { entries: [{ id: "1", name: "Ibuprofen" }] },
            conditions: { items: { pelvic: { intensity: 3 } } },
          },
        },
      },
    };
    const sent = toBackup(data, "logs").days[TODAY].journal;
    expect(Object.keys(sent)).toEqual(["physical"]);
  });

  it.each(CATEGORIES.map((c) => [c.key]))("the %s page uses no blocked words", async (key) => {
    await mount(<TrackCategory categoryKey={key} />);
    const text = JSON.stringify(screen.toJSON());
    expect(findBlocked(text)).toEqual([]);
  });
});
