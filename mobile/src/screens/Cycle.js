import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, PanResponder, StyleSheet } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { PHASES, getPhase, CAL_GROUPS, groupForPhase, groupRange, normalizeLength } from "../shared";
import { useApp, dateKey } from "../state/AppState";
import { T, F, DARK_TEXT, IMG } from "../ui/theme";
import { Screen, Button, Serif, Body, s } from "../ui/kit";
import { CycleMonth } from "../ui/CycleMonth";

/* ---------------------------------------------------------------
   4. THE CYCLE — phases, not just days

   On sunlit water: one thin arc bowing across the screen, a pale dot
   for each phase with its days and three words beside it, and the
   title resting in the curve. The chosen day rides the arc as a small
   gold light; today keeps a ring. The Calendar view shows the same
   cycle as a month.
   --------------------------------------------------------------- */

/** The arc's shape, as fractions of the column's width. */
const ARC = { ratio: 1.3, edgeX: 0.1, bulgeX: 0.46, top: 0.06, bottom: 0.94 };
const GOLD = "#F2E2A6";

/** A circle through the top edge, the bulge at mid-height and the bottom edge. */
const arcGeometry = (w) => {
  const h = w * ARC.ratio;
  const x0 = ARC.edgeX * w;
  const d = (ARC.bulgeX - ARC.edgeX) * w;
  const r = (d * d + (h * h) / 4) / (2 * d);
  const cx = ARC.bulgeX * w - r;
  const cy = h / 2;
  const xAt = (y) => cx + Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
  const path = `M ${x0} 0 A ${r} ${r} 0 0 1 ${x0} ${h}`;
  return { h, xAt, path };
};

/** Where on the arc a cycle day sits: day 1 near the top, the last day near the bottom. */
const yForDay = (day, len, h) => (ARC.top + ((day - 0.5) / len) * (ARC.bottom - ARC.top)) * h;
const dayForY = (y, len, h) => Math.min(len, Math.max(1, Math.ceil(((y / h - ARC.top) / (ARC.bottom - ARC.top)) * len)));

