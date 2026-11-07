import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Button, Divider, IconButton } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, History, Star } from "lucide-react-native";
import { nutritionFacts, scale, unitsFor } from "../lib/food";
import { T, F, TOILE } from "./theme";
import { s } from "./kit";

/* ---------------------------------------------------------------
   ONE FOOD — its own page, opened from any list.

   The name, what the chosen amount holds, and the amount itself in a
   panel at the bottom: type it, or open the wheel to pick a number, a
   fraction and a unit. With Hide numbers on, only the name and the
   amount remain.
   --------------------------------------------------------------- */

const FRACTIONS = [
  ["-", 0],
  ["⅛", 1 / 8],
  ["¼", 1 / 4],
  ["⅓", 1 / 3],
  ["½", 1 / 2],
  ["⅔", 2 / 3],
  ["¾", 3 / 4],
];
const plain = (n) => String(Math.round(n * 100) / 100);
const nearestFraction = (f) => FRACTIONS.reduce((best, x) => (Math.abs(x[1] - f) < Math.abs(best[1] - f) ? x : best))[0];

/** The unit a saved amount reads best in: portions when it is a tidy number of them. */
const startingUnit = (units, grams) => units.find((u) => Number.isInteger((grams / u.grams) * 8)) ?? units[units.length - 1];

