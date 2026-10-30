import React from "react";
import { View, Text, Pressable, Image, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, ArrowRight, Users, User, UserMinus, TrendingUp, Pause, Leaf, ShieldCheck } from "lucide-react-native";
import { MODES, UI_COPY, timeline, streak, STATUS } from "../shared";
import { useApp } from "../state/AppState";
import { T, F, IMG } from "../ui/theme";
import { Screen, Card, Button, Chip, Serif, Body, SectionLabel, Instruction, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   2. THE HOME SANCTUARY
   --------------------------------------------------------------- */

export const MODE_STYLE = {
  Inward: { caption: "Rest", ring: T.aegean },
  Steady: { caption: "Baseline", ring: T.sage },
  Outward: { caption: "High energy", ring: T.terracotta },
};

/** The Imprint Zone — a third of the screen, one affirmation, no digits. */
const ImprintZone = ({ text }) => {
  const { height } = useWindowDimensions();
  return (
    <View
      style={[styles.imprint, { height: Math.min(300, Math.max(220, height / 3)) }]}
      accessibilityRole="summary"
      accessibilityLabel="Today's imprint"
      testID="imprint"
    >
      <Image source={IMG.hero} style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} resizeMode="cover" />
      <LinearGradient colors={["rgba(42,38,34,0.05)", "rgba(31,58,95,0.9)"]} locations={[0.2, 1]} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
      <Serif size={27} color={T.canvas} style={{ padding: 22 }}>
        {text}
      </Serif>
    </View>
  );
};

/** Vibe Check — three radio buttons; each one rewrites today's plan. */
const VibeCheck = ({ value, onChange }) => (
  <View accessibilityRole="radiogroup" accessibilityLabel="Vibe Check" style={[s.row, { justifyContent: "space-between", marginBottom: 26 }]}>
    {MODES.map((key) => {
      const on = value === key;
      const { caption, ring } = MODE_STYLE[key];
      return (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          accessibilityRole="radio"
          accessibilityState={{ checked: on }}
          accessibilityLabel={`${key}, ${caption}`}
          style={{ width: 96, alignItems: "center", gap: 8 }}
        >
          <View style={[styles.vibeRing, on ? { backgroundColor: ring, padding: 4 } : { borderWidth: 1.5, borderColor: T.hair }]}>
            <Image source={IMG.hero} style={[styles.vibeImg, !on && { opacity: 0.6 }]} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: on ? F.sansSemi : F.sansMed, fontSize: 12.5, color: T.ink }}>{key}</Text>
            <Text style={{ fontFamily: F.sans, fontSize: 11, color: T.inkSoft }}>{caption}</Text>
          </View>
        </Pressable>
      );
    })}
  </View>
);

/** Late Luteal Fork — the expanded check-in for the last days. */
const ForkCheckIn = ({ fork, checkIn, onChange }) => {
  const set = (patch) => onChange({ ...checkIn, ...patch });
  return (
    <Card style={{ backgroundColor: T.canvasDeep, marginBottom: 24 }}>
      <Body size={13.5} weight="medium" color={T.ink}>
        A quick extra check-in
      </Body>
      <Body size={12.5} style={{ marginBottom: 14 }}>
        {UI_COPY.forkPrompt}
      </Body>
      <SectionLabel>Social battery</SectionLabel>
      <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 14 }]}>
        <Chip icon={Users} label="Butterfly" selected={checkIn.social === "butterfly"} onPress={() => set({ social: "butterfly" })} />
        <Chip icon={User} label="Neutral" selected={checkIn.social === "neutral"} onPress={() => set({ social: "neutral" })} />
        <Chip icon={UserMinus} label="The Hermit" selected={checkIn.social === "hermit"} onPress={() => set({ social: "hermit" })} />
      </View>
      <SectionLabel>Drive</SectionLabel>
      <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
        <Chip icon={TrendingUp} label="Ready to push" selected={checkIn.drive === "high"} onPress={() => set({ drive: "high" })} />
        <Chip icon={Pause} label="Running low" selected={checkIn.drive === "low"} onPress={() => set({ drive: "low" })} />
      </View>
      {fork.path && (
        <Serif size={15} italic style={{ marginTop: 14 }} accessibilityLiveRegion="polite">
          {fork.path === "wipeout" ? UI_COPY.wipeout : UI_COPY.surge}
        </Serif>
      )}
    </Card>
  );
};

