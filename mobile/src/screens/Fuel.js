import React, { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Eye, EyeOff, Salad, Check, Plus, RotateCcw, Coffee, UtensilsCrossed, Apple, ChevronRight, ChevronLeft, CakeSlice } from "lucide-react-native";
import { applyBuffer, MASK } from "../shared";
import { useApp } from "../state/AppState";
import { MEALS, DEFAULT_GOAL, MACROS, dayTotals, mealTotals, mealEntries, fullnessWord } from "../lib/food";
import { Arc, Ring, MacroBar, Bar, shiftDay, dayLabel } from "../ui/food";
import { RecipesView } from "./Recipes";
import { T, F, IMG, TOILE } from "../ui/theme";
import { Screen, Card, Body, Serif, Instruction, s } from "../ui/kit";

/* ---------------------------------------------------------------
   6. NUTRITION — a food diary with as little friction as possible.

   One summary of the day, four meals each with a + to add food, and
   recipes. With Hide numbers on there are no figures anywhere: rings
   and bars still fill, and words say how the day is going. Nothing
   warns or turns red past a goal, and there are no streaks.

   Dressed as an old French botanical journal: toile around the edges,
   midnight navy for what you press, antique cream behind the words.
   --------------------------------------------------------------- */

export const TARGETS = { kcal: DEFAULT_GOAL.kcal, protein: DEFAULT_GOAL.protein, plates: 4, movement: 45 };

const MEAL_ICON = { breakfast: Coffee, lunch: Salad, dinner: UtensilsCrossed, snacks: Apple };
const fmt = (n) => Math.round(n).toLocaleString("en-GB");

/** The day at a glance: energy as an arc, then carbs, protein and fat. */
const Summary = ({ totals, goal, target, hidden, onEditGoal }) => {
  const left = Math.max(0, target.max - totals.kcal);
  const range = target.max !== target.base;
  return (
    <Card style={[styles.paper, { marginBottom: 18, paddingTop: 18 }]} testID="summary">
      {/* hidden, only the arc and its word remain: no figures, no goal to chase */}
      <View style={[s.row, { justifyContent: hidden ? "center" : "space-between", alignItems: "center" }]}>
        {!hidden && (
          <View style={styles.side}>
            <Text style={styles.sideNum}>{fmt(totals.kcal)}</Text>
            <Text style={styles.sideLabel}>Eaten</Text>
          </View>
        )}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Arc value={totals.kcal} goal={target.max} color={TOILE.navy} track={TOILE.track} />
          <View style={styles.arcCentre} testID="meter-Energy">
            {hidden ? (
              <Text style={styles.arcWord}>{fullnessWord(totals.kcal, target.max)}</Text>
            ) : left > 0 ? (
              <>
                <Text style={styles.arcNum}>{fmt(left)}</Text>
                <Text style={styles.sideLabel}>Remaining</Text>
              </>
            ) : (
              <Text style={styles.arcWord}>Goal reached</Text>
            )}
          </View>
        </View>
        {!hidden && (
          <Pressable onPress={onEditGoal} accessibilityRole="button" accessibilityLabel="Change your daily goal" style={styles.side}>
            <Text style={styles.sideNum}>{range ? `${fmt(target.min)}–${fmt(target.max)}` : fmt(target.base)}</Text>
            <Text style={[styles.sideLabel, { textDecorationLine: "underline" }]}>Goal</Text>
          </Pressable>
        )}
      </View>
      <View style={[s.row, { gap: 14, marginTop: 4 }]}>
        {MACROS.map((m) => (
          <MacroBar key={m.key} label={m.label} value={totals[m.key]} goal={goal[m.key]} hidden={hidden} color={TOILE.navy} />
        ))}
      </View>
    </Card>
  );
};

/** For "Visual plates": plates counted by hand, no energy figures at all. */
const Plates = ({ plates, onAdd }) => (
  <Card style={[styles.paper, { marginBottom: 18, gap: 10 }]} testID="plates">
    <Text style={styles.cardTitle}>Plates today</Text>
    <Bar value={plates} goal={TARGETS.plates} height={9} color={TOILE.navy} />
    <Body size={13}>{`${plates} of ${TARGETS.plates} plates`}</Body>
    <View style={[s.row, { gap: 8 }]}>
      <Pressable onPress={() => onAdd(1)} accessibilityRole="button" accessibilityLabel="Add a plate" style={styles.pill}>
        <Plus size={14} color={TOILE.navy} />
        <Text style={styles.pillText}>1 plate</Text>
      </Pressable>
      <Pressable onPress={() => onAdd(-1)} accessibilityRole="button" accessibilityLabel="Remove a plate" style={styles.pill}>
        <RotateCcw size={14} color={T.inkSoft} />
      </Pressable>
    </View>
  </Card>
);

