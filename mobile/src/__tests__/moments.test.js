import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { AppProvider, useApp } from "../state/AppState";
import { AGREEMENT_VERSION, findBlocked, EVENING } from "../shared";
import { MOMENT_TEXT, notificationTimes, periodMoments, upcomingMoments, sampleMoments } from "../lib/moments";
import { MOMENT_IMAGE } from "../content/moments";
import { planNotifications } from "../lib/notifications";
import { MomentCard } from "../ui/MomentCard";

const TODAY = "2026-11-04";
const NOW = new Date(2026, 10, 4, 10, 0);
const profile = { lastPeriod: "2026-10-15", cycleLength: 28, cycleMode: "exact" };

describe("what each moment says", () => {
  it("has a picture for every line and stays kind", () => {
    expect(Object.keys(MOMENT_IMAGE).sort()).toEqual(Object.keys(MOMENT_TEXT).sort());
    for (const text of Object.values(MOMENT_TEXT)) expect(findBlocked(text)).toEqual([]);
  });

  it("flips the pair when the period is late", () => {
    expect(periodMoments(profile, "2026-11-12")).toEqual(["period-here", "period-prime"]);
    expect(periodMoments(profile, "2026-11-13")).toEqual(["period-here", "period-prime"]);
    expect(periodMoments(profile, "2026-11-14")).toEqual(["period-risky", "period-survive"]);
  });
});

describe("the calendar", () => {
  it("counts down the four days before a period", () => {
    const dates = Object.fromEntries(upcomingMoments(profile, "2026-10-15").map((m) => [m.key, m.date]));
    expect(dates["before-4"]).toBe("2026-11-08");
    expect(dates["before-1"]).toBe("2026-11-11");
    expect(dates["ovulation-1"] < dates["ovulation-2"]).toBe(true);
    expect(dates.follicular < dates["ovulation-1"]).toBe(true);
  });

  it("cheers on the second day while the period is still going", () => {
    expect(upcomingMoments(profile, "2026-10-15")[0]).toEqual({ key: "period-day-2", date: "2026-10-16" });
    expect(upcomingMoments({ ...profile, lastPeriodEnd: "2026-10-15" }, "2026-10-15").some((m) => m.key === "period-day-2")).toBe(false);
  });

  it("samples today's moment, or the latest one before today", () => {
    expect(sampleMoments(profile, "2026-11-10")).toEqual(["before-2"]);
    expect(sampleMoments(profile, "2026-11-20")).toEqual(["before-1"]);
    expect(sampleMoments({ lastPeriod: null }, "2026-11-20")).toEqual(["period-here"]);
  });

  it("predicts nothing on birth control or without a period date", () => {
    expect(upcomingMoments({ ...profile, onBirthControl: true }, TODAY)).toEqual([]);
    expect(upcomingMoments({ lastPeriod: null }, TODAY)).toEqual([]);
  });

  it("only plans evenings inside the next 72 hours", () => {
    const moments = [
      { key: "before-4", date: "2026-11-04" },
      { key: "before-3", date: "2026-11-06" },
      { key: "before-2", date: "2026-11-08" },
    ];
    const planned = notificationTimes(moments, NOW);
    expect(planned.map((m) => m.key)).toEqual(["before-4", "before-3"]);
    expect(planned[0].at.getHours()).toBe(EVENING.startHour);
    expect(notificationTimes(moments, new Date(2026, 10, 4, 21, 0)).map((m) => m.key)).toEqual(["before-3"]);
  });
});

describe("phone notifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stays silent until they are switched on", async () => {
    await planNotifications(profile, "2026-11-07", new Date(2026, 10, 7, 10, 0));
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("schedules a line and its picture when on", async () => {
    await planNotifications({ ...profile, notifications: true }, "2026-11-07", new Date(2026, 10, 7, 10, 0));
    const first = Notifications.scheduleNotificationAsync.mock.calls[0][0];
    expect(first.content.body).toBe(MOMENT_TEXT["before-4"]);
    expect(first.content.data).toEqual({ moment: "before-4" });
    expect(first.trigger.type).toBe("date");
  });
});

describe("the card", () => {
  const Show = () => {
    const { showMoments, profile: p } = useApp();
    return (
      <>
        <MomentCard />
        <ShowButton onPress={() => showMoments(["period-here", "period-prime"], TODAY)} asked={p.notificationsAsked} />
      </>
    );
  };
  const ShowButton = ({ onPress }) => {
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="show">
        <Text>show</Text>
      </Pressable>
    );
  };
  const mount = async (over = {}) => {
    await render(
      <AppProvider now={NOW} initial={{ onboarded: true, agreement: { version: AGREEMENT_VERSION, acceptedAt: "2026-10-01T09:00:00.000Z" }, profile: { ...profile, ...over } }}>
        <Show />
      </AppProvider>
    );
    await act(async () => {});
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("asks about notifications the first time in, once", async () => {
    await mount();
    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("does not ask again", async () => {
    await mount({ notificationsAsked: true });
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it("pops up what is due the first time the app opens that day", async () => {
    await mount({ lastPeriod: "2026-10-11", notificationsAsked: true });
    expect(screen.getByTestId("moment")).toHaveTextContent(new RegExp(MOMENT_TEXT["before-4"].slice(0, 9)));
  });

  it("runs a pair straight on, then closes", async () => {
    await mount({ notificationsAsked: true });
    expect(screen.queryByTestId("moment")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "show" }));
    expect(screen.getByText(MOMENT_TEXT["period-here"])).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(MOMENT_TEXT["period-prime"])).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("moment")).toBeNull();
  });
});
