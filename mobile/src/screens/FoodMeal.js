import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Alert, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Check, Copy, Trash2 } from "lucide-react-native";
import { CopySheet } from "../ui/CopySheet";
import { useApp } from "../state/AppState";
import { MEAL, MACROS, DEFAULT_GOAL, mealEntries, mealTotals, nutrientsOf, amountLabel, newId } from "../lib/food";
import { FoodRow, MacroBar, kcalText, OLIVE, diaryDay, dayLabel } from "../ui/food";
import { FoodDetail } from "../ui/FoodDetail";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Card, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ONE MEAL — what was logged, with amounts that can be changed or
   removed, and a way to save the lot as a meal for next time.
   --------------------------------------------------------------- */

/** Quick adds and recipe servings are edited as portions of a pretend 100 g. */
const asFood = (e) => (e.fixed ? { id: e.id, name: e.name, per100: e.fixed, serving: { label: "1 serving", grams: 100 }, servingsOnly: true } : e.food);
const gramsOf = (e) => (e.fixed ? Math.round((e.portions ?? 1) * 100) : e.grams);
const amountOf = (e) => (e.fixed ? (e.recipeId ? `${e.portions ?? 1} serving${(e.portions ?? 1) === 1 ? "" : "s"}` : "Quick add") : amountLabel(e.food, e.grams));

