import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, Check } from "lucide-react-native";
import { useApp, dateKey } from "../state/AppState";
import { T } from "../ui/theme";
import { Screen, IconBtn, Button, Serif, Body, Eyebrow, ToggleRow, Chip, SectionLabel, s } from "../ui/kit";
import { LastPeriodSection, PeriodLengthSection, CycleLengthSection, HurdlesSection } from "./cycleForm";
import { TRACKING_STYLES } from "./Onboarding";

/* ---------------------------------------------------------------
   EDIT SCREENS — the onboarding questions again, opened from Profile.
   Changes save as they are made; Done just goes back.
   --------------------------------------------------------------- */

const close = () => (router.canGoBack?.() ? router.back() : router.replace("/profile"));

const Header = ({ title }) => (
  <View style={[s.row, { justifyContent: "space-between", marginBottom: 18 }]}>
    <IconBtn label="Back" onPress={close}>
      <ChevronLeft size={18} color={T.ink} />
    </IconBtn>
    <Eyebrow>{title}</Eyebrow>
    <View style={{ width: 44 }} />
  </View>
);

export function EditCycle() {
  const { profile, setProfile, now } = useApp();
  const today = dateKey(now);
  return (
    <Screen>
      <Header title="Your cycle" />
      <Serif size={24} accessibilityRole="header" style={{ marginBottom: 12 }}>
        Last period
      </Serif>
      <LastPeriodSection data={profile} set={setProfile} today={today} />
      <Serif size={22} style={{ marginTop: 28, marginBottom: 10 }}>
        Period length
      </Serif>
      <PeriodLengthSection data={profile} set={setProfile} />
      <Serif size={22} style={{ marginTop: 28, marginBottom: 10 }}>
        Cycle length
      </Serif>
      <CycleLengthSection data={profile} set={setProfile} today={today} />
      <View style={{ marginTop: 28 }}>
        <Button label="Done" onPress={close} />
      </View>
    </Screen>
  );
}

const GOALS = ["Stronger", "Less exhausted", "In tune with my body"];

export function EditAbout() {
  const { profile: p, setProfile } = useApp();
  return (
    <Screen>
      <Header title="About you" />
      <ToggleRow
        label="Which decade are you in?"
        sublabel="This sets how hard strength sets go and your recovery load."
        value={p.ageGroup === "40+"}
        onChange={(v) => setProfile({ ageGroup: v ? "40+" : "20s/30s" })}
        leftLabel="20s / 30s"
        rightLabel="40+"
      />
      <ToggleRow
        label="Hormonal birth control"
        sublabel="If yes, we follow how you feel instead of the calendar."
        value={p.onBirthControl}
        onChange={(v) => setProfile({ onBirthControl: v })}
        leftLabel="No"
        rightLabel="Yes"
      />

      <SectionLabel>Intention</SectionLabel>
      <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 22 }]}>
        {GOALS.map((g) => (
          <Chip key={g} label={g} selected={p.goal === g} onPress={() => setProfile({ goal: g })} />
        ))}
      </View>

      <SectionLabel>Nutrition tracking style</SectionLabel>
      <View style={{ gap: 8, marginBottom: 22 }}>
        {TRACKING_STYLES.map(({ key, sub }) => {
          const on = p.trackingStyle === key;
          return (
            <Pressable
              key={key}
              onPress={() => setProfile({ trackingStyle: key })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={key}
              style={[styles.option, { borderColor: on ? T.sage : T.hair }]}
            >
              <View style={{ flex: 1 }}>
                <Body size={14} weight="medium" color={T.ink}>
                  {key}
                </Body>
                <Body size={12}>{sub}</Body>
              </View>
              {on && <Check size={16} color={T.sage} />}
            </Pressable>
          );
        })}
      </View>

      <Serif size={22} style={{ marginBottom: 10 }}>
        Hardest hurdles
      </Serif>
      <HurdlesSection value={p.hurdles} onChange={(hurdles) => setProfile({ hurdles })} />
      <View style={{ marginTop: 28 }}>
        <Button label="Done" onPress={close} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: T.canvas },
});
