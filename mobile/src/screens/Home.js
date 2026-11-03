import React, { useState } from "react";
import { View, Text, Pressable, Image, Modal, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Users, User, UserMinus, TrendingUp, Pause, Leaf, ShieldCheck, X } from "lucide-react-native";
import { MODES, UI_COPY, getPhase, groupForPhase } from "../shared";
import { journalSignals } from "../content/journal";
import { dayMovement, weightOf } from "../lib/activity";
import { encouragement } from "../lib/encourage";
import { Encouragement } from "../ui/activity";
import { motivationFor } from "../content/motivation";
import { useApp } from "../state/AppState";
import { VIBE_COLORS, VIBE_NAMES, weekVibes, summarizeWeek, recentWeeks } from "../lib/vibes";
import { MoodBubble } from "../ui/MoodBubble";
import { T, F, IMG } from "../ui/theme";
import { Screen, Card, Button, Chip, Serif, Body, SectionLabel, Instruction, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   2. THE HOME SANCTUARY
   --------------------------------------------------------------- */

export const MODE_STYLE = {
  Inward: { caption: "Rest", ring: T.aegean },
  Steady: { caption: "Balance", ring: T.sage },
  Outward: { caption: "High energy", ring: T.terracotta },
};

/** Today's motivation — a new picture every day, like a photo widget.
 *  Portrait, because the quotes sit across the middle of tall images;
 *  tap to see the whole picture. */
const MotivationCard = ({ now }) => {
  const [open, setOpen] = useState(false);
  const source = motivationFor(now);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Today's motivation. Tap to see the whole picture."
        style={styles.motivation}
        testID="motivation"
      >
        <Image source={source} style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} resizeMode="cover" />
        <View style={styles.todayPill}>
          <Text style={{ fontFamily: F.sansSemi, fontSize: 10.5, letterSpacing: 1.5, color: T.ink }}>TODAY</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.viewer} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Close picture">
          <Image source={source} style={{ width: "100%", height: "86%" }} resizeMode="contain" />
          <View style={styles.closeBtn}>
            <X size={18} color={T.canvas} />
          </View>
        </Pressable>
      </Modal>
    </>
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
          <View style={[styles.vibeRing, on ? { backgroundColor: VIBE_COLORS[key], padding: 4 } : { borderWidth: 1.5, borderColor: T.hair }]}>
            <Image source={IMG.vibes[key]} style={[styles.vibeImg, !on && { opacity: 0.55 }]} resizeMode="cover" />
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

/** This week's mood bubble, with the last few weeks to look back on. */
const WEEK_LABEL = ["Three weeks ago", "Two weeks ago", "Last week", "This week"];

const shortWeek = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const describe = (s) =>
  `${s.counts.Inward} Inward, ${s.counts.Steady} Balance, ${s.counts.Outward} Outward, ${s.logged} of 7 days`;

const WeekBubble = ({ days, now }) => {
  const weeks = recentWeeks(now, 4);
  const [picked, setPicked] = useState(weeks.length - 1);
  const vibes = weekVibes(days, weeks[picked]);
  const summary = summarizeWeek(vibes);

  return (
    <View style={{ alignItems: "center", marginBottom: 28 }} testID="week-bubble">
      <SectionLabel>{`${WEEK_LABEL[picked]} · from ${shortWeek(weeks[picked])}`}</SectionLabel>
      <MoodBubble vibes={vibes} size={200} id="big" label={`Mood bubble, ${describe(summary)}`} />
      <Body size={13.5} color={T.ink} style={{ textAlign: "center", marginTop: 12, maxWidth: 280 }} testID="week-headline">
        {summary.headline}
      </Body>

      <View style={[s.row, { gap: 14, marginTop: 10 }]}>
        {Object.keys(VIBE_COLORS).map((v) => (
          <View key={v} style={[s.row, { gap: 6 }]}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: VIBE_COLORS[v] }} />
            <Body size={12}>{`${VIBE_NAMES[v]} ${summary.counts[v]}`}</Body>
          </View>
        ))}
      </View>

      <View style={[s.row, { gap: 10, marginTop: 16 }]}>
        {weeks.map((w, i) => {
          const wv = weekVibes(days, w);
          const on = i === picked;
          return (
            <Pressable
              key={w}
              onPress={() => setPicked(i)}
              accessibilityRole="button"
              accessibilityLabel={`${WEEK_LABEL[i]}: ${describe(summarizeWeek(wv))}`}
              accessibilityState={{ selected: on }}
              style={[styles.weekPick, on && { borderColor: T.ink }]}
            >
              <MoodBubble vibes={wv} size={46} id={`mini${i}`} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

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

export function Home() {
  const { ctx, today, setToday, profile, days, now } = useApp();
  const training = profile.tracking?.training ?? true;
  const move = dayMovement(today, weightOf(profile));
  const message = encouragement({
    phase: ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null,
    moved: move.moved,
    meditated: move.minutes.meditation > 0,
    signals: journalSignals(today.journal),
  });
  return (
    <Screen image={IMG.backgrounds.home} scrim="rgba(242,239,230,0.3)">
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

      <MotivationCard now={now} />

      <Encouragement message={message} />

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

      <WeekBubble days={days ?? {}} now={now} />

      {ctx.fork && !today.vibe && <ForkCheckIn fork={ctx.fork} checkIn={today.checkIn} onChange={(checkIn) => setToday({ checkIn })} />}

      {training && <PrescriptionCard ctx={ctx} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  motivation: { width: "100%", aspectRatio: 4 / 5, borderRadius: 24, overflow: "hidden", marginBottom: 24, backgroundColor: T.canvasDeep },
  todayPill: { position: "absolute", top: 14, left: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(242,239,230,0.88)" },
  viewer: { flex: 1, backgroundColor: "rgba(20,24,22,0.92)", alignItems: "center", justifyContent: "center", padding: 16 },
  closeBtn: { position: "absolute", top: 54, right: 20, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(242,239,230,0.18)" },
  vibeRing: { width: 76, height: 76, borderRadius: 38, overflow: "hidden", alignItems: "center", justifyContent: "center", padding: 3 },
  vibeImg: { width: "100%", height: "100%", borderRadius: 38 },
  weekPick: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
});
