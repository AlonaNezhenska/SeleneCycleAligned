import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { journeyDays, journeyWeeks, totals } from "../lib/journey";
import { SoftPhoto } from "../screens/Photos";
import { OLIVE, dayLabel } from "./food";
import { T, F } from "./theme";
import { Card, Body, s } from "./kit";

/* ---------------------------------------------------------------
   YOUR JOURNEY — food, movement, steps and photos over the last week
   or month. With Hide numbers on, the charts keep their shape and the
   figures go: no calories, no grams, no step counts.
   --------------------------------------------------------------- */

const COLORS = { exercise: OLIVE, yoga: "#A9B98C", meditation: "#9C93C4" };
const LEGEND = [
  ["exercise", "Exercise"],
  ["yoga", "Yoga"],
  ["meditation", "Meditation"],
];
const CHART = 96;
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

const tick = (iso, weekly) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return weekly ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : date.toLocaleDateString("en-GB", { weekday: "narrow" });
};

/** Food eaten per day (or weekly average) against the goal line. */
const FoodChart = ({ rows, goal, weekly }) => {
  const top = goal * 1.25;
  return (
    <View>
      <View style={styles.chart}>
        <View style={[styles.goalLine, { bottom: (goal / top) * CHART }]} />
        {rows.map((r) => (
          <View key={r.date} style={styles.col}>
            <View style={[styles.bar, { height: Math.max(r.logged ? 4 : 0, Math.min(1, r.eaten / top) * CHART), backgroundColor: "#D9A86C" }]} />
          </View>
        ))}
      </View>
      <View style={s.row}>
        {rows.map((r) => (
          <Text key={r.date} style={styles.tick}>
            {tick(r.date, weekly)}
          </Text>
        ))}
      </View>
    </View>
  );
};

/** Minutes of exercise, yoga and meditation, stacked. */
const MoveChart = ({ rows, weekly }) => {
  const top = Math.max(weekly ? 180 : 60, ...rows.map((r) => r.exercise + r.yoga + r.meditation));
  return (
    <View>
      <View style={styles.chart}>
        {rows.map((r) => (
          <View key={r.date} style={styles.col}>
            {["meditation", "yoga", "exercise"].map((k) =>
              r[k] > 0 ? <View key={k} style={[styles.bar, { height: (r[k] / top) * CHART, backgroundColor: COLORS[k] }]} /> : null
            )}
          </View>
        ))}
      </View>
      <View style={s.row}>
        {rows.map((r) => (
          <Text key={r.date} style={styles.tick}>
            {tick(r.date, weekly)}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const Journey = ({ days, todayKey, goalKcal, kg, hidden, photos, baselinePhoto, profile = {} }) => {
  const [range, setRange] = useState("week");
  const weekly = range === "month";
  const rows = weekly ? journeyWeeks(days, todayKey, 4, kg) : journeyDays(days, todayKey, 7, kg);
  const t = totals(weekly ? journeyDays(days, todayKey, 28, kg) : rows);
  const loggedFood = rows.filter((r) => r.logged);
  const avgEaten = loggedFood.length ? Math.round(loggedFood.reduce((a, r) => a + r.eaten, 0) / loggedFood.length) : 0;
  const strip = [...photos.map((p) => ({ uri: p.uri, label: dayLabel(p.date, todayKey), id: p.id })), ...(baselinePhoto ? [{ uri: baselinePhoto, label: "Where you started", id: "baseline" }] : [])];

  return (
    <View testID="journey">
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 10 }]}>
        <Text style={styles.title} accessibilityRole="header">
          Your journey
        </Text>
        <View style={styles.switch} accessibilityRole="tablist">
          {[
            ["week", "7 days"],
            ["month", "4 weeks"],
          ].map(([k, label]) => (
            <Pressable
              key={k}
              onPress={() => setRange(k)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: range === k }}
              style={[styles.switchItem, range === k && styles.switchOn]}
            >
              <Text style={{ fontFamily: F.sansMed, fontSize: 12, color: range === k ? T.canvas : T.ink }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>


      <Card style={{ marginBottom: 12, gap: 8 }} testID="journey-food">
        <Text style={styles.cardTitle}>Food</Text>
        <FoodChart rows={rows} goal={goalKcal} weekly={weekly} />
        <Body size={12.5} testID="journey-food-text">
          {!loggedFood.length
            ? "Nothing logged yet in this time."
            : hidden
              ? `Logged on ${loggedFood.length} ${weekly ? "weeks" : "days"}. The line is your goal.`
              : `About ${fmt(avgEaten)} kcal a day when logged · goal ${fmt(goalKcal)}`}
        </Body>
      </Card>

      <Card style={{ marginBottom: 12, gap: 8 }} testID="journey-move">
        <Text style={styles.cardTitle}>Movement & calm</Text>
        <MoveChart rows={rows} weekly={weekly} />
        <View style={[s.row, { gap: 12, flexWrap: "wrap" }]}>
          {LEGEND.map(([k, label]) => (
            <View key={k} style={[s.row, { gap: 5 }]}>
              <View style={[styles.swatch, { backgroundColor: COLORS[k] }]} />
              <Body size={12}>{`${label} ${t[k]} min`}</Body>
            </View>
          ))}
        </View>
        {!hidden && <Body size={12.5} testID="journey-burned">{`About ${fmt(t.burned)} kcal burned · ${fmt(t.steps)} steps a day on average`}</Body>}
      </Card>

      <Card style={{ marginBottom: 12, gap: 8 }} testID="journey-photos">
        <Pressable onPress={() => router.push("/photos")} accessibilityRole="button" accessibilityLabel="Open progress photos" style={[s.row, { justifyContent: "space-between", minHeight: 40 }]}>
          <Text style={styles.cardTitle}>Your body, over time</Text>
          <ChevronRight size={18} color={T.inkSoft} />
        </Pressable>
        {strip.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {strip.map((p) => (
              <View key={p.id} style={{ width: 104 }}>
                <SoftPhoto uri={p.uri} height={130} label={`Progress photo, ${p.label}`} />
                <Text style={styles.photoDate}>{p.label}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Body size={12.5}>Add a progress photo to see your body over time. Only on this phone.</Body>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontFamily: F.serif, fontSize: 22, color: T.ink },
  cardTitle: { fontFamily: F.serif, fontSize: 17, color: T.ink },
  switch: { flexDirection: "row", padding: 3, backgroundColor: T.canvasDeep },
  switchItem: { minHeight: 34, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: T.ink },
  chart: { height: CHART, flexDirection: "row", alignItems: "flex-end", gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  col: { flex: 1, justifyContent: "flex-end", gap: 1 },
  bar: { width: "100%" },
  goalLine: { position: "absolute", left: 0, right: 0, height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: T.inkSoft },
  tick: { flex: 1, textAlign: "center", fontFamily: F.sans, fontSize: 11, color: T.inkSoft, marginTop: 4 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  photoDate: { fontFamily: F.sans, fontSize: 11.5, color: T.inkSoft, marginTop: 4, textAlign: "center" },
});
