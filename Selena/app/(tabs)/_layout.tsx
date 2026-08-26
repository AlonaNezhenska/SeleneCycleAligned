import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="tracker" options={{ title: "Tracker" }} />
      <Tabs.Screen name="cycle" options={{ title: "Cycle" }} />
      <Tabs.Screen name="workout" options={{ title: "Workout" }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrition" }} />
    </Tabs>
  );
}
