import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft, ArrowRight, Leaf, Sun, Moon, Check, Camera, ImagePlus, ShieldCheck } from "lucide-react-native";
import { PRIVACY_HEADLINE, PRIVACY_SUMMARY, AGREE_LABEL } from "../shared";
import { AgreementText } from "./Privacy";
import { TrackChoices, DEFAULT_TRACKING } from "../ui/TrackChoices";
import { useApp, dateKey } from "../state/AppState";
import { T, F, tone, IMG } from "../ui/theme";
import { Eyebrow, IconBtn, Button, Card, ToggleRow, Dots, Serif, Body, s } from "../ui/kit";
import { LastPeriodSection, PeriodLengthSection, CycleLengthSection, HurdlesSection } from "./cycleForm";

/* ---------------------------------------------------------------
   1. ONBOARDING — the Sanctuary Gateway

   Each step owns its backdrop so the flow breathes between dark and
   light. Questions with calendars sit on light washes for legibility.
   The scrim sits above the photo to guarantee text contrast.
   --------------------------------------------------------------- */

const DARK_SCRIM = ["rgba(18,30,24,0.82)", "rgba(16,26,22,0.89)", "rgba(14,22,19,0.94)"];
const LIGHT_SCRIM = ["rgba(250,245,240,0.86)", "rgba(249,241,238,0.78)", "rgba(248,238,236,0.72)"];

/** Art (index into IMG.onboarding), scrim and ink for each step, in order. */
const STEPS = [
  { art: 0, dark: true, scrim: ["rgba(20,28,26,0.30)", "rgba(20,28,26,0.10)", "rgba(16,22,20,0.80)", "rgba(16,22,20,0.92)"] }, // welcome
  { art: 3, dark: false, scrim: ["rgba(242,239,230,0.94)", "rgba(242,239,230,0.90)", "rgba(242,239,230,0.88)"] }, // privacy
  { art: 1, dark: false, scrim: ["rgba(250,244,238,0.74)", "rgba(250,240,236,0.60)", "rgba(250,238,235,0.52)"] }, // intention
  { art: 1, dark: false, scrim: LIGHT_SCRIM }, // what to track
  { art: 2, dark: true, scrim: DARK_SCRIM }, // about you
  { art: 3, dark: false, scrim: LIGHT_SCRIM }, // last period
  { art: 3, dark: false, scrim: LIGHT_SCRIM }, // cycle length
  { art: 1, dark: false, scrim: LIGHT_SCRIM }, // hurdles
  { art: 3, dark: false, scrim: LIGHT_SCRIM }, // nutrition style
  { art: 4, dark: true, scrim: ["rgba(16,26,32,0.84)", "rgba(14,24,30,0.90)", "rgba(12,20,26,0.95)"] }, // photo
];
const TOTAL_DOTS = STEPS.length - 1;

export const TRACKING_STYLES = [
  { key: "Exact macros", sub: "Track every macro with precision" },
  { key: "Protein & Calories only", sub: "Keep it simple and high level" },
  { key: "Visual plates", sub: "Use portion-based visual guidance" },
];

const Header = ({ step, label, back, dark }) => (
  <View style={[s.row, { justifyContent: "space-between", marginBottom: 26 }]}>
    <IconBtn label="Back" onPress={back} dark={dark}>
      <ChevronLeft size={18} color={tone(dark).text} />
    </IconBtn>
    <Eyebrow step={step} dark={dark}>
      {label}
    </Eyebrow>
    <View style={{ width: 44 }} />
  </View>
);

const Footer = ({ active, back, next, dark, nextLabel = "Next", disabled = false }) => (
  <View style={{ marginTop: "auto", paddingTop: 28, gap: 22 }}>
    <View style={[s.row, { gap: 12 }]}>
      <Button tone="outline" full={false} dark={dark} label="Back" onPress={back} />
      <View style={{ flex: 1 }}>
        <Button label={nextLabel} onPress={next} disabled={disabled} />
      </View>
    </View>
    <Dots total={TOTAL_DOTS} active={active} dark={dark} />
  </View>
);

/* ---- 1.0 Welcome ---- */
const Welcome = ({ next }) => (
  <View style={{ flex: 1 }}>
    <View style={[s.row, { justifyContent: "center", gap: 6, paddingTop: 8 }]}>
      <Leaf size={15} color={T.canvas} strokeWidth={1.5} />
      <Serif size={25} color={T.canvas}>
        Selena
      </Serif>
    </View>
    <View style={{ marginTop: "auto" }}>
      <Serif size={37} color={T.canvas} accessibilityRole="header">
        {"Your cycle,\nyour rhythm,\nyour power."}
      </Serif>
      <Body size={14} color="rgba(242,239,230,0.86)" style={{ marginTop: 14, marginBottom: 34, maxWidth: 240 }}>
        A sanctuary for your body, mind and energy.
      </Body>
      <Button tone="outline" dark label="Get started" icon={ArrowRight} onPress={next} />
    </View>
  </View>
);