const MealRow = ({ meal, day, date, target, hidden, last }) => {
  const Icon = MEAL_ICON[meal.key];
  const t = mealTotals(day, meal.key);
  const items = mealEntries(day, meal.key);
  const mealGoal = Math.round(target.max * meal.share);
  const names = items.map((e) => e.name).join(", ");
  return (
    <View style={[styles.mealRow, !last && styles.mealRule]}>
      <Pressable
        onPress={() => router.push({ pathname: "/food/meal", params: { meal: meal.key, date } })}
        accessibilityRole="button"
        accessibilityLabel={`${meal.label}${hidden ? "" : `, ${t.kcal} of ${mealGoal} kcal`}${items.length ? `, ${items.length} items` : ", nothing yet"}`}
        style={[s.row, { flex: 1, gap: 14 }]}
      >
        <Ring value={t.kcal} goal={mealGoal} color={TOILE.navy} track={TOILE.track}>
          <Icon size={20} color={TOILE.navy} strokeWidth={1.5} />
        </Ring>
        <View style={{ flex: 1 }}>
          <View style={[s.row, { gap: 4 }]}>
            <Text style={styles.mealName}>{meal.label}</Text>
            <ChevronRight size={16} color={TOILE.inkSoft} />
          </View>
          {!hidden && <Text style={styles.mealKcal}>{`${fmt(t.kcal)} / ${fmt(mealGoal)} kcal`}</Text>}
          <Text style={styles.mealItems} numberOfLines={1}>
            {names || "Nothing yet"}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push({ pathname: "/food/add", params: { meal: meal.key, date } })}
        accessibilityRole="button"
        accessibilityLabel={`Add food to ${meal.label}`}
        style={styles.addBtn}
      >
        <Plus size={22} color={T.canvas} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
};

/** Step back to check a past day, or ahead to plan tomorrow's food. */
const DayBar = ({ date, todayKey, onChange }) => (
  <View style={[s.row, styles.dayBar]}>
    <Pressable onPress={() => onChange(shiftDay(date, -1))} accessibilityRole="button" accessibilityLabel="Previous day" style={styles.dayArrow}>
      <ChevronLeft size={20} color={TOILE.navy} />
    </Pressable>
    <Pressable
      onPress={() => onChange(todayKey)}
      accessibilityRole="button"
      accessibilityLabel={date === todayKey ? "Today" : `${dayLabel(date, todayKey)}, back to today`}
      style={{ flex: 1, alignItems: "center", minHeight: 44, justifyContent: "center" }}
    >
      <Text style={styles.dayLabel} testID="diary-day">
        {dayLabel(date, todayKey)}
      </Text>
      {date !== todayKey && <Text style={styles.dayHint}>Tap for today</Text>}
    </Pressable>
    <Pressable onPress={() => onChange(shiftDay(date, 1))} accessibilityRole="button" accessibilityLabel="Next day" style={styles.dayArrow}>
      <ChevronRight size={20} color={TOILE.navy} />
    </Pressable>
  </View>
);

const ViewSwitch = ({ value, onChange }) => (
  <View style={styles.switch} accessibilityRole="tablist">
    {[
      ["diary", "Diary"],
      ["recipes", "Recipes"],
    ].map(([k, label]) => (
      <Pressable
        key={k}
        onPress={() => onChange(k)}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: value === k }}
        style={[styles.switchItem, value === k && styles.switchOn]}
      >
        <Text style={{ fontFamily: F.sansMed, fontSize: 13.5, color: value === k ? T.canvas : TOILE.navy }}>{label}</Text>
      </Pressable>
    ))}
  </View>
);

