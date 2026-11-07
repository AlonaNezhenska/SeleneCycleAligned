import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Modal, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronDown, Timer, Plus, Check, Trash2, Flame, Dumbbell, Minus } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { exerciseById, muscleLabel } from "../lib/exercises";
import { blankSet, previousSets, workoutTotals, warmupSets } from "../lib/workout";
import { useWorkoutActions, useNow, clock } from "../ui/workout";
import { BodyThumb } from "../ui/BodyFigure";
import { OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, IconBtn, Chip, s } from "../ui/kit";

/* ---------------------------------------------------------------
   LOG WORKOUT — the workout as it happens.

   Duration, volume and sets at the top. Each exercise lists its sets
   with last time's numbers beside them; ticking a set starts the rest
   timer. Warm-up sets are worked out from the first working weight.
   Everything is saved as she goes, so closing the app loses nothing.
   --------------------------------------------------------------- */

const REST_CHOICES = [30, 60, 90, 120, 180];

const prevText = (p, type) => {
  if (!p) return "–";
  if (type === "duration") return p.seconds ? `${p.seconds}s` : "–";
  if (type === "reps") return p.reps ? `${p.kg ? `${p.kg} kg × ` : ""}${p.reps}` : "–";
  return p.kg || p.reps ? `${p.kg || 0} kg × ${p.reps || 0}` : "–";
};

const Cell = ({ value, onChange, label, done, width = 56 }) => (
  <TextInput
    value={value}
    onChangeText={(v) => onChange(v.replace(/[^\d.,]/g, ""))}
    keyboardType="decimal-pad"
    accessibilityLabel={label}
    selectTextOnFocus
    style={[styles.cell, { width }, done && styles.cellDone]}
  />
);