const PhaseArc = ({ day, today, length, onChange }) => {
  const [width, setWidth] = useState(0);
  const len = normalizeLength(length);
  const geo = useMemo(() => (width ? arcGeometry(width) : null), [width]);
  const active = day ? groupForPhase(getPhase(day, len)).key : null;

  // dragging along the arc moves the chosen day
  const latest = useRef({ geo, len, onChange });
  latest.current = { geo, len, onChange };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => move(e.nativeEvent.locationY),
        onPanResponderMove: (e) => move(e.nativeEvent.locationY),
      }),
    []
  );
  function move(y) {
    const { geo: g, len: n, onChange: cb } = latest.current;
    if (g) cb(dayForY(y, n, g.h));
  }

  const point = (d) => {
    const y = yForDay(d, len, geo.h);
    return { x: geo.xAt(y), y };
  };
  const marker = day && geo ? point(day) : null;
  const todayPoint = today && geo && today !== day ? point(today) : null;

  return (
    <View testID="phase-column" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: "100%", aspectRatio: 1 / ARC.ratio }}>
      {geo && (
        <>
          <Svg width={width} height={geo.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={geo.path} fill="none" stroke={DARK_TEXT.text} strokeWidth={1.2} opacity={0.85} />
            {CAL_GROUPS.map((g) => {
              const r = groupRange(g.key, len);
              const p = point((r.start + r.end) / 2);
              const on = g.key === active;
              return (
                <React.Fragment key={g.key}>
                  {on && <Circle cx={p.x} cy={p.y} r={20} fill={DARK_TEXT.text} opacity={0.18} />}
                  <Circle cx={p.x} cy={p.y} r={on ? 13 : 11} fill={T.canvas} opacity={on ? 1 : 0.88} />
                </React.Fragment>
              );
            })}
            {todayPoint && <Circle cx={todayPoint.x} cy={todayPoint.y} r={5} fill="none" stroke={DARK_TEXT.text} strokeWidth={1.4} />}
            {marker && <Circle cx={marker.x} cy={marker.y} r={9} fill={GOLD} opacity={0.35} />}
            {marker && <Circle cx={marker.x} cy={marker.y} r={4.5} fill={GOLD} />}
          </Svg>

          {/* the title rests inside the curve */}
          <View pointerEvents="none" style={[styles.title, { top: geo.h / 2 - 56, width: geo.xAt(geo.h / 2) - 26 }]}>
            <Text style={styles.titleText}>{"same you,\ndifferent\nenergy"}</Text>
          </View>

          {/* the drag surface along the arc, and its screen-reader equivalent */}
          <View
            {...pan.panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Cycle day"
            accessibilityValue={{ min: 1, max: len, now: day ?? 1, text: day ? `Day ${day} of ${len}` : "No day chosen" }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) => onChange(Math.min(len, Math.max(1, (day ?? 0) + (e.nativeEvent.actionName === "increment" ? 1 : -1))))}
            testID="cycle-slider"
            style={{ position: "absolute", top: 0, bottom: 0, left: ARC.edgeX * width - 22, width: (ARC.bulgeX - ARC.edgeX) * width + 44 }}
          />

          {CAL_GROUPS.map((g) => {
            const r = groupRange(g.key, len);
            const p = point((r.start + r.end) / 2);
            const on = g.key === active;
            const color = on ? DARK_TEXT.text : DARK_TEXT.textSoft;
            return (
              <Pressable
                key={g.key}
                onPress={() => onChange(r.start)}
                accessibilityRole="button"
                accessibilityLabel={`${g.label}, days ${r.start} to ${r.end}`}
                accessibilityState={{ selected: on }}
                style={[styles.label, { left: p.x + 26, top: p.y - 26 }]}
              >
                <Text style={[styles.phaseName, { color }]}>{g.label.toUpperCase()}</Text>
                <Text style={[styles.phaseDays, { color }]}>{`days ${r.start}–${r.end}`}</Text>
                <Text style={[styles.phaseWords, { color }]}>{g.words.join(" · ")}</Text>
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
};

/** Two ways to see the cycle: the phase arc, or a month calendar. */
const ViewSwitch = ({ value, onChange }) => (
  <View style={styles.switch} accessibilityRole="tablist">
    {[["phases", "Phases"], ["calendar", "Calendar"]].map(([k, label]) => (
      <Pressable
        key={k}
        onPress={() => onChange(k)}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: value === k }}
        style={[styles.switchItem, value === k && styles.switchOn]}
      >
        <Text style={{ fontFamily: F.sansMed, fontSize: 13.5, color: value === k ? T.canvas : T.ink }}>{label}</Text>
      </Pressable>
    ))}
  </View>
);

export function Cycle() {
  const { ctx, profile, days, now } = useApp();
  const [mode, setMode] = useState("phases");
  const [picked, setPicked] = useState(null);
  // with no last period on record there is no "today" to mark
  const today = ctx.calendarKnown ? ctx.day : null;
  const day = picked ?? today;
  const label = day ? PHASES.find((p) => p.key === getPhase(day, ctx.length)).label : null;
  const isToday = day != null && day === today;
  const calendar = mode === "calendar";

  return (
    // the calendar keeps its light glass, so its water is washed paler
    <Screen image={IMG.backgrounds.cycle} blur={calendar ? 10 : 3} scrim={calendar ? "rgba(246,242,232,0.42)" : "rgba(8,18,12,0.5)"}>
      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }]}>
        <View>
          <Text accessibilityRole="header" style={[styles.heading, { color: calendar ? T.ink : DARK_TEXT.text }]}>
            CYCLE
          </Text>
          <Serif size={16} italic color={calendar ? T.inkSoft : DARK_TEXT.textSoft}>
            phases, not just days
          </Serif>
        </View>
        {!calendar && today != null && !isToday && (
          <Pressable onPress={() => setPicked(null)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Body size={12.5} color={DARK_TEXT.textSoft} style={{ textDecorationLine: "underline" }}>
              Back to today
            </Body>
          </Pressable>
        )}
      </View>

      <ViewSwitch value={mode} onChange={setMode} />

      {calendar ? (
        <CycleMonth profile={profile} days={days} todayIso={dateKey(now)} length={ctx.length} />
      ) : (
        <>
          {!ctx.calendarKnown && (
            <View style={styles.unknown} testID="cycle-unknown">
              <Body size={13.5} color={DARK_TEXT.text} style={{ marginBottom: 10 }}>
                Selena does not know where you are in your cycle yet. Add the first day of your last period, or come back when your next one
                starts.
              </Body>
              <Button tone="outline" dark size="sm" full={false} label="Add your last period" onPress={() => router.push("/edit-cycle")} />
            </View>
          )}

          <PhaseArc day={day} today={today} length={ctx.length} onChange={setPicked} />

          <Body size={13} color={DARK_TEXT.text} style={{ textAlign: "center", marginTop: 12 }} accessibilityLiveRegion="polite" testID="selected-day">
            {day == null ? "Tap a phase to explore it." : `${isToday ? "Today" : "Exploring"} · Day ${day} of ${ctx.length} · ${label}`}
          </Body>
        </>
      )}

      <View style={{ marginTop: 24 }}>
        <Button label="Log today's reality" onPress={() => router.push("/tracker")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: F.serif, fontSize: 24, letterSpacing: 3.2 },
  unknown: { borderWidth: 1, borderColor: DARK_TEXT.textFaint, borderRadius: 18, padding: 16, marginBottom: 18 },
  title: { position: "absolute", left: 0, alignItems: "center", justifyContent: "center" },
  titleText: { fontFamily: F.serif, fontSize: 25, lineHeight: 31, textAlign: "center", color: DARK_TEXT.text },
  label: { position: "absolute", right: 0, minHeight: 44 },
  phaseName: { fontFamily: F.serif, fontSize: 14.5, letterSpacing: 1.8 },
  phaseDays: { fontFamily: F.sans, fontSize: 12.5, marginTop: 1 },
  phaseWords: { fontFamily: F.serifItalic, fontSize: 13, marginTop: 2 },
  switch: {
    flexDirection: "row",
    alignSelf: "center",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,252,248,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,252,248,0.85)",
    marginBottom: 18,
  },
  switchItem: { minHeight: 40, minWidth: 108, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: T.ink },
});
