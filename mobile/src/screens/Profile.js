import React from "react";
import { Text, StyleSheet } from "react-native";
import { Divider } from "react-native-paper";
import { router } from "expo-router";
import * as Updates from "expo-updates";
import { BarChart3, Bell, Sparkles, Camera, Dumbbell, Moon, ShieldCheck, SlidersHorizontal, Target, User } from "lucide-react-native";
import { resolveCycleLength, resolvePeriodLength } from "../shared";
import { useApp } from "../state/AppState";
import { T, F } from "../ui/theme";
import { Screen, Serif, MenuRow } from "../ui/kit";
import { shortDate } from "../ui/Calendar";
import { DEFAULT_GOAL } from "../lib/food";
import { DIET } from "../lib/energy";

/* ---------------------------------------------------------------
   PROFILE — a short menu.

   Her progress first, then what she has told Selena. Each line opens
   its own page, so nothing here has to be read past. Every goal is
   edited from these pages.
   --------------------------------------------------------------- */

export const NOT_SURE = "Not sure yet";
const days = (n) => `${n} day${n === 1 ? "" : "s"}`;

/** Plain-language summaries of what the engine is working with. */
export const describeCycle = (p) => {
  const cycle = resolveCycleLength(p);
  const period = resolvePeriodLength(p);
  const lastPeriod = !p.lastPeriod
    ? NOT_SURE
    : p.lastPeriodEnd
    ? `${shortDate(p.lastPeriod)} to ${shortDate(p.lastPeriodEnd)}`
    : p.periodOngoing
    ? `Since ${shortDate(p.lastPeriod)}, still going`
    : `Started ${shortDate(p.lastPeriod)}`;
  const periodLength =
    period.source === "unknown"
      ? NOT_SURE
      : period.source === "range"
      ? `${p.periodLengthMin}–${p.periodLengthMax} days (varies)`
      : days(period.length);
  const cycleLength = {
    range: `${p.cycleLengthMin}–${p.cycleLengthMax} days (varies)`,
    entered: days(cycle.length),
    estimated: `About ${days(cycle.length)}, from your last two periods`,
    default: `${NOT_SURE} · using 28 days for now`,
  }[cycle.source];
  return { lastPeriod, periodLength, cycleLength };
};

const open = (section) => router.push({ pathname: "/me/[section]", params: { section } });

/** Which update is running, so an old one is easy to spot. */
const version = () => {
  const at = Updates.createdAt;
  if (!at) return "Version: development";
  return `Version: ${at.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

export function Profile() {
  const { profile: p, ctx, backup, hideNumbers, photos } = useApp();
  const goal = { ...DEFAULT_GOAL, ...p.nutritionGoal };
  const hidden = hideNumbers || p.trackingStyle === "Visual plates";
  const style = DIET[p.diet ?? "balanced"]?.label ?? "Balanced";
  const count = photos.length + (p.baselinePhoto ? 1 : 0);
  const today = p.onBirthControl ? "Following your Vibe Check" : ctx.calendarKnown ? `Day ${ctx.day} · ${ctx.phaseLabel}` : "Add your last period";

  return (
    <Screen>
      <Serif size={28} accessibilityRole="header" style={{ marginBottom: 16 }}>
        Your profile
      </Serif>

      <Text style={styles.group}>Your progress</Text>
      <MenuRow icon={BarChart3} title="Your journey" description="Food, movement and this month" onPress={() => open("journey")} />
      <Divider />
      <MenuRow icon={Sparkles} title="Smart insights" description="How this month is going" onPress={() => open("insights")} />
      <Divider />
      <MenuRow icon={Dumbbell} title="Training" description="Hours, charts and past workouts" onPress={() => open("training")} />
      <Divider />
      <MenuRow icon={Camera} title="Progress photos" description={count ? `${count} ${count === 1 ? "photo" : "photos"}` : "None yet"} onPress={() => router.push("/photos")} />
      <Divider />

      <Text style={styles.group}>About you</Text>
      <MenuRow icon={Target} title="Your goals" description={hidden ? style : `${Math.round(goal.kcal).toLocaleString("en-GB")} kcal · ${style}`} onPress={() => open("goals")} />
      <Divider />
      <MenuRow icon={Moon} title="Your cycle" description={today} onPress={() => open("cycle")} />
      <Divider />
      <MenuRow icon={User} title="About you" description="Age, birth control and hurdles" onPress={() => open("about")} />
      <Divider />

      <Text style={styles.group}>Settings</Text>
      <MenuRow icon={Bell} title="Notifications" description={p.notifications ? "On, in the evening" : "Off"} onPress={() => open("notifications")} />
      <Divider />
      <MenuRow icon={SlidersHorizontal} title="What Selena follows" description="Cycle, training and nutrition" onPress={() => open("following")} />
      <Divider />
      <MenuRow icon={ShieldCheck} title="You & your data" description={backup.user ? `Backed up as ${backup.user.email}` : "Stored only on this phone"} onPress={() => router.push("/privacy")} />
      <Text style={styles.version} testID="app-version">
        {version()}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  version: { fontFamily: F.sans, fontSize: 11.5, color: T.inkFaint, textAlign: "center", marginTop: 24 },
  group: { fontFamily: F.sansSemi, fontSize: 13, color: T.inkSoft, marginTop: 18, marginBottom: 2 },
});
