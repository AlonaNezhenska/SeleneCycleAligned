import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Divider, IconButton, Surface, TouchableRipple } from "react-native-paper";
import Svg, { Circle, Path } from "react-native-svg";
import { Plus, Check, History } from "lucide-react-native";
import { share, fullnessWord, searchLocal } from "../lib/food";
import { searchProducts } from "../lib/openFoodFacts";
import { T, F, TOILE } from "./theme";
import { s } from "./kit";

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
  <View style={[styles.track, { height }]} testID={testID}>
    <View style={{ width: `${share(value, goal) * 100}%`, height: "100%", backgroundColor: color }} />
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

/** A food in a list: tap the row to look at it, or + to add the usual amount. */
export const FoodRow = ({ name, sub, kcal, hidden, onPress, onAdd, added }) => (
  <View style={styles.row}>
    <TouchableRipple onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}, choose amount`} style={{ flex: 1, minHeight: 56, justifyContent: "center" }}>
      <View>
        <Text style={styles.rowName} numberOfLines={1}>
          {name}
        </Text>
        {!!sub && (
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
    </TouchableRipple>
    {!hidden && kcal != null && <Text style={styles.rowKcal}>{kcalText(kcal)}</Text>}
    {onAdd && <AddButton name={name} added={added} onPress={onAdd} />}
  </View>
);

const AddButton = ({ name, added, onPress }) => (
  <IconButton
    icon={() => (added ? <Check size={18} color={T.canvas} strokeWidth={2.4} /> : <Plus size={18} color={TOILE.navy} strokeWidth={2.2} />)}
    mode={added ? "contained" : "outlined"}
    containerColor={added ? TOILE.navy : undefined}
    onPress={onPress}
    accessibilityLabel={`Add ${name}`}
    style={styles.plus}
  />
);

/** A search result: what it is, how much, and for the best match its macros. */
export const ResultCard = ({ name, sub, tag, logged, kcal, macros, hidden, onPress, onAdd, added }) => (
  <Surface mode="flat" elevation={0} style={styles.card}>
    <View style={[s.row, { alignItems: "flex-start", gap: 10 }]}>
      <TouchableRipple onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}, choose amount`} style={{ flex: 1 }}>
        <View>
          <Text style={styles.cardName} numberOfLines={2}>
            {name}
          </Text>
          {!!sub && (
            <Text style={styles.rowSub} numberOfLines={1}>
              {sub}
            </Text>
          )}
          <View style={[s.row, { gap: 8, marginTop: 10 }]}>
            <Text style={styles.tag}>{tag}</Text>
            {logged && <History size={15} color={TOILE.inkSoft} accessibilityLabel="Logged before" />}
            <View style={{ flex: 1 }} />
            {!hidden && kcal != null && <Text style={styles.rowKcal}>{kcalText(kcal)}</Text>}
          </View>
        </View>
      </TouchableRipple>
      {onAdd && <AddButton name={name} added={added} onPress={onAdd} />}
    </View>
    {!hidden && macros && (
      <>
        <Divider style={{ marginTop: 12 }} />
        <View style={[s.row, { justifyContent: "space-around", marginTop: 10 }]}>
          {[
            ["Carbs", macros.carbs],
            ["Protein", macros.protein],
            ["Fat", macros.fat],
          ].map(([label, g]) => (
            <View key={label} style={{ alignItems: "center" }}>
              <Text style={styles.cardMacro}>{`${g} g`}</Text>
              <Text style={styles.rowSub}>{label}</Text>
            </View>
          ))}
        </View>
      </>
    )}
  </Surface>
);

export const SectionTitle = ({ children, style }) => <Text style={[styles.section, style]}>{children}</Text>;

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
  rowName: { fontFamily: F.sansMed, fontSize: 15.5, color: T.ink },
  rowSub: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, marginTop: 2 },
  rowKcal: { fontFamily: F.sans, fontSize: 14, color: T.inkSoft },
  plus: { width: 44, height: 44, margin: 0, borderRadius: 0 },
  section: { fontFamily: F.serif, fontSize: 13, letterSpacing: 2.4, color: T.inkSoft, marginTop: 18, marginBottom: 4 },
  card: { padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: TOILE.line, backgroundColor: T.surface },
  cardName: { fontFamily: F.sansSemi, fontSize: 15.5, color: T.ink },
  cardMacro: { fontFamily: F.sansSemi, fontSize: 13, color: T.ink },
  tag: { fontFamily: F.sansMed, fontSize: 11.5, color: TOILE.navy, backgroundColor: TOILE.creamDeep, paddingHorizontal: 8, paddingVertical: 3 },
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