/* ---- 1.1 Privacy agreement — before Selena asks for anything ---- */
const Agreement = ({ accepted, accept, next, back }) => {
  const [checked, setChecked] = useState(!!accepted);
  const go = () => {
    accept();
    next();
  };
  return (
    <View style={{ flex: 1 }}>
      <Header step={1} label="Privacy" back={back} />
      <View style={[s.row, { gap: 10 }]}>
        <ShieldCheck size={24} color={T.sage} strokeWidth={1.6} />
        <Serif size={28} accessibilityRole="header">
          {PRIVACY_HEADLINE}
        </Serif>
      </View>
      <Body size={14} color={T.ink} style={{ marginTop: 10, marginBottom: 20 }}>
        {PRIVACY_SUMMARY}
      </Body>
      <Card style={{ marginBottom: 18 }}>
        <AgreementText />
      </Card>
      <Pressable
        onPress={() => setChecked(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={AGREE_LABEL}
        style={[s.row, { gap: 12, minHeight: 48, alignItems: "flex-start" }]}
      >
        <View style={[styles.box, checked && { backgroundColor: T.sage, borderColor: T.sage }]}>
          {checked && <Check size={15} color={T.canvas} strokeWidth={2.6} />}
        </View>
        <Body size={13.5} color={T.ink} style={{ flex: 1 }}>
          {AGREE_LABEL}
        </Body>
      </Pressable>
      <Footer active={0} back={back} next={go} nextLabel={checked ? "Agree and continue" : "Tick the box to continue"} disabled={!checked} />
    </View>
  );
};

/* ---- 1.2 Intention ---- */
const Intention = ({ data, set, next, back }) => (
  <View style={{ flex: 1 }}>
    <Header step={2} label="Onboarding" back={back} />
    <Serif size={30} accessibilityRole="header">
      {"How do you want\nto feel in a few months?"}
    </Serif>
    <Body style={{ marginTop: 10, marginBottom: 30, maxWidth: 280 }}>
      This is about your energy, mood and overall wellbeing, not just numbers.
    </Body>
    <View style={{ gap: 12 }} accessibilityRole="radiogroup">
      {[
        { label: "Stronger", icon: Sun, accent: T.terracotta },
        { label: "Less exhausted", icon: Leaf, accent: T.sage },
        { label: "In tune with my body", icon: Moon, accent: T.aegean },
      ].map(({ label, icon: Icon, accent }) => {
        const on = data.goal === label;
        return (
          <Pressable
            key={label}
            onPress={() => set({ goal: label })}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.pill, { backgroundColor: on ? accent : T.canvas, borderColor: on ? accent : T.hair }]}
          >
            <Icon size={18} strokeWidth={1.6} color={on ? T.canvas : T.ink} />
            <Text style={{ flex: 1, fontFamily: on ? F.sansSemi : F.sansMed, fontSize: 15, color: on ? T.canvas : T.ink }}>{label}</Text>
            {on && <Check size={16} color={T.canvas} />}
          </Pressable>
        );
      })}
    </View>
    <View style={{ marginTop: "auto", paddingTop: 28, gap: 22 }}>
      <Button label="Next" onPress={next} />
      <Dots total={TOTAL_DOTS} active={1} />
    </View>
  </View>
);

/* ---- 1.3 What to track — the cycle always, the rest by choice ---- */
const Track = ({ data, set, next, back }) => (
  <View style={{ flex: 1 }}>
    <Header step={3} label="Onboarding" back={back} />
    <Serif size={28} accessibilityRole="header">
      {"What do you want\nSelena to follow?"}
    </Serif>
    <Body style={{ marginTop: 10, marginBottom: 24, maxWidth: 290 }}>
      Your cycle is always the starting point. Add the rest only if it helps. You can change this any time.
    </Body>
    <TrackChoices value={data.tracking ?? DEFAULT_TRACKING} onChange={(tracking) => set({ tracking })} />
    <Footer active={2} back={back} next={next} />
  </View>
);

