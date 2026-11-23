import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { nextPeriodStart, MIN_LENGTH, MAX_LENGTH } from "../shared";
import { useApp } from "../state/AppState";
import { T, IMG } from "../ui/theme";
import { Screen, Serif, Body, Button, IconBtn, ToggleRow } from "../ui/kit";
import { askPermission, sendSample } from "../lib/notifications";
import { sampleMoments } from "../lib/moments";
import { shortDate } from "../ui/Calendar";
import { DEFAULT_TRACKING } from "../ui/TrackChoices";
import { DEFAULT_GOAL } from "../lib/food";
import { DIET, AIMS } from "../lib/energy";
import { weightOf, DEFAULT_STEP_GOAL } from "../lib/activity";
import { Journey } from "../ui/Journey";
import { CycleInsight } from "../ui/CycleInsight";
import { TrainingStats } from "../ui/TrainingStats";
import { describeCycle, NOT_SURE } from "./Profile";

/* ---------------------------------------------------------------
   ONE PART OF THE PROFILE — her journey, her training, or one group
   of what she has told Selena, with a single way to change it.
   --------------------------------------------------------------- */

const Row = ({ label, value, testID }) => (
  <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`} testID={testID}>
    <Body size={13.5} style={{ flex: 1 }}>
      {label}
    </Body>
    <Body size={14} color={T.ink} weight="medium" style={{ flex: 1.4, textAlign: "right" }}>
      {value}
    </Body>
  </View>
);

const Details = ({ title, editLabel, onEdit, note, children }) => (
  <>
    <Serif size={28} accessibilityRole="header" style={{ marginTop: 16, marginBottom: 12 }}>
      {title}
    </Serif>
    {children}
    {note && (
      <Body size={11.5} style={{ marginTop: 12 }}>
        {note}
      </Body>
    )}
    <View style={{ height: 22 }} />
    <Button tone="outline" label="Edit" accessibilityLabel={editLabel} onPress={onEdit} />
  </>
);

const NotificationSettings = () => {
  const { profile, setProfile, todayKey, showMoments } = useApp();
  const [blocked, setBlocked] = useState(false);
  // the one meant for today, or the latest before it
  const sample = () => {
    const keys = sampleMoments(profile, todayKey);
    showMoments(keys, `sample-${Date.now()}`);
    if (profile.notifications) sendSample(keys[0]);
  };
  const choose = async (on) => {
    const allowed = on ? await askPermission() : false;
    setBlocked(on && !allowed);
    setProfile({ notifications: allowed, notificationsAsked: true });
  };
  return (
    <>
      <Serif size={28} accessibilityRole="header" style={{ marginTop: 16, marginBottom: 6 }}>
        Notifications
      </Serif>
      <Body style={{ marginBottom: 16 }}>A picture and one silly line, in the evening. They stop by themselves if you are away for three days.</Body>
      <ToggleRow label="Evening notifications" value={!!profile.notifications} onChange={choose} leftLabel="Off" rightLabel="On" />
      {blocked && <Body testID="notifications-blocked">Your iPhone has these turned off for Expo Go. You can allow them in iPhone Settings.</Body>}
      <Button tone="outline" label="Show today's notification" onPress={sample} />
      <Body size={12} style={{ marginTop: 8 }}>{profile.notifications ? "It also arrives on your phone a few seconds later." : "Turn notifications on to get it on your phone too."}</Body>
    </>
  );
};

export function ProfileSection({ section: given }) {
  const params = useLocalSearchParams();
  const section = given ?? params.section;
  const { profile: p, ctx, days, todayKey, hideNumbers, photos, workouts } = useApp();
  const goal = { ...DEFAULT_GOAL, ...p.nutritionGoal };
  const hidden = hideNumbers || p.trackingStyle === "Visual plates";
  const num = (text) => (hidden ? "Hidden" : text);
  const fmt = (n) => Math.round(n).toLocaleString("en-GB");
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/profile"));
  const tracking = p.tracking ?? DEFAULT_TRACKING;
  const { lastPeriod, periodLength, cycleLength } = describeCycle(p, days, todayKey);
  const next = nextPeriodStart(p);

  return (
    <Screen image={section === "insights" ? IMG.insights.forest : undefined}>
      {section === "insights" ? (
        // over the forest: a round, see-through back button in cream
        <IconBtn label="Back" onPress={close} dark style={{ borderRadius: 24, width: 48, height: 48, borderColor: "rgba(247,241,229,0.75)", backgroundColor: "rgba(27,35,64,0.25)" }}>
          <ArrowLeft size={22} color="#F7F1E5" />
        </IconBtn>
      ) : (
        <IconBtn label="Back" onPress={close} style={{ marginBottom: section === "journey" || section === "training" ? 16 : 0 }}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
      )}

      {section === "journey" && <Journey days={days} todayKey={todayKey} goalKcal={goal.kcal} kg={weightOf(p)} hidden={hidden} photos={photos} baselinePhoto={p.baselinePhoto} profile={p} />}

      {section === "insights" && (
        <>
          <Serif size={40} color="#F7F1E5" accessibilityRole="header" style={{ marginTop: 18, marginBottom: 14, textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } }}>
            Smart insights
          </Serif>
          <CycleInsight days={days} todayKey={todayKey} profile={p} goalKcal={goal.kcal} proteinGoal={goal.protein} workouts={workouts} hidden={hidden} />
        </>
      )}

      {section === "training" && <TrainingStats workouts={workouts} todayKey={todayKey} />}

      {section === "goals" && (
        <Details title="Your goals" editLabel="Edit your goals" onEdit={() => router.push("/food/goal")}>
          <Row label="Eating style" value={DIET[p.diet ?? "balanced"]?.label ?? "Balanced"} testID="profile-diet" />
          <Row label="Aim" value={AIMS.find((a) => a.key === (p.body?.aim ?? "maintain"))?.label ?? "Stay as I am"} />
          <Row label="Energy" value={num(`${fmt(goal.kcal)} kcal a day`)} testID="profile-energy" />
          <Row label="Protein · carbs · fat" value={num(`${goal.protein} · ${goal.carbs} · ${goal.fat} g`)} />
          <Row label="Steps a day" value={num(fmt(p.stepGoal ?? DEFAULT_STEP_GOAL))} />
          <Row label="Body details" value={p.body?.kg ? "Saved on this phone" : "Not added"} />
          <Row label="Goal worked out" value={p.goalMode === "body" ? "From your body" : p.goalMode === "own" ? "Your own numbers" : "Everyday guide"} />
        </Details>
      )}

      {section === "cycle" && (
        <Details title="Your cycle" editLabel="Edit cycle details" onEdit={() => router.push("/edit-cycle")} note={`Cycles between ${MIN_LENGTH} and ${MAX_LENGTH} days are supported.`}>
          <Row label="Last period" value={lastPeriod} testID="profile-last-period" />
          <Row label="Period length" value={periodLength} testID="profile-period-length" />
          <Row label="Cycle length" value={cycleLength} testID="profile-cycle-length" />
          <Row label="Today" value={p.onBirthControl ? "Following your Vibe Check" : ctx.calendarKnown ? `Day ${ctx.day} · ${ctx.phaseLabel}` : "Add your last period to see this"} />
          <Row label="Next period" value={p.onBirthControl ? "Not predicted on birth control" : next ? `Around ${shortDate(next)}` : NOT_SURE} testID="profile-next-period" />
        </Details>
      )}

      {section === "about" && (
        <Details title="About you" editLabel="Edit about you" onEdit={() => router.push("/edit-about")}>
          <Row label="Age group" value={p.ageGroup === "40+" ? "40+" : "20s / 30s"} />
          <Row label="Hormonal birth control" value={p.onBirthControl ? "Yes" : "No"} />
          <Row label="Intention" value={p.goal ?? "Not chosen"} />
          <Row label="Hardest hurdles" value={p.hurdles?.length ? p.hurdles.join(", ") : "None chosen"} testID="profile-hurdles" />
        </Details>
      )}

      {section === "notifications" && <NotificationSettings />}

      {section === "following" && (
        <Details title="What Selena follows" editLabel="Edit what Selena follows" onEdit={() => router.push("/privacy")}>
          <Row label="Cycle" value="Always on" />
          <Row label="Training" value={tracking.training ? "On" : "Off"} />
          <Row label="Nutrition" value={tracking.nutrition ? `On · ${p.trackingStyle}` : "Off"} />
        </Details>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair, paddingVertical: 10 },
});
