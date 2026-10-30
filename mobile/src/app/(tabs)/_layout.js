import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Home, ClipboardList, Moon, Activity, UtensilsCrossed, User } from "lucide-react-native";
import { useApp } from "../../state/AppState";
import { T, F } from "../../ui/theme";

const icon = (Icon) =>
  function TabIcon({ color, focused }) {
    return <Icon size={20} color={color} strokeWidth={focused ? 2 : 1.5} />;
  };

export default function TabsLayout() {
  const { onboarded, profile } = useApp();
  const tracking = profile.tracking ?? { training: true, nutrition: true };
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.ink,
        tabBarInactiveTintColor: T.inkSoft,
        tabBarStyle: { backgroundColor: T.canvas, borderTopColor: T.hair, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: F.sansMed, fontSize: 10.5 },
        tabBarItemStyle: { minHeight: 44 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="tracker" options={{ title: "Tracker", tabBarIcon: icon(ClipboardList) }} />
      <Tabs.Screen name="cycle" options={{ title: "Cycle", tabBarIcon: icon(Moon) }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts", tabBarIcon: icon(Activity), href: tracking.training ? undefined : null }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrition", tabBarIcon: icon(UtensilsCrossed), href: tracking.nutrition ? undefined : null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon(User) }} />
    </Tabs>
  );
}