/* ---- 1.4 About you ---- */
const About = ({ data, set, next, back }) => {
  const c = tone(true);
  return (
    <View style={{ flex: 1 }}>
      <Header step={4} label="About you" back={back} dark />
      <Serif size={28} color={c.text} accessibilityRole="header">
        {"Let's get to know\nyour body."}
      </Serif>
      <Body color={c.textSoft} style={{ marginTop: 10, marginBottom: 24, maxWidth: 280 }}>
        Two quick questions that change how Selena plans your training and reads your cycle.
      </Body>
      <ToggleRow
        dark
        label="Which decade are you in?"
        sublabel="This sets how hard strength sets go and your recovery load."
        value={data.ageGroup === "40+"}
        onChange={(v) => set({ ageGroup: v ? "40+" : "20s/30s" })}
        leftLabel="20s / 30s"
        rightLabel="40+"
      />
      <ToggleRow
        dark
        label="Hormonal birth control"
        sublabel="If yes, we follow how you feel instead of the calendar."
        value={data.onBirthControl}
        onChange={(v) => set({ onBirthControl: v })}
        leftLabel="No"
        rightLabel="Yes"
      />
      <Footer active={3} back={back} next={next} dark />
    </View>
  );
};

/* ---- 1.5 Last period, and how long periods last ---- */
const LastPeriod = ({ data, set, today, next, back }) => (
  <View style={{ flex: 1 }}>
    <Header step={5} label="Your period" back={back} />
    <Serif size={28} accessibilityRole="header">
      {"When was your\nlast period?"}
    </Serif>
    <Body style={{ marginTop: 10, marginBottom: 18, maxWidth: 300 }}>
      Tap the day it started, then the day it ended. Not sure? That's fine too.
    </Body>
    <LastPeriodSection data={data} set={set} today={today} />
    <Body size={14} weight="medium" color={T.ink} style={{ marginTop: 26, marginBottom: 10 }} accessibilityRole="header">
      How long does your period usually last?
    </Body>
    <PeriodLengthSection data={data} set={set} />
    <Footer active={4} back={back} next={next} />
  </View>
);

/* ---- 1.6 Cycle length ---- */
const CycleLength = ({ data, set, today, next, back }) => (
  <View style={{ flex: 1 }}>
    <Header step={6} label="Your cycle" back={back} />
    <Serif size={28} accessibilityRole="header">
      {"How long is\nyour cycle?"}
    </Serif>
    <Body style={{ marginTop: 10, marginBottom: 18, maxWidth: 300 }}>
      From the first day of one period to the first day of the next. Most cycles are somewhere between 21 and 35 days.
    </Body>
    <CycleLengthSection data={data} set={set} today={today} />
    <Footer active={5} back={back} next={next} />
  </View>
);

/* ---- 1.7 Hardest hurdles ---- */
const Hurdles = ({ data, set, next, back }) => (
  <View style={{ flex: 1 }}>
    <Header step={7} label="Your hurdles" back={back} />
    <Serif size={28} accessibilityRole="header">
      {"What makes your\ncycle hardest?"}
    </Serif>
    <Body style={{ marginTop: 10, marginBottom: 18, maxWidth: 300 }}>
      Choose as many as apply. Selena uses these to decide what to watch for and when.
    </Body>
    <HurdlesSection value={data.hurdles} onChange={(hurdles) => set({ hurdles })} />
    <Footer active={6} back={back} next={next} />
  </View>
);

