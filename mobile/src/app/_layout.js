import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { AppProvider, useApp } from "../state/AppState";
import { T } from "../ui/theme";

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
      </Stack>
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
    <AppProvider>
      <Gate fontsReady={fontsReady} />
    </AppProvider>
  );
}
