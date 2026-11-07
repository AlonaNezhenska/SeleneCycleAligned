import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Minus, Trash2, ArrowUp } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { exerciseById, muscleLabel } from "../lib/exercises";
import { entryType } from "../lib/workout";
import { newId } from "../lib/food";
import { onPick } from "../state/pickBus";
import { BodyThumb } from "../ui/BodyFigure";
import { OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ROUTINE — a workout she plans once and starts any day: exercises
   in order, each with its sets, target reps (or seconds) and rest.
   --------------------------------------------------------------- */

const Stepper = ({ label, value, onChange, step = 1, min = 1, suffix = "" }) => (
  <View style={{ alignItems: "center", gap: 2 }}>
    <Text style={styles.stepLabel}>{label}</Text>
    <View style={[s.row, { gap: 4 }]}>
      <Pressable onPress={() => onChange(Math.max(min, value - step))} accessibilityRole="button" accessibilityLabel={`Less ${label.toLowerCase()}`} style={styles.stepBtn}>
        <Minus size={13} color={T.ink} />
      </Pressable>
      <Text style={styles.stepValue}>{`${value}${suffix}`}</Text>
      <Pressable onPress={() => onChange(value + step)} accessibilityRole="button" accessibilityLabel={`More ${label.toLowerCase()}`} style={styles.stepBtn}>
        <Plus size={13} color={T.ink} />
      </Pressable>
    </View>
  </View>
);

export function RoutineEditor() {
  const { id } = useLocalSearchParams();
  const { routines, saveRoutine, removeRoutine, customExercises } = useApp();
  const existing = routines.find((r) => r.id === id);
  const [name, setName] = useState(existing?.name ?? "");
  const [items, setItems] = useState(existing?.exercises ?? []);
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

  // exercises chosen on the picker arrive here
  useEffect(
    () =>
      onPick((ids) =>
        setItems((cur) => [
          ...cur,
          ...ids.map((exId) => {
            const ex = exerciseById(exId, customExercises);
            return ex?.type === "duration" ? { id: exId, sets: 3, seconds: 30, rest: 60 } : { id: exId, sets: 3, reps: 10, rest: 90 };
          }),
        ])
      ),
    [customExercises]
  );

  const set = (i, patch) => setItems((cur) => cur.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const valid = name.trim() && items.length > 0;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              saveRoutine({ ...(existing ?? {}), id: existing?.id ?? `mine:${newId()}`, name: name.trim(), exercises: items });
              back();
            }}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityLabel="Save routine"
            accessibilityState={{ disabled: !valid }}
            style={[styles.primary, !valid && { opacity: 0.45 }]}
          >
            <Text style={styles.primaryText}>Save routine</Text>
          </Pressable>
        </View>
      }
    >
      <View style={[s.row, { gap: 12, marginBottom: 14 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Text style={styles.headTitle} accessibilityRole="header">
          {existing ? "Edit routine" : "New routine"}
        </Text>
      </View>

      <TextInput value={name} onChangeText={setName} placeholder="Routine name, e.g. Legs & glutes" placeholderTextColor={T.inkSoft} accessibilityLabel="Routine name" style={styles.input} />

      <View style={{ gap: 10, marginTop: 14 }} testID="routine-items">
        {items.map((it, i) => {
          const ex = exerciseById(it.id, customExercises);
          const timed = entryType(ex, it) === "duration";
          return (
            <View key={`${it.id}-${i}`} style={styles.item}>
              <View style={[s.row, { gap: 10 }]}>
                <BodyThumb primary={ex?.p ?? []} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{ex?.name ?? it.id}</Text>
                  <Body size={12}>{(ex?.p ?? []).map(muscleLabel).join(", ")}</Body>
                </View>
                {i > 0 && (
                  <Pressable
                    onPress={() => setItems((cur) => cur.map((x, k) => (k === i - 1 ? cur[i] : k === i ? cur[i - 1] : x)))}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${ex?.name} up`}
                    hitSlop={6}
                    style={styles.icon}
                  >
                    <ArrowUp size={16} color={T.inkSoft} />
                  </Pressable>
                )}
                <Pressable onPress={() => setItems((cur) => cur.filter((_, k) => k !== i))} accessibilityRole="button" accessibilityLabel={`Remove ${ex?.name}`} hitSlop={6} style={styles.icon}>
                  <Trash2 size={16} color={T.inkSoft} />
                </Pressable>
              </View>
              <View style={[s.row, { justifyContent: "space-around" }]}>
                <Stepper label="Sets" value={it.sets} onChange={(v) => set(i, { sets: v })} />
                {timed ? (
                  <Stepper label="Seconds" value={it.seconds ?? 30} step={5} min={5} onChange={(v) => set(i, { seconds: v, reps: undefined })} />
                ) : (
                  <Stepper label="Reps" value={it.reps ?? 10} onChange={(v) => set(i, { reps: v })} />
                )}
                <Stepper label="Rest" value={it.rest ?? 90} step={15} min={15} suffix="s" onChange={(v) => set(i, { rest: v })} />
              </View>
            </View>
          );
        })}
      </View>

      <Pressable onPress={() => router.push({ pathname: "/workout/exercises", params: { for: "routine" } })} accessibilityRole="button" accessibilityLabel="Add exercises" style={[styles.add, { marginTop: 14 }]}>
        <Plus size={16} color={T.ink} />
        <Text style={styles.addText}>Add exercises</Text>
      </Pressable>

      {existing && (
        <Pressable
          onPress={() => {
            removeRoutine(existing.id);
            back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete routine"
          style={[s.row, { gap: 6, minHeight: 44, marginTop: 14 }]}
        >
          <Trash2 size={14} color={T.terracotta} />
          <Body size={13} color={T.terracotta}>
            Delete routine
          </Body>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headTitle: { flex: 1, fontFamily: F.serif, fontSize: 22, color: T.ink },
  input: { minHeight: 50, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 16, color: T.ink },
  item: { gap: 12, padding: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  itemName: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  icon: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontFamily: F.sans, fontSize: 11.5, color: T.inkSoft },
  stepBtn: { width: 34, height: 34, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 40, textAlign: "center", fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  add: { flexDirection: "row", gap: 8, minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  addText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, backgroundColor: T.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.hair },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
});
