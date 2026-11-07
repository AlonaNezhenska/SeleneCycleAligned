import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { T, F, tone } from "./theme";
import { IconBtn, s } from "./kit";

/* ---------------------------------------------------------------
   MONTH CALENDAR — for remembering dates, not for planning the cycle.
   "single" picks one day. "range" picks a first and a last day:
   tap the first day, then the last; tapping again starts over.
   Future days are never selectable.
   --------------------------------------------------------------- */

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const parts = (s) => s.split("-").map(Number);

const label = (y, m, d) =>
  new Date(y, m, d, 12).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const Calendar = ({ mode = "single", value, start, end, onChange, maxDate, dark = false, testID }) => {
  const c = tone(dark);
  const anchor = (mode === "range" ? start : value) ?? maxDate;
  const [ay, am] = parts(anchor);
  const [view, setView] = useState({ y: ay, m: am - 1 });
  const [maxY, maxM] = parts(maxDate);
  const atMax = view.y > maxY || (view.y === maxY && view.m >= maxM - 1);

  const shift = (n) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const daysIn = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const pick = (d) => {
    if (mode === "single") return onChange(d);
    if (!start || end || d < start) return onChange({ start: d, end: null });
    return onChange({ start, end: d });
  };

  return (
    <View testID={testID} style={[styles.wrap, { borderColor: c.hair, backgroundColor: dark ? c.surface : T.canvas }]}>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
        <IconBtn label="Previous month" onPress={() => shift(-1)} dark={dark} style={{ borderWidth: 0 }}>
          <ChevronLeft size={18} color={c.text} />
        </IconBtn>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={{ fontFamily: F.serif, fontSize: 17, color: c.text }}>
          {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </Text>
        <IconBtn label="Next month" onPress={atMax ? undefined : () => shift(1)} dark={dark} style={{ borderWidth: 0, opacity: atMax ? 0.3 : 1 }}>
          <ChevronRight size={18} color={c.text} />
        </IconBtn>
      </View>

      <View style={s.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={[styles.weekday, { color: c.textSoft }]} accessibilityElementsHidden importantForAccessibility="no">
            {w}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={s.row}>
          {week.map((d, di) => {
            if (!d) return <View key={di} style={styles.cell} />;
            const key = iso(view.y, view.m, d);
            const future = key > maxDate;
            const isStart = mode === "range" ? key === start : key === value;
            const isEnd = mode === "range" && key === end;
            const inside = mode === "range" && start && end && key > start && key < end;
            const chosen = isStart || isEnd;
            return (
              <Pressable
                key={di}
                onPress={future ? undefined : () => pick(key)}
                disabled={future}
                accessibilityRole="button"
                accessibilityLabel={label(view.y, view.m, d)}
                accessibilityState={{ selected: chosen || !!inside, disabled: future }}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.day,
                    inside && { backgroundColor: dark ? c.surfaceDeep : "rgba(164,74,51,0.14)" },
                    chosen && { backgroundColor: T.terracotta },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: chosen ? F.sansSemi : F.sans,
                      fontSize: 14,
                      color: chosen ? T.canvas : c.text,
                      opacity: future ? 0.3 : 1,
                    }}
                  >
                    {d}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

/** "Mon 6 Oct" for summaries. */
export const shortDate = (isoDate) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, padding: 8 },
  weekday: { flex: 1, textAlign: "center", fontFamily: F.sansMed, fontSize: 11.5, paddingVertical: 4 },
  cell: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  day: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
});