export const FoodDetail = ({ food, grams: initial, visible, onClose, onConfirm, confirmLabel, onRemove, hidden, title, favorite, onFavorite, logged }) => {
  const units = unitsFor(food);
  const [unitKey, setUnitKey] = useState(units[0].key);
  const [text, setText] = useState("1");
  const [wheel, setWheel] = useState(false);

  useEffect(() => {
    if (!visible || !food) return;
    const g = initial ?? units[0].grams * (units[0].key === "g" ? 100 : 1);
    const u = startingUnit(units, g);
    setUnitKey(u.key);
    setText(plain(g / u.grams));
    setWheel(false);
  }, [visible, food?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!food) return null;
  const unit = units.find((u) => u.key === unitKey) ?? units[0];
  const qty = parseFloat(text) || 0;
  const grams = Math.round(qty * unit.grams);
  const n = scale(food.per100, grams);
  const whole = Math.floor(qty);
  const most = unit.key === "g" ? 1000 : 50;

  const chooseUnit = (key) => {
    const next = units.find((u) => u.key === key);
    setUnitKey(key);
    setText(next.key === "g" ? String(grams) : "1");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.page} testID="amount-sheet">
        <View style={[s.row, styles.header]}>
          <IconButton icon={() => <ArrowLeft size={20} color={T.ink} />} mode="outlined" onPress={onClose} accessibilityLabel="Close" style={styles.headerBtn} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title ?? ""}
          </Text>
          {onFavorite ? (
            <IconButton
              icon={() => <Star size={20} color={TOILE.navy} fill={favorite ? TOILE.navy : "none"} />}
              mode="outlined"
              onPress={onFavorite}
              accessibilityLabel={favorite ? "Remove from favourites" : "Add to favourites"}
              style={styles.headerBtn}
            />
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 18 }} style={{ flex: 1 }}>
          <View style={styles.hero}>
            <Text style={styles.name}>{food.name}</Text>
            {!!food.brand && <Text style={styles.brand}>{food.brand}</Text>}
          </View>

          {!hidden && (
            <View style={[s.row, styles.stats]} testID="amount-preview" accessibilityLiveRegion="polite">
              {[
                [`${n.kcal} kcal`, "Calories"],
                [`${n.carbs} g`, "Carbs"],
                [`${n.protein} g`, "Protein"],
                [`${n.fat} g`, "Fat"],
              ].map(([value, label]) => (
                <View key={label} style={{ alignItems: "center", flex: 1 }}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          {logged && (
            <View style={[s.row, { gap: 6, justifyContent: "center", marginBottom: 8 }]}>
              <History size={15} color={T.inkSoft} />
              <Text style={styles.statLabel}>Recently logged</Text>
            </View>
          )}

          {!hidden && (
            <View style={styles.facts} testID="nutrition-facts">
              <Text style={styles.factsTitle}>Nutrition facts</Text>
              {nutritionFacts(food, grams).map((f) => (
                <View key={f.label}>
                  {f.main && <Divider style={{ marginVertical: 6 }} />}
                  <View style={[s.row, { justifyContent: "space-between", paddingVertical: 3 }]}>
                    <Text style={f.main ? styles.factMain : styles.fact}>{f.label}</Text>
                    <Text style={f.main ? styles.factMain : styles.fact}>{`${f.value} ${f.unit}`}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.panel}>
            <View style={[s.row, { gap: 2 }]}>
              <TextInput
                value={text}
                onChangeText={(t) => setText(t.replace(",", ".").replace(/[^\d.]/g, ""))}
                onFocus={() => setWheel(false)}
                keyboardType="decimal-pad"
                selectTextOnFocus
                accessibilityLabel="Amount"
                style={styles.qty}
              />
              <Pressable onPress={() => setWheel((w) => !w)} accessibilityRole="button" accessibilityLabel="Choose amount and unit" accessibilityState={{ expanded: wheel }} style={[s.row, styles.unit]}>
                <Text style={styles.unitText} numberOfLines={1}>
                  {unit.label}
                </Text>
                <ChevronDown size={18} color={T.inkSoft} />
              </Pressable>
            </View>

            <View style={[s.row, { gap: 10, marginTop: 10 }]}>
              {onRemove && (
                <Button mode="outlined" onPress={onRemove} accessibilityLabel={`Remove ${food.name}`} textColor={T.ink} style={styles.remove} labelStyle={styles.actionLabel}>
                  Remove
                </Button>
              )}
              <Button
                mode="contained"
                disabled={grams <= 0}
                onPress={() => onConfirm(grams)}
                accessibilityLabel={confirmLabel}
                buttonColor={TOILE.navy}
                textColor={T.canvas}
                style={{ flex: 1 }}
                labelStyle={styles.actionLabel}
              >
                {confirmLabel}
              </Button>
            </View>

            {wheel && (
              <View style={[s.row, { marginTop: 6 }]} testID="amount-wheel">
                <Picker style={{ flex: 1 }} itemStyle={styles.wheelItem} selectedValue={Math.min(whole, most)} onValueChange={(w) => setText(plain(w + (qty - whole)))} accessibilityLabel="Whole amount">
                  {Array.from({ length: most + 1 }, (_, i) => (
                    <Picker.Item key={i} label={String(i)} value={i} />
                  ))}
                </Picker>
                <Picker style={{ width: 84 }} itemStyle={styles.wheelItem} selectedValue={nearestFraction(qty - whole)} onValueChange={(f) => setText(plain(whole + FRACTIONS.find((x) => x[0] === f)[1]))} accessibilityLabel="Fraction">
                  {FRACTIONS.map(([label]) => (
                    <Picker.Item key={label} label={label} value={label} />
                  ))}
                </Picker>
                <Picker style={{ flex: 2 }} itemStyle={styles.wheelItem} selectedValue={unit.key} onValueChange={chooseUnit} accessibilityLabel="Unit">
                  {units.map((u) => (
                    <Picker.Item key={u.key} label={u.label} value={u.key} />
                  ))}
                </Picker>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.canvas },
  header: { justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 6, gap: 10 },
  headerBtn: { width: 44, height: 44, margin: 0, borderRadius: 0 },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: F.sans, fontSize: 16, color: T.inkSoft },
  hero: { minHeight: 150, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 28, backgroundColor: T.canvasDeep },
  name: { fontFamily: F.serif, fontSize: 26, lineHeight: 33, color: T.ink, textAlign: "center" },
  brand: { fontFamily: F.sans, fontSize: 13.5, color: T.inkSoft, marginTop: 4 },
  stats: { paddingHorizontal: 14, paddingVertical: 20 },
  statValue: { fontFamily: F.sansSemi, fontSize: 16, color: T.ink },
  statLabel: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, marginTop: 2 },
  facts: { paddingHorizontal: 24, paddingTop: 8 },
  factsTitle: { fontFamily: F.serif, fontSize: 20, color: T.ink, marginBottom: 6 },
  factMain: { fontFamily: F.sansSemi, fontSize: 14.5, color: T.ink },
  fact: { fontFamily: F.sans, fontSize: 14, color: T.inkSoft, paddingLeft: 10 },
  panel: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, backgroundColor: T.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: TOILE.line },
  qty: { width: 96, minHeight: 50, paddingHorizontal: 12, textAlign: "right", fontFamily: F.sansMed, fontSize: 17, color: T.ink, backgroundColor: T.canvasDeep },
  unit: { flex: 1, minHeight: 50, paddingHorizontal: 14, gap: 8, justifyContent: "space-between", backgroundColor: T.canvasDeep },
  unitText: { flex: 1, fontFamily: F.sans, fontSize: 16, color: T.ink },
  actionLabel: { fontFamily: F.sansSemi, fontSize: 16, marginVertical: 15 },
  remove: { borderColor: TOILE.line },
  wheelItem: { fontFamily: F.sans, fontSize: 19, color: T.ink },
});
