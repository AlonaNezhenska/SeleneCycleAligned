import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { PaperProvider } from "react-native-paper";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { AppProvider, useApp } from "../state/AppState";
import { TrackerSessionProvider } from "../state/TrackerSession";
import { T } from "../ui/theme";
import { selenaTheme } from "../ui/paperTheme";
import { MomentCard } from "../ui/MomentCard";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Hold the splash until fonts and saved data are both in. */
const Gate = ({ fontsReady }) => {
  const { ready } = useApp();
  const show = fontsReady && ready;

  useEffect(() => {
    if (show) SplashScreen.hideAsync().catch(() => {});
  }, [show]);

  if (!show) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.canvas } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="privacy" options={{ presentation: "modal" }} />
        <Stack.Screen name="auth-callback" />
        <Stack.Screen name="edit-cycle" options={{ presentation: "modal" }} />
        <Stack.Screen name="edit-about" options={{ presentation: "modal" }} />
        <Stack.Screen name="track/[category]" />
        <Stack.Screen name="food/add" options={{ presentation: "modal" }} />
        <Stack.Screen name="food/scan" />
        <Stack.Screen name="food/new" />
        <Stack.Screen name="food/meal" />
        <Stack.Screen name="food/goal" />
        <Stack.Screen name="activity/add" />
        <Stack.Screen name="meditate" />
        <Stack.Screen name="photos" />
        <Stack.Screen name="workout/start" />
        <Stack.Screen name="workout/today" />
        <Stack.Screen name="workout/log" />
        <Stack.Screen name="workout/exercises" />
        <Stack.Screen name="workout/exercise/[id]" />
        <Stack.Screen name="workout/explore" />
        <Stack.Screen name="workout/place/[key]" />
        <Stack.Screen name="workout/program/[id]" />
        <Stack.Screen name="workout/trainer" />
        <Stack.Screen name="workout/routine" />
        <Stack.Screen name="workout/stats" />
        <Stack.Screen name="workout/calendar" />
        <Stack.Screen name="workout/history/[id]" />
        <Stack.Screen name="me/[section]" />
        <Stack.Screen name="measures" />
        <Stack.Screen name="recipe/[id]" />
      </Stack>
      <MomentCard />
    </>
  );
};

export default function RootLayout() {
  const [fontsReady] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <PaperProvider theme={selenaTheme}>
      <AppProvider>
        <TrackerSessionProvider>
          <Gate fontsReady={fontsReady} />
        </TrackerSessionProvider>
      </AppProvider>
    </PaperProvider>
  );
}
