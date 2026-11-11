import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Check, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { MEAL, MEALS, MACROS, DEFAULT_GOAL, mealEntries, mealTotals, nutrientsOf, amountLabel, newId, copiedEntries } from "../lib/food";
import { FoodRow, MacroBar, kcalText, OLIVE, diaryDay, dayLabel, shiftDay } from "../ui/food";
import { FoodDetail } from "../ui/FoodDetail";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Card, IconBtn, Chip, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ONE MEAL — what was logged, with amounts that can be changed or
   removed, a way to save the lot as a meal for next time, and Select
   to copy some or all of it to another day or meal, or delete it.
   --------------------------------------------------------------- */

/** Quick adds and recipe servings are edited as portions of a pretend 100 g. */
const asFood = (e) => (e.fixed ? { id: e.id, name: e.name, per100: e.fixed, serving: { label: "1 serving", grams: 100 }, servingsOnly: true } : e.food);
const gramsOf = (e) => (e.fixed ? Math.round((e.portions ?? 1) * 100) : e.grams);
const amountOf = (e) => (e.fixed ? (e.recipeId ? `${e.portions ?? 1} serving${(e.portions ?? 1) === 1 ? "" : "s"}` : "Quick add") : amountLabel(e.food, e.grams));

export function FoodMeal() {
  const params = useLocalSearchParams();
  const meal = MEAL[params.meal] ? params.meal : "breakfast";
  const { dayAt, todayKey, addFoodEntries, updateFoodEntry, removeFoodEntry, removeFoodEntries, saveToLibrary, hideNumbers, profile } = useApp();
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
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState([]);
  const [copying, setCopying] = useState(false);
  const [notice, setNotice] = useState(null); // { text, undo? }
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));
  const foods = entries.filter((e) => e.food);
  const chosen = entries.filter((e) => picked.includes(e.id));
  const allPicked = entries.length > 0 && chosen.length === entries.length;
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const stopSelecting = () => {
    setSelecting(false);
    setPicked([]);
  };
  const count = (n) => `${n} food${n === 1 ? "" : "s"}`;

  const copyTo = (toDate, toMeal) => {
    addFoodEntries(copiedEntries(chosen, toMeal), toDate);
    setNotice({ text: `Copied ${count(chosen.length)} to ${MEAL[toMeal].label}, ${dayLabel(toDate, todayKey)}.` });
    setCopying(false);
    stopSelecting();
  };
  const deleteChosen = () => {
    const gone = chosen;
    removeFoodEntries(gone.map((e) => e.id), date);
    setNotice({ text: `Deleted ${count(gone.length)}.`, undo: () => addFoodEntries(gone, date, { recall: false }) });
    stopSelecting();
  };

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back to your diary" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <View>
          <Serif size={26} accessibilityRole="header">
            {MEAL[meal].label}
          </Serif>
          {date !== todayKey && <Body size={13}>{dayLabel(date, todayKey)}</Body>}
        </View>
        {entries.length > 0 && (
          <Pressable
            onPress={selecting ? stopSelecting : () => (setSelecting(true), setNotice(null))}
            accessibilityRole="button"
            accessibilityLabel={selecting ? "Done selecting" : "Select foods"}
            style={styles.select}
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
          entries.map((e) => {
            const sub = [e.brand, amountOf(e)].filter(Boolean).join(", ");
            if (!selecting) return <FoodRow key={e.id} name={e.name} sub={sub} kcal={nutrientsOf(e).kcal} hidden={hidden} onPress={() => setEditing(e)} />;
            const on = picked.includes(e.id);
            return (
              <Pressable key={e.id} onPress={() => toggle(e.id)} accessibilityRole="checkbox" accessibilityLabel={e.name} accessibilityState={{ checked: on }} style={styles.pickRow}>
                <View style={[styles.box, on && styles.boxOn]}>{on && <Check size={14} color={T.canvas} strokeWidth={2.6} />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName} numberOfLines={1}>
                    {e.name}
                  </Text>
                  {!!sub && (
                    <Text style={styles.pickSub} numberOfLines={1}>
                      {sub}
                    </Text>
                  )}
                </View>
                {!hidden && <Text style={styles.pickSub}>{kcalText(nutrientsOf(e).kcal)}</Text>}
              </Pressable>
            );
          })
        ) : (
          <Body size={13.5} style={{ paddingVertical: 14 }}>
            Nothing here yet.
          </Body>
        )}
      </View>

      {!!notice && (
        <View style={[s.row, styles.notice]} testID="meal-notice">
          <Body size={13} style={{ flex: 1 }}>
            {notice.text}
          </Body>
          {notice.undo && (
            <Pressable
              onPress={() => {
                notice.undo();
                setNotice(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Undo delete"
              style={styles.undo}
            >
              <Text style={styles.ghostText}>Undo</Text>
            </Pressable>
          )}
        </View>
      )}

      {selecting ? (
        <View style={{ marginTop: 16, gap: 10 }}>
          <Pressable
            onPress={() => setPicked(allPicked ? [] : entries.map((e) => e.id))}
            accessibilityRole="button"
            accessibilityLabel={allPicked ? "Clear selection" : "Select all"}
            style={styles.ghost}
          >
            <Text style={styles.ghostText}>{allPicked ? "Clear selection" : "Select all"}</Text>
          </Pressable>
          <View style={[s.row, { gap: 10 }]}>
            <Pressable
              onPress={() => setCopying(true)}
              disabled={!chosen.length}
              accessibilityRole="button"
              accessibilityLabel={`Copy ${count(chosen.length)} to another day`}
              accessibilityState={{ disabled: !chosen.length }}
              style={[styles.primary, { flex: 1 }, !chosen.length && styles.off]}
            >
              <Copy size={17} color={T.canvas} />
              <Text style={styles.primaryText}>Copy to…</Text>
            </Pressable>
            <Pressable
              onPress={deleteChosen}
              disabled={!chosen.length}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${count(chosen.length)}`}
              accessibilityState={{ disabled: !chosen.length }}
              style={[styles.ghost, styles.danger, { flex: 1 }, !chosen.length && styles.off]}
            >
              <Trash2 size={17} color={DANGER} />
              <Text style={[styles.ghostText, { color: DANGER }]}>Delete{chosen.length ? ` (${chosen.length})` : ""}</Text>
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

      <CopySheet
        visible={copying}
        what={count(chosen.length)}
        from={date}
        meal={meal}
        todayKey={todayKey}
        onClose={() => setCopying(false)}
        onCopy={copyTo}
      />

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

/** Where copies go: a day, stepped with arrows, and a meal. */
const CopySheet = ({ visible, what, from, meal, todayKey, onClose, onCopy }) => {
  // from today the usual wish is tomorrow; from any other day, today
  const start = from === todayKey ? shiftDay(todayKey, 1) : todayKey;
  const [toDate, setToDate] = useState(start);
  const [toMeal, setToMeal] = useState(meal);
  useEffect(() => {
    if (!visible) return;
    setToDate(start);
    setToMeal(meal);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const same = toDate === from && toMeal === meal;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet} testID="copy-sheet">
          <Serif size={22}>Copy {what} to</Serif>
          <View style={[s.row, styles.dayBar]}>
            <Pressable onPress={() => setToDate((d) => shiftDay(d, -1))} accessibilityRole="button" accessibilityLabel="Copy to the day before" style={styles.dayArrow}>
              <ChevronLeft size={20} color={T.ink} />
            </Pressable>
            <Text style={styles.dayLabel} testID="copy-day">
              {dayLabel(toDate, todayKey)}
            </Text>
            <Pressable onPress={() => setToDate((d) => shiftDay(d, 1))} accessibilityRole="button" accessibilityLabel="Copy to the day after" style={styles.dayArrow}>
              <ChevronRight size={20} color={T.ink} />
            </Pressable>
          </View>
          <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
            {MEALS.map((m) => (
              <Chip key={m.key} label={m.label} selected={toMeal === m.key} onPress={() => setToMeal(m.key)} />
            ))}
          </View>
          {same && <Body size={13}>That is where these foods already are; they will be doubled.</Body>}
          <Pressable
            onPress={() => onCopy(toDate, toMeal)}
            accessibilityRole="button"
            accessibilityLabel={`Copy to ${MEAL[toMeal].label}, ${dayLabel(toDate, todayKey)}`}
            style={styles.primary}
          >
            <Copy size={17} color={T.canvas} />
            <Text style={styles.primaryText}>Copy</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const DANGER = "#9B3B36";

const styles = StyleSheet.create({
  select: { marginLeft: "auto", minHeight: 40, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hair, justifyContent: "center" },
  selectText: { fontFamily: F.sansMed, fontSize: 14, color: T.ink },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  box: { width: 22, height: 22, borderWidth: 1.5, borderColor: T.ink, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: OLIVE, borderColor: OLIVE },
  pickName: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  pickSub: { fontFamily: F.sans, fontSize: 13, color: T.inkSoft },
  notice: { marginTop: 14, gap: 10, padding: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  undo: { minHeight: 36, paddingHorizontal: 12, justifyContent: "center", borderWidth: 1, borderColor: T.hair },
  danger: { flexDirection: "row", gap: 8, borderColor: DANGER },
  off: { opacity: 0.45 },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.35)" },
  sheet: { backgroundColor: T.canvas, padding: 20, paddingBottom: 34, gap: 14 },
  dayBar: { borderWidth: 1, borderColor: T.hair, minHeight: 48 },
  dayArrow: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  dayLabel: { flex: 1, textAlign: "center", fontFamily: F.serif, fontSize: 18, color: T.ink },
  total: { fontFamily: F.serifSemi, fontSize: 24, color: T.ink, textAlign: "center" },
  primary: { flexDirection: "row", gap: 8, minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  ghost: { minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  ghostText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  input: { minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 15.5, color: T.ink },
});
