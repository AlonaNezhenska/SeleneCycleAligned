import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { BarChart3, Dumbbell, Ruler, CalendarDays, ChevronRight } from "lucide-react-native";
import { weeklyTotals, workoutTotals, minutesOf } from "../lib/workout";
import { OLIVE, dayLabel } from "./food";
import { T, F } from "./theme";
import { Card, Body, Chip, s } from "./kit";

/* ---------------------------------------------------------------
   TRAINING IN PROFILE — time this week, twelve weeks of training by
   duration, volume or reps, the dashboard, and recent workouts.
   --------------------------------------------------------------- */

const CHART = 110;
const METRICS = [
  ["minutes", "Duration", (v) => (v >= 60 ? `${Math.round((v / 60) * 10) / 10} h` : `${v} min`)],
  ["volume", "Volume", (v) => `${v.toLocaleString("en-GB")} kg`],
  ["reps", "Reps", (v) => `${v}`],
];

const tick = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const Tile = ({ icon: Icon, label, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[s.row, styles.tile]}>
    <Icon size={20} color={T.ink} strokeWidth={1.6} />
    <Text style={styles.tileText}>{label}</Text>
  </Pressable>
);

export const TrainingStats = ({ workouts, todayKey }) => {
  const [metric, setMetric] = useState("minutes");
  const weeks = weeklyTotals(workouts, todayKey, 12);
  const [, label, fmt] = METRICS.find((m) => m[0] === metric);
  const top = Math.max(1, ...weeks.map((w) => w[metric]));
  const thisWeek = weeks[weeks.length - 1];
  const hours = Math.round((thisWeek.minutes / 60) * 10) / 10;

  return (
    <View testID="training-stats" style={{ marginBottom: 20 }}>
      <Text style={styles.title} accessibilityRole="header">
        Training
      </Text>
      <Card style={{ gap: 10 }}>
        <Text style={styles.headline}>
          <Text style={{ fontFamily: F.sansSemi }}>{`${hours} hours`}</Text>
          {` this week · ${thisWeek.count} ${thisWeek.count === 1 ? "workout" : "workouts"}`}
        </Text>
        <View style={styles.chart} accessibilityLabel={`${label} over the last 12 weeks`}>
          {weeks.map((w) => (
            <View key={w.week} style={styles.col}>
              <View style={[styles.bar, { height: (w[metric] / top) * CHART }]} />
            </View>
          ))}
        </View>
        <View style={s.row}>
          {weeks.map((w, i) => (
            <Text key={w.week} style={styles.tick}>
              {i % 3 === 0 ? tick(w.week) : ""}
            </Text>
          ))}
        </View>
        <Body size={12.5}>{`Busiest week: ${fmt(Math.max(0, ...weeks.map((w) => w[metric])))}`}</Body>
        <View style={[s.row, { gap: 8 }]}>
          {METRICS.map(([k, l]) => (
            <Chip key={k} label={l} selected={metric === k} onPress={() => setMetric(k)} />
          ))}
        </View>
      </Card>

      <View style={styles.grid}>
        <Tile icon={BarChart3} label="Statistics" onPress={() => router.push("/workout/stats")} />
        <Tile icon={Dumbbell} label="Exercises" onPress={() => router.push("/workout/exercises")} />
        <Tile icon={Ruler} label="Measures" onPress={() => router.push("/measures")} />
        <Tile icon={CalendarDays} label="Calendar" onPress={() => router.push("/workout/calendar")} />
      </View>

      {workouts.slice(0, 5).map((w) => {
        const t = workoutTotals(w);
        return (
          <Pressable
            key={w.id}
            onPress={() => router.push({ pathname: "/workout/history/[id]", params: { id: w.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${w.name}, ${dayLabel(w.date, todayKey)}`}
            style={[s.row, styles.workout]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.workoutName}>{w.name}</Text>
              <Body size={12.5}>{`${dayLabel(w.date, todayKey)} · ${minutesOf(w)} min · ${t.volume.toLocaleString("en-GB")} kg · ${t.sets} sets`}</Body>
            </View>
            <ChevronRight size={18} color={T.inkSoft} />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontFamily: F.serif, fontSize: 22, color: T.ink, marginBottom: 10 },
  headline: { fontFamily: F.sans, fontSize: 16, color: T.ink },
  chart: { height: CHART, flexDirection: "row", alignItems: "flex-end", gap: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  col: { flex: 1, justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: OLIVE },
  tick: { flex: 1, fontFamily: F.sans, fontSize: 10.5, color: T.inkSoft },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10, marginTop: 12, marginBottom: 6 },
  tile: { width: "48.5%", gap: 10, minHeight: 56, paddingHorizontal: 16, backgroundColor: T.canvasDeep },
  tileText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  workout: { gap: 10, minHeight: 60, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  workoutName: { fontFamily: F.serif, fontSize: 16.5, color: T.ink },
});
