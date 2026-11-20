import React from "react";
import { Text } from "react-native";
import { render, screen, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppProvider, useApp } from "../state/AppState";

/* The app can stay paused in the background overnight: "today" must
   still move on with the phone's clock. */

const Today = () => {
  const { ready, todayKey } = useApp();
  return ready ? <Text testID="today">{todayKey}</Text> : null;
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

it("moves on to the new day at midnight, without a restart", async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 12, 23, 59, 0) });
  await render(
    <AppProvider>
      <Today />
    </AppProvider>
  );
  await act(async () => {
    await jest.advanceTimersByTimeAsync(50);
  });
  expect(screen.getByTestId("today")).toHaveTextContent("2026-11-12");
  await act(async () => {
    await jest.advanceTimersByTimeAsync(2 * 60 * 1000);
  });
  expect(screen.getByTestId("today")).toHaveTextContent("2026-11-13");
});
