import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Polyline, Circle, Line } from "react-native-svg";
import { ArrowLeft, Award } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { exerciseById, muscleLabel, equipmentLabel } from "../lib/exercises";
import { exerciseHistory, personalRecords } from "../lib/workout";
import { BodyFigure } from "../ui/BodyFigure";
import { OLIVE, dayLabel } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Card, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   AN EXERCISE — Summary (the figure, muscles, progress and records),
   History (every time it was done) and How to (the steps).
   --------------------------------------------------------------- */

const METRICS = {
  weight: [
    ["heaviest", "Heaviest weight", (v) => `${v} kg`],
    ["oneRm", "One rep max", (v) => `${v} kg`],
    ["reps", "Most reps", (v) => `${v} reps`],
  ],
  reps: [["reps", "Most reps", (v) => `${v} reps`]],
  duration: [["seconds", "Longest", (v) => `${v} s`]],
};

/** A small line chart of one number over time. */
const LineChart = ({ points, format }) => {
  const W = 320;
  const H = 140;
  const P = 14;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const xy = points.map((p, i) => [P + (i / Math.max(1, points.length - 1)) * (W - P * 2), H - P - ((p.value - min) / span) * (H - P * 2)]);
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke={T.hair} strokeWidth={1} />
        <Polyline points={xy.map((q) => q.join(",")).join(" ")} fill="none" stroke={OLIVE} strokeWidth={2.5} />
        {xy.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={4} fill={OLIVE} />
        ))}
      </Svg>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Body size={11.5}>{points[0]?.label}</Body>
        <Body size={11.5}>{`${format(min)} – ${format(max)}`}</Body>
        <Body size={11.5}>{points[points.length - 1]?.label}</Body>
      </View>
    </View>
  );
};

export function ExerciseDetail() {
  const { id } = useLocalSearchParams();
  const { workouts, customExercises, todayKey } = useApp();
  const ex = exerciseById(id, customExercises);
  const [tab, setTab] = useState("summary");
  const type = ex?.type ?? "weight";
  const metrics = METRICS[type] ?? METRICS.weight;
  const [metric, setMetric] = useState(metrics[0][0]);
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

  if (!ex) {
    return (
      <Screen>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Body style={{ marginTop: 20 }}>This exercise is no longer here.</Body>
      </Screen>
    );
  }
  const history = exerciseHistory(workouts, ex.id);
  const prs = personalRecords(workouts, ex.id);
  const current = metrics.find((m) => m[0] === metric) ?? metrics[0];
  const points = history.map((h) => ({ value: h[current[0]], label: dayLabel(h.date, todayKey) })).filter((p) => p.value > 0);

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Text style={styles.headTitle} numberOfLines={1}>
          {ex.name}
        </Text>
      </View>

      <View style={[s.row, styles.tabs]} accessibilityRole="tablist">
        {[
          ["summary", "Summary"],
          ["history", "History"],
          ["how", "How to"],
        ].map(([k, label]) => (
          <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: tab === k }} style={[styles.tab, tab === k && styles.tabOn]}>
            <Text style={[styles.tabText, tab === k && { color: OLIVE }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "summary" && (
        <>
          <Card style={{ alignItems: "center", marginTop: 14, paddingVertical: 18 }}>
            <BodyFigure primary={ex.p} secondary={ex.s} height={230} />
          </Card>
          <Text style={styles.name}>{ex.name}</Text>
          <Body size={13.5}>{`Primary: ${ex.p.map(muscleLabel).join(", ") || "Whole body"}`}</Body>
          {!!ex.s?.length && <Body size={13}>{`Also works: ${ex.s.map(muscleLabel).join(", ")}`}</Body>}
          <Body size={13}>{`Equipment: ${equipmentLabel(ex.eq)}${ex.lvl ? ` · ${ex.lvl[0].toUpperCase()}${ex.lvl.slice(1)}` : ""}`}</Body>

          <Card style={{ marginTop: 16, gap: 10 }} testID="exercise-progress">
            {points.length ? (
              <>
                <Text style={styles.big}>{`${current[2](points[points.length - 1].value)} `}<Text style={styles.bigDate}>{points[points.length - 1].label}</Text></Text>
                {points.length > 1 ? <LineChart points={points} format={current[2]} /> : <Body size={12.5}>Do it once more to see a line.</Body>}
                <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
                  {metrics.map(([k, label]) => (
                    <Chip key={k} label={label} selected={metric === k} onPress={() => setMetric(k)} />
                  ))}
                </View>
              </>
            ) : (
              <Body size={13.5}>Your progress will show here after you log this exercise.</Body>
            )}
          </Card>

          {prs && (
            <Card style={{ marginTop: 12, gap: 6 }} testID="personal-records">
              <View style={[s.row, { gap: 8 }]}>
                <Award size={18} color="#C08A2E" />
                <Text style={styles.cardTitle}>Personal records</Text>
              </View>
              {type === "weight" && <Body size={13.5} color={T.ink}>{`Heaviest weight: ${prs.heaviest} kg`}</Body>}
              {type === "weight" && <Body size={13.5} color={T.ink}>{`Best one rep max (estimated): ${prs.oneRm} kg`}</Body>}
              {type !== "duration" && <Body size={13.5} color={T.ink}>{`Most reps in a set: ${prs.reps}`}</Body>}
              {type === "duration" && <Body size={13.5} color={T.ink}>{`Longest: ${prs.seconds} s`}</Body>}
            </Card>
          )}
        </>
      )}

      {tab === "history" && (
        <View style={{ marginTop: 14, gap: 10 }}>
          {history.length ? (
            [...history].reverse().map((h, i) => (
              <Card key={i} style={{ gap: 4 }}>
                <Text style={styles.cardTitle}>{dayLabel(h.date, todayKey)}</Text>
                {h.sets.map((st, k) => (
                  <Body key={k} size={13.5} color={T.ink}>
                    {type === "duration" ? `Set ${k + 1}: ${st.seconds} s` : `Set ${k + 1}: ${st.kg ? `${st.kg} kg × ` : ""}${st.reps} reps`}
                  </Body>
                ))}
              </Card>
            ))
          ) : (
            <Body>No sessions yet.</Body>
          )}
        </View>
      )}

      {tab === "how" && (
        <View style={{ marginTop: 14, gap: 10 }}>
          {ex.how?.length ? (
            ex.how.map((step, i) => (
              <View key={i} style={[s.row, { alignItems: "flex-start", gap: 10 }]}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Body size={14} color={T.ink} style={{ flex: 1 }}>
                  {step}
                </Body>
              </View>
            ))
          ) : (
            <Body>No steps written for this exercise.</Body>
          )}
          <Body size={11.5} style={{ marginTop: 10 }}>
            Exercise steps from free-exercise-db, an open, public-domain library.
          </Body>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headTitle: { flex: 1, fontFamily: F.serif, fontSize: 19, color: T.ink },
  tabs: { marginTop: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: OLIVE },
  tabText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.inkSoft },
  name: { fontFamily: F.serif, fontSize: 24, color: T.ink, marginTop: 16, marginBottom: 4 },
  big: { fontFamily: F.sansSemi, fontSize: 20, color: T.ink },
  bigDate: { fontFamily: F.sans, fontSize: 15, color: OLIVE },
  cardTitle: { fontFamily: F.serif, fontSize: 17, color: T.ink },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.canvasDeep, textAlign: "center", lineHeight: 26, fontFamily: F.sansMed, fontSize: 12.5, color: T.ink },
});
