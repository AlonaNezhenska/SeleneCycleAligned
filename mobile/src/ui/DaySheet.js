import React from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ChevronRight } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { MEALS, mealEntries, mealTotals, dayTotals } from "../lib/food";
import { activitiesOf, KIND } from "../lib/activity";
import { minutesOf } from "../lib/workout";
import { kcalText, dayLabel, OLIVE } from "./food";
import { T, F } from "./theme";
import { Body, s } from "./kit";

/* ---------------------------------------------------------------
   WHAT YOU DID — one day, or a week of days, opened from a bar on
   Your journey: the food in each meal, the workouts, activities and
   steps. Without figures when numbers are hidden.
   --------------------------------------------------------------- */

const fmt = (n) => Math.round(n).toLocaleString("en-GB");

const Section = ({ title, children }) => (
  <View style={{ marginTop: 14 }}>
    <Text style={styles.section}>{title}</Text>
    {children}
  </View>
);

/** One day: food by meal, then movement. */
export const DayDetail = ({ date, hidden, compact = false, onOpenWorkout }) => {
  const { dayAt, workouts, todayKey } = useApp();
  const day = dayAt(date);
  const meals = MEALS.map((m) => ({ ...m, items: mealEntries(day, m.key), total: mealTotals(day, m.key) })).filter((m) => m.items.length);
  const done = workouts.filter((w) => w.date === date);
  // a finished workout is also kept as an activity; show it once, as the workout
  const activities = activitiesOf(day).filter((a) => !a.workoutId);
  const steps = day.steps ?? 0;
  const nothing = !meals.length && !done.length && !activities.length && !steps;
  return (
    <View testID={`day-${date}`}>
      <Text style={compact ? styles.dayTitleSmall : styles.dayTitle}>{dayLabel(date, todayKey)}</Text>
      {nothing && <Body size={13.5} style={{ marginTop: 6 }}>Nothing logged this day, and that's fine.</Body>}

      {meals.length > 0 && (
        <Section title={hidden ? "Food" : `Food · ${kcalText(dayTotals(day).kcal)}`}>
          {meals.map((m) => (
            <View key={m.key} style={styles.meal}>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={styles.mealName}>{m.label}</Text>
                {!hidden && <Text style={styles.kcal}>{kcalText(m.total.kcal)}</Text>}
              </View>
              <Body size={13}>{m.items.map((e) => e.name).join(", ")}</Body>
            </View>
          ))}
          {day.food?.treat && <Body size={13}>A treat day ✿</Body>}
        </Section>
      )}

      {(done.length > 0 || activities.length > 0 || steps > 0) && (
        <Section title="Movement">
          {done.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => onOpenWorkout?.(w.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${w.name}`}
              style={[s.row, styles.line]}
            >
              <Text style={[styles.lineText, { flex: 1 }]}>{`${w.name} · ${Math.max(1, minutesOf(w))} min · ${w.exercises.length} ${w.exercises.length === 1 ? "exercise" : "exercises"}`}</Text>
              <ChevronRight size={16} color={T.inkSoft} />
            </Pressable>
          ))}
          {activities.map((a) => (
            <View key={a.id} style={styles.line}>
              <Text style={styles.lineText}>{`${a.title || KIND[a.kind]?.label || "Activity"} · ${a.minutes} min`}</Text>
            </View>
          ))}
          {steps > 0 && (
            <View style={styles.line}>
              <Text style={styles.lineText}>{hidden ? "Steps logged" : `${fmt(steps)} steps`}</Text>
            </View>
          )}
        </Section>
      )}
    </View>
  );
};

/** The sheet: a single day, or each day of a week. */
export const DaySheet = ({ dates, hidden, onClose }) => {
  const openWorkout = (id) => {
    onClose();
    router.push({ pathname: "/workout/history/[id]", params: { id } });
  };
  return (
    <Modal visible={!!dates} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.page} testID="day-sheet">
        <View style={[s.row, { justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }]}>
          <Text style={styles.title}>{dates?.length > 1 ? "That week" : "That day"}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <X size={20} color={T.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 22 }}>
          {(dates ?? []).map((d) => (
            <DayDetail key={d} date={d} hidden={hidden} compact={dates.length > 1} onOpenWorkout={openWorkout} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.canvas },
  title: { fontFamily: F.serif, fontSize: 24, color: T.ink },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.hair },
  dayTitle: { fontFamily: F.serif, fontSize: 20, color: T.ink },
  dayTitleSmall: { fontFamily: F.serif, fontSize: 18, color: T.ink, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.hair },
  section: { fontFamily: F.sansMed, fontSize: 11.5, letterSpacing: 1.4, color: T.inkSoft, textTransform: "uppercase", marginBottom: 6 },
  meal: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair, gap: 2 },
  mealName: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  kcal: { fontFamily: F.sans, fontSize: 13, color: OLIVE },
  line: { minHeight: 44, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  lineText: { fontFamily: F.sans, fontSize: 14, color: T.ink },
});
