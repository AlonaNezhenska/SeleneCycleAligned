import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Play, Dumbbell } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { exerciseById, muscleLabel } from "../lib/exercises";
import { entryFrom } from "../lib/workout";
import { PROGRAM } from "../content/programs";
import { OLIVE } from "./food";
import { T, F } from "./theme";
import { Body, s } from "./kit";

/* ---------------------------------------------------------------
   WORKOUT PIECES — starting and finishing a workout, the banner for
   one in progress, and routine cards. Starting also starts the
   training session the engine watches (Bailout, protein window).
   --------------------------------------------------------------- */

export const clock = (ms) => {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` : `${m}:${String(sec % 60).padStart(2, "0")}`;
};

/** Re-render once a second while something is timing. */
export const useNow = (active = true) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
};

export const useWorkoutActions = () => {
  const { activeWorkout, startWorkout, finishWorkout, discardWorkout, setSession, markDone, customExercises, showMoments, todayKey } = useApp();
  /** Start a workout (or return to the one already going) and open the log. */
  const begin = ({ name = "Workout", routineId = null, items = [], replace = false } = {}) => {
    if (!activeWorkout) {
      startWorkout({ name, routineId, exercises: items.map((i) => entryFrom(i, customExercises)) });
      setSession({ startedAt: Date.now(), endedAt: null, bailoutOffered: false, bailoutVisible: false });
    }
    router[replace ? "replace" : "push"]("/workout/log");
  };
  /** Keep the workout, open the protein window and earn today's check. */
  const finish = (note = "", kind) => {
    setSession({ endedAt: Date.now(), bailoutVisible: false });
    finishWorkout(note);
    markDone(kind);
    if (kind !== "rest") showMoments(["strength"], todayKey);
  };
  const discard = () => {
    setSession({ startedAt: null, endedAt: null, bailoutOffered: false, bailoutVisible: false });
    discardWorkout();
  };
  return { begin, finish, discard, active: activeWorkout };
};

/** A routine for today, chosen from the energy and the phase. */
export const suggestedRoutine = ({ kind, mode, phase }) => {
  if (kind === "rest") return { program: PROGRAM.stretch, routine: PROGRAM.stretch.routines[0] };
  if (phase === "menstruation" || mode === "Inward") return { program: PROGRAM["home-bodyweight"], routine: PROGRAM["home-bodyweight"].routines[0] };
  if (phase === "luteal") return { program: PROGRAM["gym-full-body"], routine: PROGRAM["gym-full-body"].routines[0] };
  if (mode === "Outward") return { program: PROGRAM["gym-glutes"], routine: PROGRAM["gym-glutes"].routines[0] };
  return { program: PROGRAM["gym-full-body"], routine: PROGRAM["gym-full-body"].routines[1] };
};

/** The workout that is going, with its clock and a way back in. */
export const ActiveBanner = ({ onFinish }) => {
  const { active } = useWorkoutActions();
  const now = useNow(!!active);
  if (!active) return null;
  return (
    <View style={[s.row, styles.banner]} testID="active-workout">
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>{active.name}</Text>
        <Text style={styles.bannerClock} accessibilityLabel={`In progress, ${clock(now - active.startedAt)}`}>{`In progress · ${clock(now - active.startedAt)}`}</Text>
      </View>
      <Pressable onPress={() => router.push("/workout/log")} accessibilityRole="button" accessibilityLabel="Resume workout" style={styles.bannerBtn}>
        <Text style={styles.bannerBtnText}>Resume</Text>
      </Pressable>
      <Pressable onPress={onFinish} accessibilityRole="button" accessibilityLabel="Finish workout" style={[styles.bannerBtn, { backgroundColor: T.canvas }]}>
        <Text style={[styles.bannerBtnText, { color: OLIVE }]}>Finish</Text>
      </Pressable>
    </View>
  );
};

/** A routine with its exercises and a start button. */
export const RoutineCard = ({ routine, onStart, onEdit, custom = [] }) => {
  const names = routine.exercises.map((e) => exerciseById(e.id, custom)?.name).filter(Boolean);
  const muscles = [...new Set(routine.exercises.flatMap((e) => exerciseById(e.id, custom)?.p ?? []))].slice(0, 4).map(muscleLabel);
  return (
    <View style={styles.card}>
      <Pressable onPress={onEdit} disabled={!onEdit} accessibilityRole="button" accessibilityLabel={onEdit ? `Edit ${routine.name}` : routine.name} style={{ gap: 4 }}>
        <View style={[s.row, { gap: 8 }]}>
          <Dumbbell size={16} color={OLIVE} />
          <Text style={styles.cardTitle}>{routine.name}</Text>
        </View>
        <Body size={12.5} numberOfLines={2}>
          {names.join(", ")}
        </Body>
        {!!muscles.length && <Body size={12}>{muscles.join(" · ")}</Body>}
      </Pressable>
      {onStart && (
        <Pressable onPress={onStart} accessibilityRole="button" accessibilityLabel={`Start ${routine.name}`} style={styles.start}>
          <Play size={15} color={T.canvas} />
          <Text style={styles.startText}>Start routine</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: { gap: 8, padding: 14, backgroundColor: OLIVE, marginBottom: 14 },
  bannerTitle: { fontFamily: F.serif, fontSize: 17, color: T.canvas },
  bannerClock: { fontFamily: F.sans, fontSize: 12.5, color: T.canvas, opacity: 0.9, marginTop: 2 },
  bannerBtn: { minHeight: 40, paddingHorizontal: 14, borderWidth: 1, borderColor: T.canvas, alignItems: "center", justifyContent: "center" },
  bannerBtnText: { fontFamily: F.sansMed, fontSize: 13, color: T.canvas },
  card: { gap: 12, padding: 16, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  cardTitle: { fontFamily: F.serif, fontSize: 17, color: T.ink },
  start: { flexDirection: "row", gap: 8, minHeight: 44, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  startText: { fontFamily: F.sansMed, fontSize: 14, color: T.canvas },
});