export function Fuel() {
  const { ctx, today, setToday, hideNumbers, setHideNumbers, profile, todayKey, dayAt, updateDay, showMoments } = useApp();
  const [mode, setMode] = useState("diary");
  const [date, setDate] = useState(todayKey);
  const isToday = date === todayKey;
  const day = dayAt(date);
  const editGoal = () => router.push("/food/goal");
  const goal = { ...DEFAULT_GOAL, ...profile.nutritionGoal };
  // the Luteal Buffer belongs to today; another day keeps the plain goal
  const target = applyBuffer(goal.kcal, isToday ? ctx.buffer : null, today.bufferAccepted);
  const totals = dayTotals(day);
  const plates = profile.trackingStyle === "Visual plates";
  // plates means no energy figures at all
  const hidden = hideNumbers || plates;
  const platesCount = day.food?.plates ?? 0;

  return (
    <Screen image={IMG.backgrounds.nutrition}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 16 }]}>
        <Text style={styles.eyebrow}>Nutrition</Text>
        <Pressable
          onPress={() => setHideNumbers(!hideNumbers)}
          accessibilityRole="switch"
          accessibilityLabel="Hide numbers"
          accessibilityState={{ checked: hideNumbers }}
          style={styles.hideBtn}
        >
          {hideNumbers ? <EyeOff size={14} color={TOILE.navy} /> : <Eye size={14} color={TOILE.navy} />}
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: TOILE.ink }}>Hide numbers</Text>
        </Pressable>
      </View>

      <ViewSwitch value={mode} onChange={setMode} />

      {mode === "recipes" ? (
        <RecipesView hidden={hidden} date={date} />
      ) : (
        <>
          <DayBar date={date} todayKey={todayKey} onChange={setDate} />

          {/* Luteal Buffer — offered, never applied on its own */}
          {isToday && ctx.buffer && !today.bufferDismissed && (
            <Card style={[styles.paper, { marginBottom: 18 }]} accessibilityLabel="Luteal Buffer" testID="luteal-buffer">
              {/* a satin bow tied to the corner of the buffer */}
              <Image source={IMG.nutrition.bow} style={styles.bow} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no" />
              <View style={[s.row, { alignItems: "flex-start", gap: 14 }]}>
                <Image source={IMG.nutrition.flower} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Serif size={17} color={TOILE.ink} style={{ marginRight: 34 }}>
                    Your body is burning slightly more energy today.
                  </Serif>
                  <Body size={12.5} style={{ marginTop: 6, marginBottom: 6 }}>
                    {`Optional Luteal Buffer: ${hidden ? `+${MASK}` : `+${ctx.buffer.min}–${ctx.buffer.max}`} kcal`}
                  </Body>
                  <Instruction topic="lutealBuffer" />
                  <View style={[s.row, { gap: 8, marginTop: 10 }]}>
                    <Pressable
                      onPress={() => setToday({ bufferAccepted: !today.bufferAccepted })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: today.bufferAccepted }}
                      style={[styles.pill, styles.pillNavy]}
                    >
                      {today.bufferAccepted && <Check size={13} color={T.canvas} />}
                      <Text style={{ fontFamily: F.sansMed, fontSize: 12.5, color: T.canvas }}>{today.bufferAccepted ? "Buffer on today" : "Use the buffer"}</Text>
                    </Pressable>
                    {!today.bufferAccepted && (
                      <Pressable onPress={() => setToday({ bufferDismissed: true })} accessibilityRole="button" style={styles.pill}>
                        <Text style={{ fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft }}>Not today</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          )}

          {plates ? (
            <Plates plates={platesCount} onAdd={(n) => updateDay(date, (d) => ({ ...d, food: { ...d.food, plates: Math.max(0, (d.food?.plates ?? 0) + n) } }))} />
          ) : (
            <Summary totals={totals} goal={goal} target={target} hidden={hidden} onEditGoal={editGoal} />
          )}

          {/* until a goal is chosen, the everyday guide is used and the user is invited to set her own */}
          {!plates && !profile.nutritionGoal && (
            <Pressable onPress={editGoal} accessibilityRole="button" accessibilityLabel="Set up your daily goal" style={[s.row, styles.setup]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.setupTitle}>Set up your daily goal</Text>
                <Body size={12.5}>From your height, weight and how active you are, or your own numbers.</Body>
              </View>
              <ChevronRight size={18} color={TOILE.inkSoft} />
            </Pressable>
          )}
          {!plates && profile.nutritionGoal && hidden && (
            <Pressable onPress={editGoal} accessibilityRole="button" accessibilityLabel="Change your daily goal" style={styles.goalLink}>
              <Text style={styles.goalLinkText}>Your daily goal</Text>
            </Pressable>
          )}

          {/* a treat day: marked with one tap, held in the month's insight, never a number here */}
          <Pressable
            onPress={() => {
              if (!day.food?.treat) showMoments(["treat"], date);
              updateDay(date, (d) => ({ ...d, food: { ...d.food, treat: !d.food?.treat } }));
            }}
            accessibilityRole="switch"
            accessibilityLabel="Treat day"
            accessibilityState={{ checked: !!day.food?.treat }}
            style={[s.row, styles.treat, day.food?.treat && styles.treatOn]}
          >
            <CakeSlice size={18} color={day.food?.treat ? T.canvas : TOILE.navy} strokeWidth={1.6} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.treatTitle, day.food?.treat && { color: T.canvas }]}>{day.food?.treat ? "Treat day" : "Mark as a treat day"}</Text>
              {day.food?.treat && (
                <Text style={styles.treatSub} testID="treat-note">
                  Enjoy every bite. One day never undoes a steady rhythm.
                </Text>
              )}
            </View>
            {day.food?.treat && <Check size={18} color={T.canvas} />}
          </Pressable>

          <Card style={[styles.paper, { paddingVertical: 4, marginBottom: 18 }]}>
            {MEALS.map((m, i) => (
              <MealRow key={m.key} meal={m} day={day} date={date} target={target} hidden={hidden} last={i === MEALS.length - 1} />
            ))}
          </Card>

          <View style={[s.row, styles.note]}>
            <View style={styles.noteIcon}>
              <Salad size={15} color={TOILE.navy} strokeWidth={1.6} />
            </View>
            <Body size={12.5} style={{ flex: 1 }}>
              Eating more on a hungry day is your body doing its job. Your goal only moves if you choose the buffer.
            </Body>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hideBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 14, borderWidth: 1, borderColor: TOILE.line, backgroundColor: TOILE.cream },
  paper: { backgroundColor: TOILE.cream, borderColor: TOILE.line },
  eyebrow: { fontFamily: F.serif, fontSize: 13, letterSpacing: 3.5, textTransform: "uppercase", color: TOILE.ink },
  bow: { position: "absolute", top: -16, right: -12, width: 74, height: 72, zIndex: 1 },
  dayBar: { gap: 6, marginBottom: 14 },
  treat: { gap: 12, minHeight: 52, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 14, borderWidth: 1, borderColor: TOILE.line, backgroundColor: TOILE.cream },
  treatOn: { backgroundColor: TOILE.navy, borderColor: TOILE.navy },
  treatTitle: { fontFamily: F.serif, fontSize: 16, color: TOILE.ink },
  treatSub: { fontFamily: F.sans, fontSize: 12.5, color: T.canvas, marginTop: 2 },
  dayArrow: { width: 44, height: 44, borderWidth: 1, borderColor: TOILE.line, backgroundColor: TOILE.cream, alignItems: "center", justifyContent: "center" },
  dayLabel: { fontFamily: F.serif, fontSize: 26, color: TOILE.ink },
  dayHint: { fontFamily: F.sans, fontSize: 11.5, color: TOILE.inkSoft, marginTop: 1 },
  switch: { flexDirection: "row", alignSelf: "center", padding: 4, borderWidth: 1, borderColor: TOILE.line, backgroundColor: TOILE.cream, marginBottom: 18 },
  switchItem: { minHeight: 40, minWidth: 108, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: TOILE.navy },
  side: { width: 76, alignItems: "center", minHeight: 44, justifyContent: "center" },
  sideNum: { fontFamily: F.serif, fontSize: 18, color: TOILE.ink },
  sideLabel: { fontFamily: F.sans, fontSize: 12.5, color: TOILE.inkSoft, marginTop: 2 },
  arcCentre: { position: "absolute", alignItems: "center", justifyContent: "center", left: 0, right: 0, top: 46 },
  arcNum: { fontFamily: F.serif, fontSize: 34, color: TOILE.ink },
  arcWord: { fontFamily: F.serifItalic, fontSize: 19, color: TOILE.ink, textAlign: "center", maxWidth: 120 },
  cardTitle: { fontFamily: F.serif, fontSize: 18, color: TOILE.ink },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  mealRule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: TOILE.line },
  mealName: { fontFamily: F.serif, fontSize: 19, color: TOILE.ink },
  mealKcal: { fontFamily: F.sans, fontSize: 13, color: TOILE.ink, marginTop: 2 },
  mealItems: { fontFamily: F.serifItalic, fontSize: 13, color: TOILE.inkSoft, marginTop: 2 },
  addBtn: { width: 46, height: 46, backgroundColor: TOILE.navy, alignItems: "center", justifyContent: "center" },
  thumb: { width: 60, height: 60, borderWidth: 1, borderColor: TOILE.line },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: TOILE.navy },
  pillNavy: { backgroundColor: TOILE.navy, borderColor: TOILE.navy },
  pillText: { fontFamily: F.sansMed, fontSize: 12.5, color: TOILE.navy },
  note: { alignItems: "flex-start", gap: 14, padding: 18, borderWidth: 1, borderColor: TOILE.line, backgroundColor: TOILE.cream },
  noteIcon: { width: 32, height: 32, backgroundColor: TOILE.creamDeep, alignItems: "center", justifyContent: "center" },
  setup: { gap: 12, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: TOILE.navy, backgroundColor: TOILE.cream },
  setupTitle: { fontFamily: F.serif, fontSize: 17, color: TOILE.ink, marginBottom: 2 },
  goalLink: { alignSelf: "center", minHeight: 44, justifyContent: "center", marginTop: -8, marginBottom: 10 },
  goalLinkText: { fontFamily: F.sans, fontSize: 13, color: TOILE.inkSoft, textDecorationLine: "underline" },
});
