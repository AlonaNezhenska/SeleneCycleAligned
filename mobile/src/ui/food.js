import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ScrollView, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Plus, Check, Minus } from "lucide-react-native";
import { scale, amountLabel, share, fullnessWord, searchLocal } from "../lib/food";
import { searchProducts } from "../lib/openFoodFacts";
import { T, F } from "./theme";
import { Body, Chip, s } from "./kit";

/* ---------------------------------------------------------------
   FOOD PIECES — what the diary, the add screen and recipes share.

   Every number can be hidden. Hidden, a bar or ring still fills, so
   "have I had enough protein?" reads at a glance without a figure, and
   nothing turns red or warns when a goal is passed.
   --------------------------------------------------------------- */

export const OLIVE = T.sage;
const TRACK = "rgba(42,38,34,0.1)";

export const kcalText = (n) => `${Math.round(n).toLocaleString("en-GB")} kcal`;
export const gramsText = (n) => `${Math.round(n)} g`;

/** A soft progress bar; full at the goal and never past it. */
export const Bar = ({ value, goal, color = OLIVE, height = 7, testID }) => (
  <View style={[styles.track, { height, borderRadius: height / 2 }]} testID={testID}>
    <View style={{ width: `${share(value, goal) * 100}%`, height: "100%", borderRadius: height / 2, backgroundColor: color }} />
  </View>
);

/** A ring that fills around an icon, for one meal. */
export const Ring = ({ value, goal, size = 54, stroke = 4, color = OLIVE, track = TRACK, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = share(value, goal);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {f > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c * f} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
};

/** The day's energy as an open arc, like a horseshoe. */
export const Arc = ({ value, goal, size = 176, stroke = 9, color = OLIVE, track = TRACK }) => {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 240° of arc, open at the bottom
  const start = (150 * Math.PI) / 180;
  const sweep = (240 * Math.PI) / 180;
  const at = (a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  const path = (f) => `M ${at(start)} A ${r} ${r} 0 ${f * sweep > Math.PI ? 1 : 0} 1 ${at(start + f * sweep)}`;
  const f = share(value, goal);
  return (
    <Svg width={size} height={size * 0.86}>
      <Path d={path(0.9999)} stroke={track} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      {f > 0 && <Path d={path(Math.max(0.01, f))} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />}
    </Svg>
  );
};

/** One macro: a label, a bar and either "81 / 110 g" or a gentle word. */
export const MacroBar = ({ label, value, goal, hidden, color }) => (
  <View style={{ flex: 1, gap: 6 }} accessible accessibilityLabel={`${label}: ${hidden ? fullnessWord(value, goal) : `${Math.round(value)} of ${goal} grams`}`}>
    <Text style={styles.macroLabel}>{label}</Text>
    <Bar value={value} goal={goal} color={color} testID={`bar-${label}`} />
    <Text style={styles.macroValue} testID={`macro-${label}`}>
      {hidden ? fullnessWord(value, goal) : `${Math.round(value)} / ${goal} g`}
    </Text>
  </View>
);

/** A food in a list: tap the row to choose an amount, or + to add the usual amount. */
export const FoodRow = ({ name, sub, kcal, hidden, onPress, onAdd, added }) => (
  <View style={styles.row}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}, choose amount`} style={{ flex: 1, minHeight: 48, justifyContent: "center" }}>
      <Text style={styles.rowName} numberOfLines={1}>
        {name}
      </Text>
      {!!sub && (
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </Pressable>
    {!hidden && kcal != null && <Text style={styles.rowKcal}>{kcalText(kcal)}</Text>}
    {onAdd && (
      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add ${name}`} hitSlop={6} style={[styles.plus, added && styles.plusOn]}>
        {added ? <Check size={18} color={T.canvas} strokeWidth={2.4} /> : <Plus size={18} color={OLIVE} strokeWidth={2.2} />}
      </Pressable>
    )}
  </View>
);

export const SectionTitle = ({ children, style }) => <Text style={[styles.section, style]}>{children}</Text>;

/* ---- choosing an amount ---- */

const StepBtn = ({ label, onPress, children }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.step}>
    {children}
  </Pressable>
);

/**
 * A window that slides up to choose how much of a food: in portions when
 * the food has one, or in grams. Shows what that amount adds up to,
 * unless numbers are hidden.
 */