/* ---- 1.8 Tracking style (only when nutrition is on) ---- */
const Tracking = ({ data, set, next, back }) => (
  <View style={{ flex: 1 }}>
    <Header step={8} label="Nutrition" back={back} />
    <Serif size={28} accessibilityRole="header">
      {"How do you prefer\nto track nutrition?"}
    </Serif>
    <Body style={{ marginTop: 10, marginBottom: 28, maxWidth: 280 }}>
      Choose what feels good for you. You can always change this later.
    </Body>
    <View style={{ gap: 12 }} accessibilityRole="radiogroup">
      {TRACKING_STYLES.map(({ key, sub }) => {
        const on = data.trackingStyle === key;
        return (
          <Pressable
            key={key}
            onPress={() => set({ trackingStyle: key })}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={key}
            style={[styles.option, { backgroundColor: on ? T.canvasDeep : T.canvas, borderColor: on ? T.sage : T.hair }]}
          >
            <View style={{ flex: 1 }}>
              <Body size={15} weight="medium" color={T.ink}>
                {key}
              </Body>
              <Body size={12.5}>{sub}</Body>
            </View>
            {on && (
              <View style={styles.check}>
                <Check size={13} color={T.canvas} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
    <Footer active={7} back={back} next={next} />
  </View>
);

/* ---- 1.9 Baseline photo — Polaroid, private, face softened ---- */

/** The face is softened by blurring the upper band of the frame, where a
 *  face sits in a standard mirror photo. Real face detection would replace
 *  this before launch. */
const Polaroid = ({ uri }) => (
  <View style={styles.polaroid}>
    <View style={{ height: 250, borderRadius: 2, overflow: "hidden", backgroundColor: T.canvasDeep }}>
      {uri ? (
        <>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Your baseline photo, face softened" />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: "42%", overflow: "hidden" }}>
            <Image source={{ uri }} blurRadius={28} style={{ width: "100%", height: 250 }} resizeMode="cover" />
          </View>
        </>
      ) : (
        <Image source={IMG.vault} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel="Empty baseline photo frame" />
      )}
    </View>
    <Serif size={15} italic style={{ textAlign: "center", marginTop: 12 }}>
      Scales lie. This won't.
    </Serif>
  </View>
);

const Photo = ({ data, set, done, back }) => {
  const c = tone(true);
  const [note, setNote] = useState(null);

  const pick = async (fromCamera) => {
    setNote(null);
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setNote("Camera access is off. You can choose a photo from your library instead.");
          return;
        }
      }
      const opts = { mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [4, 5] };
      const result = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!result.canceled && result.assets?.[0]) set({ baselinePhoto: result.assets[0].uri });
    } catch {
      setNote("The camera isn't available here. You can choose a photo from your library instead.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header step={9} label="Baseline photo" back={back} dark />
      <Serif size={28} color={c.text} accessibilityRole="header">
        {"Scales lie.\nMirrors remember."}
      </Serif>
      <Body color={c.textSoft} style={{ marginTop: 10, marginBottom: 24, maxWidth: 290 }}>
        An optional photo to look back on. Progress shows up in how you move and feel long before a number does.
      </Body>

      <Polaroid uri={data.baselinePhoto} />

      <Body size={12} color={c.textSoft} style={{ textAlign: "center", marginTop: 18, marginBottom: 18 }}>
        Stays on this device. Your face is blurred automatically.
      </Body>
      {note && (
        <Body size={12.5} color={c.text} style={{ textAlign: "center", marginBottom: 12 }}>
          {note}
        </Body>
      )}

      <View style={{ gap: 10 }}>
        <View style={[s.row, { gap: 10 }]}>
          <View style={{ flex: 1 }}>
            <Button label="Take photo" icon={Camera} onPress={() => pick(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button tone="outline" dark label="Choose" icon={ImagePlus} onPress={() => pick(false)} accessibilityLabel="Choose from library" />
          </View>
        </View>
        <Button tone="quiet" dark label={data.baselinePhoto ? "Enter the sanctuary" : "Skip for now"} onPress={done} />
      </View>

      <View style={{ marginTop: "auto", paddingTop: 20 }}>
        <Dots total={TOTAL_DOTS} active={8} dark />
      </View>
    </View>
  );
};

export function Onboarding() {
  const { profile, setProfile, completeOnboarding, now, agreement, acceptAgreement } = useApp();
  const today = dateKey(now);
  const [step, setStep] = useState(0);
  const go = (n) => () => setStep(n);
  const nutrition = (profile.tracking ?? DEFAULT_TRACKING).nutrition;
  const done = () => {
    completeOnboarding();
    router.replace("/");
  };

  const screens = [
    <Welcome key="0" next={go(1)} />,
    <Agreement key="1" accepted={agreement} accept={acceptAgreement} next={go(2)} back={go(0)} />,
    <Intention key="2" data={profile} set={setProfile} next={go(3)} back={go(1)} />,
    <Track key="3" data={profile} set={setProfile} next={go(4)} back={go(2)} />,
    <About key="4" data={profile} set={setProfile} next={go(5)} back={go(3)} />,
    <LastPeriod key="5" data={profile} set={setProfile} today={today} next={go(6)} back={go(4)} />,
    <CycleLength key="6" data={profile} set={setProfile} today={today} next={go(7)} back={go(5)} />,
    <Hurdles key="7" data={profile} set={setProfile} next={go(nutrition ? 8 : 9)} back={go(6)} />,
    <Tracking key="8" data={profile} set={setProfile} next={go(9)} back={go(7)} />,
    <Photo key="9" data={profile} set={setProfile} done={done} back={go(nutrition ? 8 : 7)} />,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: STEPS[step].dark ? T.aegean : T.canvas }}>
      <Image source={IMG.onboarding[STEPS[step].art]} style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} resizeMode="cover" />
      <LinearGradient colors={STEPS[step].scrim} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView key={step} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
          {screens[step]}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { minHeight: 52, borderRadius: 999, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22 },
  option: { minHeight: 64, borderRadius: 20, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.sage, alignItems: "center", justifyContent: "center" },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: T.inkSoft, alignItems: "center", justifyContent: "center", marginTop: 1 },
  polaroid: {
    alignSelf: "center",
    width: 236,
    padding: 12,
    paddingBottom: 18,
    backgroundColor: T.canvas,
    borderRadius: 6,
    transform: [{ rotate: "-2deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