const PrescriptionCard = ({ ctx }) => {
  const p = ctx.prescription;
  return (
    <Card style={{ marginBottom: 26 }} accessibilityLabel="Today's prescription" testID="prescription">
      <View style={[s.row, { gap: 8, marginBottom: 6 }]}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: MODE_STYLE[p.mode].ring }} />
        <SectionLabel>{`Today · ${p.mode}`}</SectionLabel>
      </View>
      <Serif size={21}>{p.title}</Serif>
      <Body size={13} style={{ marginTop: 4, marginBottom: 8 }}>
        {p.summary}
      </Body>
      <Instruction topic="prescription" />
      <View style={{ marginTop: 10 }}>
        <Button tone="outline" size="sm" full={false} label="Open the plan" icon={ArrowRight} onPress={() => router.push("/workouts")} />
      </View>
    </Card>
  );
};

/** Streak of green checks. Paused days are hollow and never break it. */
const Streak = ({ history }) => {
  const days = timeline(history);
  const count = streak(history);
  return (
    <View accessibilityLabel="Your streak">
      <SectionLabel>Showing up · last seven days</SectionLabel>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 8 }]}>
        {days.map((st, i) => (
          <View
            key={i}
            accessible
            accessibilityLabel={st === STATUS.DONE ? "Done" : "Paused"}
            style={[styles.day, st === STATUS.DONE ? { backgroundColor: T.sage } : { borderWidth: 1.5, borderStyle: "dashed", borderColor: T.inkSoft }]}
          >
            {st === STATUS.DONE && <Check size={17} color={T.canvas} strokeWidth={2.4} />}
          </View>
        ))}
      </View>
      <Body size={12}>
        {count === 0 ? "Your first check is one session or one rest day away." : `${count} day${count === 1 ? "" : "s"} of showing up. Paused days wait for you.`}
      </Body>
    </View>
  );
};

export function Home() {
  const { ctx, today, setToday, history, profile } = useApp();
  const training = profile.tracking?.training ?? true;
  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 16 }]}>
        <View style={{ width: 44 }} />
        <View style={[s.row, { gap: 6 }]}>
          <Leaf size={14} color={T.ink} strokeWidth={1.5} />
          <Serif size={20}>Selena</Serif>
        </View>
        <IconBtn label="Privacy & data" onPress={() => router.push("/privacy")}>
          <ShieldCheck size={17} color={T.ink} strokeWidth={1.6} />
        </IconBtn>
      </View>

      <ImprintZone text={ctx.affirmation} />

      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Body size={13.5} weight="medium" color={T.ink} accessibilityRole="header">
          Vibe Check
        </Body>
        {today.vibe && (
          <Pressable onPress={() => setToday({ vibe: null })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Body size={12} style={{ textDecorationLine: "underline" }}>
              Let the rhythm decide
            </Body>
          </Pressable>
        )}
      </View>
      <Body size={12.5} style={{ marginBottom: 14 }}>
        {ctx.promptVibeCheck ? UI_COPY.vibePrompt : "Where is your energy going today?"}
      </Body>
      <VibeCheck value={today.vibe ?? (ctx.promptVibeCheck ? null : ctx.mode)} onChange={(vibe) => setToday({ vibe })} />

      {ctx.fork && !today.vibe && <ForkCheckIn fork={ctx.fork} checkIn={today.checkIn} onChange={(checkIn) => setToday({ checkIn })} />}

      {training && <PrescriptionCard ctx={ctx} />}
      {training && <Streak history={history} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  imprint: { borderRadius: 24, overflow: "hidden", justifyContent: "flex-end", marginBottom: 24 },
  vibeRing: { width: 76, height: 76, borderRadius: 38, overflow: "hidden", alignItems: "center", justifyContent: "center", padding: 3 },
  vibeImg: { width: "100%", height: "100%", borderRadius: 38 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