export const AmountSheet = ({ food, grams: initial, visible, onClose, onConfirm, confirmLabel, onRemove, hidden }) => {
  const portion = food?.serving?.grams > 0 ? food.serving : null;
  // quick adds and recipe servings are counted in servings only
  const servingsOnly = !!food?.servingsOnly;
  const [unit, setUnit] = useState(portion ? "portion" : "g");
  const [grams, setGrams] = useState(initial ?? portion?.grams ?? 100);
  const [text, setText] = useState(String(initial ?? portion?.grams ?? 100));

  useEffect(() => {
    if (!visible) return;
    const g = initial ?? portion?.grams ?? 100;
    setGrams(g);
    setText(String(g));
    setUnit(portion ? "portion" : "g");
  }, [visible, food?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!food) return null;
  const set = (g) => {
    const v = Math.max(1, Math.round(g));
    setGrams(v);
    setText(String(v));
  };
  const step = unit === "portion" ? portion.grams / 2 : grams >= 100 ? 25 : 10;
  const n = scale(food.per100, grams);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet} testID="amount-sheet">
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 6 }}>
            <Text style={styles.sheetTitle}>{food.name}</Text>
            {!!food.brand && <Body size={13}>{food.brand}</Body>}

            {portion && !servingsOnly && (
              <View style={[s.row, { gap: 8, marginTop: 14 }]}>
                <Chip label="Portions" selected={unit === "portion"} onPress={() => setUnit("portion")} />
                <Chip label="Grams" selected={unit === "g"} onPress={() => setUnit("g")} />
              </View>
            )}

            <View style={[s.row, { gap: 12, marginTop: 14, justifyContent: "center" }]}>
              <StepBtn label="Less" onPress={() => set(Math.max(step, grams - step))}>
                <Minus size={18} color={T.ink} />
              </StepBtn>
              {unit === "portion" ? (
                <Text style={styles.amountBig} accessibilityLiveRegion="polite">
                  {servingsOnly ? `${grams / 100} ${grams === 100 ? "serving" : "servings"}` : amountLabel(food, grams)}
                </Text>
              ) : (
                <View style={[s.row, { gap: 6 }]}>
                  <TextInput
                    value={text}
                    onChangeText={(t) => {
                      setText(t.replace(/[^\d]/g, ""));
                      const v = parseInt(t, 10);
                      if (v > 0) setGrams(v);
                    }}
                    keyboardType="number-pad"
                    accessibilityLabel="Amount in grams"
                    style={styles.gramsInput}
                  />
                  <Text style={styles.amountBig}>g</Text>
                </View>
              )}
              <StepBtn label="More" onPress={() => set(grams + step)}>
                <Plus size={18} color={T.ink} />
              </StepBtn>
            </View>

            {portion && unit === "portion" && (
              <View style={[s.row, { gap: 8, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }]}>
                {[0.5, 1, 2].map((k) => (
                  <Chip key={k} label={k === 0.5 ? "½" : String(k)} selected={grams === Math.round(portion.grams * k)} onPress={() => set(portion.grams * k)} />
                ))}
              </View>
            )}

            {!hidden && (
              <Text style={styles.preview} testID="amount-preview">
                {`${kcalText(n.kcal)} · protein ${n.protein} g · carbs ${n.carbs} g · fat ${n.fat} g`}
              </Text>
            )}
          </ScrollView>

          <View style={[s.row, { gap: 10, marginTop: 12 }]}>
            {onRemove && (
              <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${food.name}`} style={styles.ghostBtn}>
                <Text style={{ fontFamily: F.sansMed, fontSize: 14.5, color: T.ink }}>Remove</Text>
              </Pressable>
            )}
            <Pressable onPress={() => onConfirm(grams)} accessibilityRole="button" accessibilityLabel={confirmLabel} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ---- search: the phone first, then packaged products ---- */

/**
 * Searches what is on the phone at once, and Open Food Facts after a
 * short pause in typing. Results for a query are kept, so going back
 * and forth costs nothing.
 */
export const useFoodSearch = (query, library, { online = true } = {}) => {
  const local = searchLocal(query, library);
  const [remote, setRemote] = useState({ status: "idle", items: [] });
  const cache = useRef(new Map());

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!online || q.length < 3) {
      setRemote({ status: "idle", items: [] });
      return undefined;
    }
    if (cache.current.has(q)) {
      setRemote({ status: "done", items: cache.current.get(q) });
      return undefined;
    }
    let alive = true;
    setRemote((r) => ({ ...r, status: "loading" }));
    const timer = setTimeout(async () => {
      try {
        const items = await searchProducts(q);
        cache.current.set(q, items);
        if (alive) setRemote({ status: "done", items });
      } catch {
        if (alive) setRemote({ status: "error", items: [] });
      }
    }, 700);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, online]);

  return { local, remote };
};

const styles = StyleSheet.create({
  track: { width: "100%", backgroundColor: TRACK, overflow: "hidden" },
  macroLabel: { fontFamily: F.sansMed, fontSize: 12.5, color: T.ink, textAlign: "center" },
  macroValue: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  rowName: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  rowSub: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, marginTop: 2 },
  rowKcal: { fontFamily: F.sans, fontSize: 13.5, color: T.ink },
  plus: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: OLIVE, alignItems: "center", justifyContent: "center" },
  plusOn: { backgroundColor: OLIVE },
  section: { fontFamily: F.serif, fontSize: 13, letterSpacing: 2.4, color: T.inkSoft, marginTop: 18, marginBottom: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.35)" },
  sheet: { backgroundColor: T.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30, maxHeight: "75%" },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: T.hair, marginBottom: 12 },
  sheetTitle: { fontFamily: F.serif, fontSize: 22, color: T.ink },
  step: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  amountBig: { fontFamily: F.serif, fontSize: 20, color: T.ink, textAlign: "center", maxWidth: 200 },
  gramsInput: { minWidth: 70, fontFamily: F.serif, fontSize: 24, color: T.ink, textAlign: "center", borderBottomWidth: 1, borderBottomColor: T.hair, paddingVertical: 2 },
  preview: { fontFamily: F.sans, fontSize: 13, color: T.inkSoft, textAlign: "center", marginTop: 14 },
  ghostBtn: { minHeight: 52, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  primaryBtn: { flex: 1, minHeight: 52, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
});

/* ---- moving between days ---- */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The diary day a screen was opened for, or today. */
export const diaryDay = (param, todayKey) => (ISO_DAY.test(param ?? "") ? param : todayKey);

export const shiftDay = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const x = new Date(y, m - 1, d + n, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/** "Today", "Yesterday", "Tomorrow", or "Mon 2 Nov". */
export const dayLabel = (iso, todayKey) => {
  if (iso === todayKey) return "Today";
  if (iso === shiftDay(todayKey, -1)) return "Yesterday";
  if (iso === shiftDay(todayKey, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