export function FoodMeal() {
  const params = useLocalSearchParams();
  const meal = MEAL[params.meal] ? params.meal : "breakfast";
  const { dayAt, todayKey, updateFoodEntry, removeFoodEntry, addFoodEntries, saveToLibrary, hideNumbers, profile } = useApp();
  // choosing several foods at once, to copy to another meal or day, or to delete
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState([]);
  const [copying, setCopying] = useState(false);
  const [notice, setNotice] = useState(null);
  const date = diaryDay(params.date, todayKey);
  const day = dayAt(date);
  const hidden = hideNumbers || profile.trackingStyle === "Visual plates";
  const entries = mealEntries(day, meal);
  const totals = mealTotals(day, meal);
  const goal = { ...DEFAULT_GOAL, ...profile.nutritionGoal };
  const [editing, setEditing] = useState(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(`My ${MEAL[meal].label.toLowerCase()}`);
  const [saved, setSaved] = useState(false);
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));
  const foods = entries.filter((e) => e.food);
  const pickedEntries = entries.filter((e) => chosen.includes(e.id));
  const plural = (n) => `${n} ${n === 1 ? "food" : "foods"}`;
  const flip = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const stopSelecting = () => {
    setSelecting(false);
    setChosen([]);
  };
  const copyTo = ({ meal: toMeal, date: toDate }) => {
    addFoodEntries(pickedEntries.map((e) => ({ ...e, id: newId(), meal: toMeal })), toDate);
    setNotice(`Copied ${plural(pickedEntries.length)} to ${MEAL[toMeal].label}, ${dayLabel(toDate, todayKey)}.`);
    setCopying(false);
    stopSelecting();
  };
  const deleteChosen = () =>
    Alert.alert(`Delete ${plural(pickedEntries.length)}?`, "They come out of this meal.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          pickedEntries.forEach((e) => removeFoodEntry(e.id, date));
          setNotice(`Deleted ${plural(pickedEntries.length)}.`);
          stopSelecting();
        },
      },
    ]);

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back to your diary" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <View style={{ flex: 1 }}>
          <Serif size={26} accessibilityRole="header">
            {MEAL[meal].label}
          </Serif>
          {date !== todayKey && <Body size={13}>{dayLabel(date, todayKey)}</Body>}
        </View>
        {entries.length > 0 && (
          <Pressable
            onPress={() => {
              if (selecting) stopSelecting();
              else {
                setSelecting(true);
                setNotice(null);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={selecting ? "Done selecting" : "Select foods"}
            style={styles.selectBtn}
          >
            <Text style={styles.selectText}>{selecting ? "Done" : "Select"}</Text>
          </Pressable>
        )}
      </View>

      <Card style={{ marginTop: 16, gap: 12 }}>
        {!hidden && <Text style={styles.total}>{kcalText(totals.kcal)}</Text>}
        <View style={[s.row, { gap: 14 }]}>
          {MACROS.map((m) => (
            <MacroBar key={m.key} label={m.label} value={totals[m.key]} goal={Math.round(goal[m.key] * MEAL[meal].share)} hidden={hidden} />
          ))}
        </View>
      </Card>

      <View style={{ marginTop: 12 }} testID="meal-entries">
        {entries.length ? (
          entries.map((e) =>
            selecting ? (
              <Pressable
                key={e.id}
                onPress={() => flip(e.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: chosen.includes(e.id) }}
                accessibilityLabel={e.name}
                style={[s.row, styles.pickRow]}
              >
                <View style={[styles.box, chosen.includes(e.id) && styles.boxOn]}>{chosen.includes(e.id) && <Check size={15} color={T.canvas} strokeWidth={2.6} />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Body size={12.5} numberOfLines={1}>
                    {[e.brand, amountOf(e)].filter(Boolean).join(", ")}
                  </Body>
                </View>
              </Pressable>
            ) : (
            <FoodRow
              key={e.id}
              name={e.name}
              sub={[e.brand, amountOf(e)].filter(Boolean).join(", ")}
              kcal={nutrientsOf(e).kcal}
              hidden={hidden}
              onPress={() => setEditing(e)}
            />
            )
          )
        ) : (
          <Body size={13.5} style={{ paddingVertical: 14 }}>
            Nothing here yet.
          </Body>
        )}
      </View>

      {notice && !selecting && (
        <Body size={13} style={{ marginTop: 10 }} testID="meal-notice">
          {notice}
        </Body>
      )}

      {selecting ? (
        <View style={{ marginTop: 16, gap: 8 }}>
          <Pressable onPress={() => setChosen(chosen.length === entries.length ? [] : entries.map((e) => e.id))} accessibilityRole="button" style={styles.ghost}>
            <Text style={styles.ghostText}>{chosen.length === entries.length ? "Clear all" : "Select all"}</Text>
          </Pressable>
          <View style={[s.row, { gap: 8 }]}>
            <Pressable
              onPress={() => setCopying(true)}
              disabled={!chosen.length}
              accessibilityRole="button"
              accessibilityLabel="Copy to another meal or day"
              style={[styles.primary, { flex: 1 }, !chosen.length && { opacity: 0.45 }]}
            >
              <Copy size={17} color={T.canvas} />
              <Text style={styles.primaryText}>Copy to…</Text>
            </Pressable>
            <Pressable
              onPress={deleteChosen}
              disabled={!chosen.length}
              accessibilityRole="button"
              accessibilityLabel="Delete selected"
              style={[styles.deleteBtn, !chosen.length && { opacity: 0.45 }]}
            >
              <Trash2 size={17} color="#9B4A3C" />
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : (
      <Pressable
        onPress={() => router.push({ pathname: "/food/add", params: { meal, date } })}
        accessibilityRole="button"
        accessibilityLabel={`Add food to ${MEAL[meal].label}`}
        style={[styles.primary, { marginTop: 16 }]}
      >
        <Plus size={18} color={T.canvas} />
        <Text style={styles.primaryText}>Add food</Text>
      </Pressable>
      )}

      <CopySheet visible={copying} count={chosen.length} fromMeal={meal} fromDate={date} todayKey={todayKey} onCopy={copyTo} onClose={() => setCopying(false)} />

      {!selecting && foods.length > 1 &&
        (saved ? (
          <Body size={13} style={{ marginTop: 14, textAlign: "center" }}>
            Saved to My meals.
          </Body>
        ) : naming ? (
          <View style={{ marginTop: 14, gap: 8 }}>
            <TextInput value={name} onChangeText={setName} accessibilityLabel="Meal name" style={styles.input} />
            <Pressable
              onPress={() => {
                saveToLibrary("meals", { id: `mine:${newId()}`, name: name.trim() || MEAL[meal].label, items: foods.map((e) => ({ food: e.food, grams: e.grams })) });
                setSaved(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Save meal"
              style={styles.ghost}
            >
              <Text style={styles.ghostText}>Save meal</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setNaming(true)} accessibilityRole="button" accessibilityLabel="Save these foods as a meal" style={[styles.ghost, { marginTop: 12 }]}>
            <Text style={styles.ghostText}>Save these foods as a meal</Text>
          </Pressable>
        ))}

      <FoodDetail
        food={editing ? asFood(editing) : null}
        grams={editing ? gramsOf(editing) : undefined}
        visible={!!editing}
        hidden={hidden}
        confirmLabel="Save"
        onClose={() => setEditing(null)}
        onRemove={() => {
          removeFoodEntry(editing.id, date);
          setEditing(null);
        }}
        onConfirm={(g) => {
          updateFoodEntry(editing.id, editing.fixed ? { portions: g / 100 } : { grams: g }, date);
          setEditing(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  selectBtn: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: T.hair },
  selectText: { fontFamily: F.sansMed, fontSize: 14, color: OLIVE },
  pickRow: { gap: 12, minHeight: 58, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  box: { width: 24, height: 24, borderWidth: 1.5, borderColor: T.inkSoft, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: OLIVE, borderColor: OLIVE },
  pickName: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  deleteBtn: { flexDirection: "row", gap: 6, minHeight: 52, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#9B4A3C" },
  deleteText: { fontFamily: F.sansMed, fontSize: 15, color: "#9B4A3C" },
  total: { fontFamily: F.serifSemi, fontSize: 24, color: T.ink, textAlign: "center" },
  primary: { flexDirection: "row", gap: 8, minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  ghost: { minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  ghostText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  input: { minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 15.5, color: T.ink },
});
