import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Home, Plane, Dumbbell, Activity, Building2, PersonStanding, Flower2, Waves, Sparkles, ChevronRight } from "lucide-react-native";
import { getPhase, groupForPhase, CAL_GROUPS } from "../shared";
import { useApp } from "../state/AppState";
import { PROGRAMS, PROGRAM, PLACES, GOALS, LEVELS } from "../content/programs";
import { newId } from "../lib/food";
import { RoutineCard, useWorkoutActions } from "../ui/workout";
import { YogaMeditation } from "../ui/activity";
import { OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Card, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   EXPLORE — ready programs, filtered by level, goal and equipment;
   a trainer that picks one for her needs and phase; and routines by
   place, with yoga and meditation alongside.
   --------------------------------------------------------------- */

const PLACE_ICON = { home: Home, travel: Plane, dumbbells: Dumbbell, band: Waves, cardio: Activity, gym: Building2, bodyweight: PersonStanding, kettlebell: Dumbbell, stretch: Flower2 };
const cap = (x) => `${x[0].toUpperCase()}${x.slice(1)}`;
const phaseLabel = (k) => CAL_GROUPS.find((g) => g.key === k)?.label;
const back = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

const Header = ({ title }) => (
  <View style={[s.row, { gap: 12, marginBottom: 14 }]}>
    <IconBtn label="Back" onPress={back}>
      <ArrowLeft size={20} color={T.ink} />
    </IconBtn>
    <Text style={styles.headTitle} accessibilityRole="header">
      {title}
    </Text>
  </View>
);

const ProgramCard = ({ p }) => (
  <Pressable onPress={() => router.push({ pathname: "/workout/program/[id]", params: { id: p.id } })} accessibilityRole="button" accessibilityLabel={p.name} style={[s.row, styles.program]}>
    <View style={styles.programArt}>
      <Text style={styles.programArtText}>{p.name.split(" ").slice(0, 2).join("\n").toUpperCase()}</Text>
    </View>
    <View style={{ flex: 1, gap: 4, padding: 14 }}>
      <Text style={styles.programName}>{p.name}</Text>
      <Body size={12.5}>{`${cap(p.level)} · ${p.routines.length} ${p.routines.length === 1 ? "routine" : "routines"}`}</Body>
    </View>
  </Pressable>
);

export function Explore() {
  const [level, setLevel] = useState(null);
  const [goal, setGoal] = useState(null);
  const [place, setPlace] = useState(null);
  const [all, setAll] = useState(false);
  const list = PROGRAMS.filter((p) => (!level || p.level === level) && (!goal || p.goal === goal) && (!place || p.places.includes(place)));
  const shown = all ? list : list.slice(0, 3);

  return (
    <Screen>
      <Header title="Explore" />
      <Text style={styles.section}>Programs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
        <Chip label="Any level" selected={!level} onPress={() => setLevel(null)} />
        {LEVELS.map((l) => (
          <Chip key={l} label={cap(l)} selected={level === l} onPress={() => setLevel(level === l ? null : l)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
        <Chip label="Any goal" selected={!goal} onPress={() => setGoal(null)} />
        {GOALS.map((g) => (
          <Chip key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(goal === g.key ? null : g.key)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
        <Chip label="Any equipment" selected={!place} onPress={() => setPlace(null)} />
        {PLACES.map((p) => (
          <Chip key={p.key} label={p.label} selected={place === p.key} onPress={() => setPlace(place === p.key ? null : p.key)} />
        ))}
      </ScrollView>

      <View style={{ gap: 10 }} testID="programs">
        {shown.map((p) => (
          <ProgramCard key={p.id} p={p} />
        ))}
        {!list.length && <Body>No program matches all of these. Try fewer filters.</Body>}
      </View>
      {list.length > 3 && (
        <Pressable onPress={() => setAll(!all)} accessibilityRole="button" accessibilityLabel={all ? "Show fewer programs" : `Show all ${list.length} programs`} style={styles.showAll}>
          <Text style={styles.showAllText}>{all ? "Show fewer" : `Show all ${list.length} programs`}</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.push("/workout/trainer")} accessibilityRole="button" accessibilityLabel="Trainer: a program for your needs" style={[s.row, styles.trainer]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.trainerTitle}>Trainer</Text>
          <Body size={13.5} color={T.ink}>
            A program based on your goal, level, equipment and phase.
          </Body>
          <Text style={styles.trainerLink}>Explore now</Text>
        </View>
        <Sparkles size={28} color={OLIVE} />
      </Pressable>

      <Text style={[styles.section, { marginTop: 20 }]}>Routines</Text>
      <View style={styles.grid}>
        {[...PLACES, { key: "yoga", label: "Yoga & meditation" }].map((p) => {
          const Icon = p.key === "yoga" ? Sparkles : PLACE_ICON[p.key];
          return (
            <Pressable key={p.key} onPress={() => router.push({ pathname: "/workout/place/[key]", params: { key: p.key } })} accessibilityRole="button" accessibilityLabel={p.label} style={styles.place}>
              <Text style={styles.placeText}>{p.label}</Text>
              <Icon size={30} color={OLIVE} strokeWidth={1.4} style={{ alignSelf: "flex-end" }} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

/** Programs and routines for one place, or yoga and meditation. */
export function Place() {
  const { key } = useLocalSearchParams();
  const { ctx } = useApp();
  const phase = ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null;
  const place = PLACES.find((p) => p.key === key);
  const list = key === "yoga" ? [PROGRAM.stretch] : PROGRAMS.filter((p) => p.places.includes(key));
  return (
    <Screen>
      <Header title={key === "yoga" ? "Yoga & meditation" : (place?.label ?? "Routines")} />
      {key === "yoga" && <YogaMeditation phase={phase} />}
      <View style={{ gap: 10 }}>
        {list.map((p) => (
          <ProgramCard key={p.id} p={p} />
        ))}
      </View>
    </Screen>
  );
}

/** One program: what it is for, and its routines to start or keep. */
export function ProgramDetail() {
  const { id } = useLocalSearchParams();
  const { saveRoutine, routines, customExercises } = useApp();
  const { begin, active } = useWorkoutActions();
  const p = PROGRAM[id];
  const [saved, setSaved] = useState(false);
  if (!p) {
    return (
      <Screen>
        <Header title="Program" />
        <Body>This program is no longer here.</Body>
      </Screen>
    );
  }
  const keep = () => {
    for (const r of p.routines) {
      if (!routines.some((x) => x.name === r.name && x.programId === p.id)) saveRoutine({ id: `mine:${newId()}`, name: r.name, programId: p.id, exercises: r.exercises });
    }
    setSaved(true);
  };
  return (
    <Screen>
      <Header title={p.name} />
      <Body size={14} color={T.ink}>
        {p.about}
      </Body>
      <Body size={13} style={{ marginTop: 6 }}>
        {`${cap(p.level)} · ${GOALS.find((g) => g.key === p.goal)?.label} · suits ${p.phases.map(phaseLabel).join(", ").toLowerCase()}`}
      </Body>
      <Pressable onPress={keep} disabled={saved} accessibilityRole="button" accessibilityLabel="Save to my routines" style={[styles.save, saved && { opacity: 0.6 }]}>
        <Text style={styles.saveText}>{saved ? "Saved to my routines" : "Save to my routines"}</Text>
      </Pressable>
      <View style={{ gap: 10, marginTop: 14 }}>
        {p.routines.map((r) => (
          <RoutineCard key={r.name} routine={r} custom={customExercises} onStart={active ? undefined : () => begin({ name: r.name, items: r.exercises })} />
        ))}
      </View>
    </Screen>
  );
}

/** A few questions, then the program that fits best right now. */
export function Trainer() {
  const { ctx } = useApp();
  const phase = ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null;
  const [goal, setGoal] = useState("strength");
  const [level, setLevel] = useState("beginner");
  const [place, setPlace] = useState("gym");

  const score = (p) =>
    // where she trains first, then her goal; level and phase break ties
    (p.places.includes(place) ? 4 : 0) + (p.goal === goal ? 3 : 0) + (p.level === level ? 1 : 0) + (phase && p.phases.includes(phase) ? 1 : 0);
  const best = [...PROGRAMS].sort((a, b) => score(b) - score(a))[0];

  return (
    <Screen>
      <Header title="Trainer" />
      <Text style={styles.section}>Your goal</Text>
      <View style={[s.row, styles.wrap]}>
        {GOALS.map((g) => (
          <Chip key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(g.key)} />
        ))}
      </View>
      <Text style={styles.section}>Your level</Text>
      <View style={[s.row, styles.wrap]}>
        {LEVELS.map((l) => (
          <Chip key={l} label={cap(l)} selected={level === l} onPress={() => setLevel(l)} />
        ))}
      </View>
      <Text style={styles.section}>Where you train</Text>
      <View style={[s.row, styles.wrap]}>
        {PLACES.map((p) => (
          <Chip key={p.key} label={p.label} selected={place === p.key} onPress={() => setPlace(p.key)} />
        ))}
      </View>

      <Card style={{ marginTop: 18, gap: 8 }} testID="trainer-pick">
        <Text style={styles.trainerKicker}>YOUR PROGRAM</Text>
        <Text style={styles.programName}>{best.name}</Text>
        <Body size={13.5} color={T.ink}>
          {best.about}
        </Body>
        {phase && (
          <Body size={13}>
            {best.phases.includes(phase)
              ? `A good fit for your ${phaseLabel(phase).toLowerCase()} phase.`
              : `In your ${phaseLabel(phase).toLowerCase()} phase, go a little lighter and listen to your energy.`}
          </Body>
        )}
        <Pressable onPress={() => router.push({ pathname: "/workout/program/[id]", params: { id: best.id } })} accessibilityRole="button" accessibilityLabel={`Open ${best.name}`} style={[s.row, { gap: 6, minHeight: 44 }]}>
          <Text style={styles.trainerLink}>Open the program</Text>
          <ChevronRight size={16} color={OLIVE} />
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headTitle: { flex: 1, fontFamily: F.serif, fontSize: 22, color: T.ink },
  section: { fontFamily: F.serif, fontSize: 20, color: T.ink, marginBottom: 8, marginTop: 6 },
  program: { borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair, overflow: "hidden" },
  programArt: { width: 110, alignSelf: "stretch", minHeight: 96, backgroundColor: "#E6E1CF", justifyContent: "center", paddingHorizontal: 12 },
  programArtText: { fontFamily: F.serifSemi, fontSize: 15, lineHeight: 18, color: OLIVE },
  programName: { fontFamily: F.serif, fontSize: 17, color: T.ink },
  showAll: { minHeight: 48, borderRadius: 14, backgroundColor: T.canvasDeep, alignItems: "center", justifyContent: "center", marginTop: 10 },
  showAllText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  trainer: { gap: 12, padding: 18, marginTop: 16, borderRadius: 20, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface },
  trainerTitle: { fontFamily: F.serif, fontSize: 22, color: OLIVE },
  trainerLink: { fontFamily: F.sansMed, fontSize: 14.5, color: OLIVE },
  trainerKicker: { fontFamily: F.sansMed, fontSize: 11, letterSpacing: 1.6, color: T.inkSoft },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  place: { width: "48%", minHeight: 96, padding: 14, borderRadius: 18, backgroundColor: T.canvasDeep, justifyContent: "space-between" },
  placeText: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  save: { minHeight: 48, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center", marginTop: 14 },
  saveText: { fontFamily: F.sansMed, fontSize: 15, color: T.canvas },
  wrap: { gap: 8, flexWrap: "wrap", marginBottom: 6 },
});