const ExerciseBlock = ({ entry, index, prev, onChange, onRemove, onDone, custom }) => {
  const ex = exerciseById(entry.id, custom);
  const [menu, setMenu] = useState(false);
  const setAt = (i, patch) => onChange({ ...entry, sets: entry.sets.map((st, k) => (k === i ? { ...st, ...patch } : st)) });
  const working = entry.sets.filter((st) => !st.warmup);
  const firstKg = working.find((st) => st.kg)?.kg ?? prev[0]?.kg;
  const hasWarmups = entry.sets.some((st) => st.warmup);
  let n = 0;
  return (
    <View style={styles.block} testID={`exercise-${index}`}>
      <View style={[s.row, { gap: 12 }]}>
        <BodyThumb primary={ex?.p ?? []} secondary={ex?.s ?? []} size={52} />
        <Pressable
          onPress={() => router.push({ pathname: "/workout/exercise/[id]", params: { id: entry.id } })}
          accessibilityRole="button"
          accessibilityLabel={`About ${ex?.name ?? "exercise"}`}
          style={{ flex: 1 }}
        >
          <Text style={styles.exName}>{ex?.name ?? "Exercise"}</Text>
          <Body size={12}>{(ex?.p ?? []).map(muscleLabel).join(", ")}</Body>
        </Pressable>
        <Pressable onPress={() => setMenu(!menu)} accessibilityRole="button" accessibilityLabel={`Options for ${ex?.name}`} hitSlop={6} style={styles.iconBtn}>
          <Text style={{ fontSize: 18, color: T.ink }}>⋯</Text>
        </Pressable>
      </View>

      {menu && (
        <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
          {entry.type === "weight" && !hasWarmups && (
            <Chip
              label="Add warm-up sets"
              onPress={() => {
                const w = warmupSets(firstKg);
                if (w.length) onChange({ ...entry, sets: [...w, ...entry.sets] });
                setMenu(false);
              }}
            />
          )}
          {REST_CHOICES.map((r) => (
            <Chip key={r} label={`Rest ${clock(r * 1000)}`} selected={entry.rest === r} onPress={() => onChange({ ...entry, rest: r })} />
          ))}
          <Chip label="Remove exercise" onPress={onRemove} />
        </View>
      )}
      {menu && entry.type === "weight" && !hasWarmups && !firstKg && <Body size={12}>Type your first working weight, then add warm-up sets.</Body>}

      <View style={[s.row, styles.headRow]}>
        <Text style={[styles.head, { width: 34 }]}>SET</Text>
        <Text style={[styles.head, { flex: 1 }]}>PREVIOUS</Text>
        {entry.type !== "duration" && <Text style={[styles.head, { width: 56, textAlign: "center" }]}>{entry.type === "weight" ? "KG" : "+KG"}</Text>}
        <Text style={[styles.head, { width: 56, textAlign: "center" }]}>{entry.type === "duration" ? "SEC" : "REPS"}</Text>
        <View style={{ width: 40 }} />
      </View>
      {entry.sets.map((st, i) => {
        const label = st.warmup ? "W" : String((n += 1));
        const p = st.warmup ? null : prev[n - 1];
        return (
          <View key={i} style={[s.row, styles.setRow, st.done && styles.setDone]}>
            <Text style={[styles.setNum, st.warmup && { color: "#C08A2E" }]}>{label}</Text>
            <Text style={styles.prev} numberOfLines={1}>
              {prevText(p, entry.type)}
            </Text>
            {entry.type !== "duration" && (
              <Cell value={st.kg} onChange={(kg) => setAt(i, { kg })} label={`Set ${label} kilograms`} done={st.done} />
            )}
            {entry.type === "duration" ? (
              <Cell value={st.seconds} onChange={(seconds) => setAt(i, { seconds })} label={`Set ${label} seconds`} done={st.done} />
            ) : (
              <Cell value={st.reps} onChange={(reps) => setAt(i, { reps })} label={`Set ${label} reps`} done={st.done} />
            )}
            <Pressable
              onPress={() => {
                // an empty set takes last time's numbers when ticked
                const fill = !st.done && p ? { kg: st.kg || p.kg || "", reps: st.reps || p.reps || "", seconds: st.seconds || p.seconds || "" } : {};
                setAt(i, { ...fill, done: !st.done });
                if (!st.done) onDone(entry.rest);
              }}
              accessibilityRole="checkbox"
              accessibilityLabel={`Set ${label} done`}
              accessibilityState={{ checked: st.done }}
              style={[styles.tick, st.done && styles.tickOn]}
            >
              <Check size={16} color={st.done ? T.canvas : T.inkSoft} strokeWidth={2.4} />
            </Pressable>
          </View>
        );
      })}
      <View style={[s.row, { gap: 8 }]}>
        <Pressable
          onPress={() => {
            const last = entry.sets[entry.sets.length - 1];
            onChange({ ...entry, sets: [...entry.sets, { ...blankSet(), kg: last?.kg ?? "", reps: last?.reps ?? "", seconds: last?.seconds ?? "" }] });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add a set to ${ex?.name}`}
          style={[styles.addSet, { flex: 1 }]}
        >
          <Plus size={15} color={T.ink} />
          <Text style={styles.addSetText}>Add set</Text>
        </Pressable>
        {entry.sets.length > 1 && (
          <Pressable
            onPress={() => onChange({ ...entry, sets: entry.sets.slice(0, -1) })}
            accessibilityRole="button"
            accessibilityLabel={`Remove last set of ${ex?.name}`}
            style={[styles.addSet, { width: 52 }]}
          >
            <Minus size={15} color={T.ink} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

/** The rest countdown, along the bottom of the screen. */
const RestBar = ({ rest, onChange, onSkip }) => {
  const now = useNow(!!rest);
  if (!rest) return null;
  const left = rest.until - now;
  if (left <= 0) {
    return (
      <View style={[s.row, styles.rest, { backgroundColor: T.ink }]} testID="rest-bar">
        <Text style={[styles.restText, { flex: 1 }]}>Rest done. Next set when you're ready.</Text>
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Close rest timer" style={styles.restBtn}>
          <Text style={styles.restBtnText}>OK</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={[s.row, styles.rest]} testID="rest-bar">
      <Timer size={18} color={T.canvas} />
      <Text style={[styles.restText, { flex: 1 }]} accessibilityLiveRegion="polite">{`Rest ${clock(left)}`}</Text>
      <Pressable onPress={() => onChange(-15)} accessibilityRole="button" accessibilityLabel="15 seconds less" style={styles.restBtn}>
        <Text style={styles.restBtnText}>−15</Text>
      </Pressable>
      <Pressable onPress={() => onChange(15)} accessibilityRole="button" accessibilityLabel="15 seconds more" style={styles.restBtn}>
        <Text style={styles.restBtnText}>+15</Text>
      </Pressable>
      <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip rest" style={styles.restBtn}>
        <Text style={styles.restBtnText}>Skip</Text>
      </Pressable>
    </View>
  );
};

export function WorkoutLog() {
  const { activeWorkout: w, updateWorkout, workouts, customExercises } = useApp();
  const { finish, discard } = useWorkoutActions();
  const now = useNow(!!w);
  const [rest, setRest] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [note, setNote] = useState("");
  const leaving = useRef(false);
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

  // nothing to log (finished elsewhere): go back
  useEffect(() => {
    if (!w && !leaving.current) close();
  }, [w]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!w) return <Screen />;
  const totals = workoutTotals(w);
  const muscles = [...new Set(w.exercises.flatMap((e) => exerciseById(e.id, customExercises)?.p ?? []))];
  const setEntry = (i, entry) => updateWorkout((cur) => ({ ...cur, exercises: cur.exercises.map((e, k) => (k === i ? entry : e)) }));

  return (
    <Screen
      footer={<RestBar rest={rest} onChange={(d) => setRest((r) => ({ ...r, until: r.until + d * 1000 }))} onSkip={() => setRest(null)} />}
    >
      <View style={[s.row, { gap: 10 }]}>
        <IconBtn label="Minimise workout" onPress={close}>
          <ChevronDown size={20} color={T.ink} />
        </IconBtn>
        <TextInput
          value={w.name}
          onChangeText={(name) => updateWorkout((cur) => ({ ...cur, name }))}
          accessibilityLabel="Workout name"
          style={styles.title}
        />
        <Pressable onPress={() => setConfirm("finish")} accessibilityRole="button" accessibilityLabel="Finish" style={styles.finish}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      <View style={[s.row, styles.stats]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={[styles.statValue, { color: OLIVE }]} testID="workout-duration">
            {clock(now - w.startedAt)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue} testID="workout-volume">{`${totals.volume.toLocaleString("en-GB")} kg`}</Text>
        </View>
        <View style={{ flex: 0.7 }}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue} testID="workout-sets">
            {totals.sets}
          </Text>
        </View>
        <BodyThumb primary={muscles} size={52} />
      </View>

      {!w.exercises.length && (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 6 }}>
          <Dumbbell size={34} color={T.inkSoft} strokeWidth={1.4} />
          <Text style={styles.emptyTitle}>Get started</Text>
          <Body size={13.5}>Add an exercise to start your workout</Body>
        </View>
      )}

      <View style={{ gap: 14 }}>
        {w.exercises.map((e, i) => (
          <ExerciseBlock
            key={`${e.id}-${i}`}
            entry={e}
            index={i}
            custom={customExercises}
            prev={previousSets(workouts, e.id)}
            onChange={(entry) => setEntry(i, entry)}
            onRemove={() => updateWorkout((cur) => ({ ...cur, exercises: cur.exercises.filter((_, k) => k !== i) }))}
            onDone={(sec) => setRest({ until: Date.now() + (sec ?? 90) * 1000 })}
          />
        ))}
      </View>

      <Pressable
        onPress={() => router.push({ pathname: "/workout/exercises", params: { for: "workout" } })}
        accessibilityRole="button"
        accessibilityLabel="Add exercise"
        style={[styles.addEx, { marginTop: 18 }]}
      >
        <Plus size={18} color={T.canvas} />
        <Text style={styles.addExText}>Add exercise</Text>
      </Pressable>
      <View style={[s.row, { gap: 10, marginTop: 10 }]}>
        <Pressable onPress={() => setConfirm("discard")} accessibilityRole="button" accessibilityLabel="Discard workout" style={[styles.ghost, { flex: 1 }]}>
          <Trash2 size={15} color={T.terracotta} />
          <Text style={[styles.ghostText, { color: T.terracotta }]}>Discard workout</Text>
        </Pressable>
      </View>

      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            {confirm === "finish" ? (
              <>
                <Text style={styles.dialogTitle}>Finish this workout?</Text>
                <Body size={13.5}>
                  {totals.sets ? `${totals.sets} sets done. Unticked sets are left out.` : "No sets are ticked yet. It will still count as time moved."}
                </Body>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="How did it feel? (optional)"
                  placeholderTextColor={T.inkSoft}
                  accessibilityLabel="Workout note"
                  multiline
                  style={styles.note}
                />
                <Pressable
                  onPress={() => {
                    leaving.current = true;
                    setConfirm(null);
                    finish(note.trim());
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Save workout"
                  style={styles.addEx}
                >
                  <Flame size={16} color={T.canvas} />
                  <Text style={styles.addExText}>Save workout</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.dialogTitle}>Discard this workout?</Text>
                <Body size={13.5}>Nothing from it will be kept.</Body>
                <Pressable
                  onPress={() => {
                    leaving.current = true;
                    setConfirm(null);
                    discard();
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Yes, discard"
                  style={[styles.addEx, { backgroundColor: T.terracotta }]}
                >
                  <Text style={styles.addExText}>Yes, discard</Text>
                </Pressable>
              </>
            )}
            <Pressable onPress={() => setConfirm(null)} accessibilityRole="button" accessibilityLabel="Keep going" style={styles.ghost}>
              <Text style={styles.ghostText}>Keep going</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { flex: 1, fontFamily: F.serif, fontSize: 20, color: T.ink, paddingVertical: 6 },
  finish: { minHeight: 42, paddingHorizontal: 18, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  finishText: { fontFamily: F.sansSemi, fontSize: 14.5, color: T.canvas },
  stats: { gap: 8, paddingVertical: 14, marginVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: T.hair },
  statLabel: { fontFamily: F.sans, fontSize: 12, color: T.inkSoft },
  statValue: { fontFamily: F.sansMed, fontSize: 18, color: T.ink, marginTop: 2 },
  emptyTitle: { fontFamily: F.serif, fontSize: 20, color: T.ink },
  block: { gap: 8, padding: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  exName: { fontFamily: F.sansMed, fontSize: 15.5, color: OLIVE },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headRow: { gap: 6, marginTop: 4 },
  head: { fontFamily: F.sansMed, fontSize: 11, letterSpacing: 0.8, color: T.inkSoft },
  setRow: { gap: 6, minHeight: 44, paddingHorizontal: 2 },
  setDone: { backgroundColor: "rgba(91,107,74,0.12)" },
  setNum: { width: 34, fontFamily: F.sansSemi, fontSize: 14, color: T.ink, textAlign: "center" },
  prev: { flex: 1, fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft },
  cell: { minHeight: 38, backgroundColor: T.canvasDeep, textAlign: "center", fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  cellDone: { backgroundColor: "transparent" },
  tick: { width: 40, height: 38, backgroundColor: T.canvasDeep, alignItems: "center", justifyContent: "center" },
  tickOn: { backgroundColor: OLIVE },
  addSet: { flexDirection: "row", gap: 6, minHeight: 42, backgroundColor: T.canvasDeep, alignItems: "center", justifyContent: "center" },
  addSetText: { fontFamily: F.sansMed, fontSize: 13.5, color: T.ink },
  addEx: { flexDirection: "row", gap: 8, minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  addExText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  ghost: { flexDirection: "row", gap: 8, minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  ghostText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  rest: { gap: 10, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: OLIVE },
  restText: { fontFamily: F.sansSemi, fontSize: 16, color: T.canvas, fontVariant: ["tabular-nums"] },
  restBtn: { minHeight: 38, minWidth: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: T.canvas, alignItems: "center", justifyContent: "center" },
  restBtnText: { fontFamily: F.sansMed, fontSize: 13, color: T.canvas },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.4)", justifyContent: "center", padding: 24 },
  dialog: { gap: 12, padding: 20, backgroundColor: T.canvas },
  dialogTitle: { fontFamily: F.serif, fontSize: 21, color: T.ink },
  note: { minHeight: 70, borderWidth: 1, borderColor: T.hair, padding: 12, fontFamily: F.sans, fontSize: 14.5, color: T.ink, textAlignVertical: "top" },
});
