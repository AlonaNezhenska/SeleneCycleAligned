import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Polyline, Circle } from "react-native-svg";
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { exerciseById, muscleLabel } from "../lib/exercises";
import { setsPerMuscle, workoutTotals, minutesOf, personalRecords } from "../lib/workout";
import { BodyFigure } from "../ui/BodyFigure";
import { OLIVE, dayLabel, shiftDay } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Card, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   TRAINING PAGES — statistics, body measurements, the training
   calendar and one finished workout.
   --------------------------------------------------------------- */

const back = () => (router.canGoBack?.() ? router.back() : router.replace("/profile"));
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

/* ---- statistics ---- */

export function WorkoutStats() {
  const { workouts, customExercises, todayKey } = useApp();
  const [days, setDays] = useState(30);
  const since = shiftDay(todayKey, -days + 1);
  const recent = workouts.filter((w) => w.date >= since);
  const perMuscle = setsPerMuscle(workouts, since, customExercises);
  const ranked = Object.entries(perMuscle).sort((a, b) => b[1] - a[1]);
  const top = ranked[0]?.[1] ?? 1;
  const totals = recent.map(workoutTotals);
  const trained = ranked.map(([m]) => m);
  const exerciseIds = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.id)))];
  const records = exerciseIds
    .map((id) => ({ id, ex: exerciseById(id, customExercises), pr: personalRecords(workouts, id) }))
    .filter((r) => r.ex && r.pr && r.pr.heaviest > 0)
    .sort((a, b) => b.pr.heaviest - a.pr.heaviest)
    .slice(0, 8);

  return (
    <Screen>
      <Header title="Statistics" />
      <View style={[s.row, { gap: 8, marginBottom: 12 }]}>
        {[7, 30, 90].map((d) => (
          <Chip key={d} label={`${d} days`} selected={days === d} onPress={() => setDays(d)} />
        ))}
      </View>
      <Card style={[s.row, { justifyContent: "space-around" }]} testID="stats-totals">
        {[
          ["Workouts", recent.length],
          ["Hours", Math.round((recent.reduce((a, w) => a + minutesOf(w), 0) / 60) * 10) / 10],
          ["Volume", `${totals.reduce((a, t) => a + t.volume, 0).toLocaleString("en-GB")} kg`],
          ["Sets", totals.reduce((a, t) => a + t.sets, 0)],
        ].map(([l, v]) => (
          <View key={l} style={{ alignItems: "center" }}>
            <Text style={styles.statValue}>{v}</Text>
            <Body size={12}>{l}</Body>
          </View>
        ))}
      </Card>

      <Text style={styles.section}>Muscles you trained</Text>
      <Card style={{ alignItems: "center", paddingVertical: 16 }}>
        <BodyFigure primary={trained.slice(0, 4)} secondary={trained.slice(4)} height={210} />
      </Card>
      <View style={{ gap: 8, marginTop: 12 }} testID="muscle-sets">
        {ranked.length ? (
          ranked.map(([m, n]) => (
            <View key={m} style={[s.row, { gap: 10 }]}>
              <Text style={styles.muscle}>{muscleLabel(m)}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(n / top) * 100}%` }]} />
              </View>
              <Text style={styles.count}>{`${n} sets`}</Text>
            </View>
          ))
        ) : (
          <Body>Finish a workout to see which muscles you trained.</Body>
        )}
      </View>

      {records.length > 0 && (
        <>
          <Text style={styles.section}>Personal records</Text>
          <Card style={{ gap: 6 }}>
            {records.map((r) => (
              <Pressable key={r.id} onPress={() => router.push({ pathname: "/workout/exercise/[id]", params: { id: r.id } })} accessibilityRole="button" style={[s.row, { minHeight: 40, gap: 8 }]}>
                <Body size={13.5} color={T.ink} style={{ flex: 1 }}>
                  {r.ex.name}
                </Body>
                <Body size={13.5} weight="medium" color={OLIVE}>{`${r.pr.heaviest} kg`}</Body>
              </Pressable>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

/* ---- body measurements ---- */

const FIELDS = [
  ["weight", "Weight", "kg"],
  ["waist", "Waist", "cm"],
  ["hips", "Hips", "cm"],
  ["chest", "Chest", "cm"],
  ["thigh", "Thigh", "cm"],
  ["arm", "Upper arm", "cm"],
  ["bodyFat", "Body fat", "%"],
];

export function Measures() {
  const { measures, addMeasure, removeMeasure, todayKey } = useApp();
  const [draft, setDraft] = useState({});
  const [chart, setChart] = useState("weight");
  const num = (v) => parseFloat(String(v ?? "").replace(",", "."));
  const any = Object.values(draft).some((v) => num(v) > 0);
  const series = [...measures]
    .filter((m) => m[chart] > 0)
    .reverse()
    .map((m) => ({ v: m[chart], d: m.date }));
  const W = 320;
  const H = 120;
  const min = Math.min(...series.map((p) => p.v));
  const max = Math.max(...series.map((p) => p.v));
  const pts = series.map((p, i) => [14 + (i / Math.max(1, series.length - 1)) * (W - 28), H - 14 - ((p.v - min) / (max - min || 1)) * (H - 28)]);

  return (
    <Screen>
      <Header title="Measures" />
      <Body size={13} style={{ marginBottom: 12 }}>
        Only on this phone, never backed up. Measure at the same time of day for the clearest picture, and remember your body shifts through your cycle.
      </Body>
      <Card style={{ gap: 4 }}>
        {FIELDS.map(([k, label, unit]) => (
          <View key={k} style={[s.row, styles.field]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              value={draft[k] ?? ""}
              onChangeText={(v) => setDraft((d) => ({ ...d, [k]: v.replace(/[^\d.,]/g, "") }))}
              keyboardType="decimal-pad"
              accessibilityLabel={`${label} in ${unit}`}
              style={styles.fieldInput}
            />
            <Body size={13} style={{ width: 26 }}>
              {unit}
            </Body>
          </View>
        ))}
        <Pressable
          onPress={() => {
            addMeasure(Object.fromEntries(Object.entries(draft).filter(([, v]) => num(v) > 0).map(([k, v]) => [k, num(v)])));
            setDraft({});
          }}
          disabled={!any}
          accessibilityRole="button"
          accessibilityLabel="Save measurements"
          style={[styles.primary, !any && { opacity: 0.45 }]}
        >
          <Text style={styles.primaryText}>Save measurements</Text>
        </Pressable>
      </Card>

      {measures.length > 0 && (
        <>
          <View style={[s.row, { gap: 8, flexWrap: "wrap", marginTop: 16 }]}>
            {FIELDS.map(([k, label]) => (
              <Chip key={k} label={label} selected={chart === k} onPress={() => setChart(k)} />
            ))}
          </View>
          <Card style={{ marginTop: 10 }} testID="measure-chart">
            {series.length > 1 ? (
              <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
                <Polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={OLIVE} strokeWidth={2.5} />
                {pts.map(([x, y], i) => (
                  <Circle key={i} cx={x} cy={y} r={4} fill={OLIVE} />
                ))}
              </Svg>
            ) : (
              <Body size={13}>Two or more entries draw a line here.</Body>
            )}
          </Card>
          <View style={{ gap: 8, marginTop: 12 }}>
            {measures.map((m) => (
              <View key={m.id} style={[s.row, styles.entry]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryDate}>{dayLabel(m.date, todayKey)}</Text>
                  <Body size={12.5}>
                    {FIELDS.filter(([k]) => m[k] > 0)
                      .map(([k, l, u]) => `${l} ${m[k]} ${u}`)
                      .join(" · ")}
                  </Body>
                </View>
                <Pressable onPress={() => removeMeasure(m.id)} accessibilityRole="button" accessibilityLabel={`Delete measurements from ${dayLabel(m.date, todayKey)}`} hitSlop={6} style={{ padding: 8 }}>
                  <Trash2 size={15} color={T.inkSoft} />
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

/* ---- calendar ---- */

export function WorkoutCalendar() {
  const { workouts, todayKey } = useApp();
  const [ty, tm] = todayKey.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [picked, setPicked] = useState(null);
  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const iso = (d) => `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const byDate = workouts.reduce((m, w) => ((m[w.date] = [...(m[w.date] ?? []), w]), m), {});
  const shift = (n) => setView(({ y, m }) => ({ y: new Date(y, m + n, 1).getFullYear(), m: new Date(y, m + n, 1).getMonth() }));
  const inMonth = workouts.filter((w) => w.date.startsWith(`${view.y}-${String(view.m + 1).padStart(2, "0")}`)).length;

  return (
    <Screen>
      <Header title="Calendar" />
      <Card>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <IconBtn label="Previous month" onPress={() => shift(-1)} style={{ borderWidth: 0 }}>
            <ChevronLeft size={18} color={T.ink} />
          </IconBtn>
          <Text style={styles.month}>{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</Text>
          <IconBtn label="Next month" onPress={() => shift(1)} style={{ borderWidth: 0 }}>
            <ChevronRight size={18} color={T.ink} />
          </IconBtn>
        </View>
        <View style={s.row}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <Text key={i} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((d, i) => {
            const has = d && byDate[iso(d)];
            return (
              <Pressable
                key={i}
                disabled={!d}
                onPress={() => setPicked(iso(d))}
                accessibilityRole="button"
                accessibilityLabel={d ? `${iso(d)}${has ? `, ${has.length} workout` : ""}` : undefined}
                style={styles.cell}
                testID={d ? `wday-${iso(d)}` : undefined}
              >
                {d ? (
                  <View style={[styles.disc, has && styles.discOn, iso(d) === todayKey && styles.discToday]}>
                    <Text style={[styles.num, has && { color: T.canvas }]}>{d}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Body size={12.5} style={{ marginTop: 8 }}>{`${inMonth} ${inMonth === 1 ? "workout" : "workouts"} this month`}</Body>
      </Card>
      {picked &&
        (byDate[picked] ?? []).map((w) => (
          <Pressable key={w.id} onPress={() => router.push({ pathname: "/workout/history/[id]", params: { id: w.id } })} accessibilityRole="button" style={[s.row, styles.entry, { marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryDate}>{w.name}</Text>
              <Body size={12.5}>{`${minutesOf(w)} min · ${workoutTotals(w).sets} sets`}</Body>
            </View>
            <ChevronRight size={18} color={T.inkSoft} />
          </Pressable>
        ))}
      {picked && !byDate[picked] && <Body style={{ marginTop: 10 }}>{`No workout on ${dayLabel(picked, todayKey)}.`}</Body>}
    </Screen>
  );
}

/* ---- one finished workout ---- */

export function WorkoutDetail() {
  const { id } = useLocalSearchParams();
  const { workouts, removeWorkout, customExercises, todayKey } = useApp();
  const w = workouts.find((x) => x.id === id);
  if (!w) {
    return (
      <Screen>
        <Header title="Workout" />
        <Body>This workout is no longer here.</Body>
      </Screen>
    );
  }
  const t = workoutTotals(w);
  const muscles = [...new Set(w.exercises.flatMap((e) => exerciseById(e.id, customExercises)?.p ?? []))];
  return (
    <Screen>
      <Header title={w.name} />
      <Body size={13.5}>{`${dayLabel(w.date, todayKey)} · ${minutesOf(w)} min · ${t.volume.toLocaleString("en-GB")} kg · ${t.sets} sets`}</Body>
      {!!w.note && (
        <Text style={styles.note} testID="workout-note">
          {w.note}
        </Text>
      )}
      <Card style={{ alignItems: "center", marginTop: 12, paddingVertical: 14 }}>
        <BodyFigure primary={muscles} height={180} still />
      </Card>
      <View style={{ gap: 10, marginTop: 12 }}>
        {w.exercises.map((e, i) => {
          const ex = exerciseById(e.id, customExercises);
          return (
            <Card key={i} style={{ gap: 4 }}>
              <Text style={styles.entryDate}>{ex?.name ?? e.id}</Text>
              {e.sets.map((st, k) => (
                <Body key={k} size={13.5} color={T.ink}>
                  {`${st.warmup ? "Warm-up" : `Set ${k + 1}`}: ${e.type === "duration" ? `${st.seconds} s` : `${st.kg ? `${st.kg} kg × ` : ""}${st.reps} reps`}`}
                </Body>
              ))}
            </Card>
          );
        })}
      </View>
      <Pressable
        onPress={() => {
          removeWorkout(w.id);
          back();
        }}
        accessibilityRole="button"
        accessibilityLabel="Delete this workout"
        style={[s.row, { gap: 6, minHeight: 44, marginTop: 14 }]}
      >
        <Trash2 size={14} color={T.terracotta} />
        <Body size={13} color={T.terracotta}>
          Delete this workout
        </Body>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headTitle: { flex: 1, fontFamily: F.serif, fontSize: 22, color: T.ink },
  section: { fontFamily: F.serif, fontSize: 19, color: T.ink, marginTop: 18, marginBottom: 8 },
  statValue: { fontFamily: F.sansSemi, fontSize: 17, color: T.ink },
  muscle: { width: 92, fontFamily: F.sansMed, fontSize: 13, color: T.ink },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: "rgba(42,38,34,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#C8553D" },
  count: { width: 56, textAlign: "right", fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft },
  field: { gap: 10, minHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  fieldLabel: { flex: 1, fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  fieldInput: { width: 86, minHeight: 40, borderRadius: 10, backgroundColor: T.canvasDeep, textAlign: "right", paddingHorizontal: 10, fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  primary: { minHeight: 50, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center", marginTop: 10 },
  primaryText: { fontFamily: F.sansMed, fontSize: 15, color: T.canvas },
  entry: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  entryDate: { fontFamily: F.serif, fontSize: 16, color: T.ink },
  month: { fontFamily: F.serif, fontSize: 18, color: T.ink },
  weekday: { flex: 1, textAlign: "center", fontFamily: F.sansMed, fontSize: 11.5, color: T.inkSoft, marginVertical: 4 },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: "center", justifyContent: "center" },
  disc: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  discOn: { backgroundColor: OLIVE },
  discToday: { borderWidth: 1.5, borderColor: T.ink },
  num: { fontFamily: F.sansMed, fontSize: 14, color: T.ink },
  note: { fontFamily: F.serifItalic, fontSize: 15, color: T.ink, marginTop: 10 },
});

