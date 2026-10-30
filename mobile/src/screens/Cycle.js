import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Image, PanResponder, StyleSheet } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Line, Circle, G, Text as SvgText } from "react-native-svg";
import { Leaf } from "lucide-react-native";
import { PHASES, getPhase, CAL, CAL_GROUPS, groupForPhase, groupRange, groupCenter, calendarPath, markerPoint, dayFromY } from "../shared";
import { useApp } from "../state/AppState";
import { T, F, DARK_TEXT, IMG } from "../ui/theme";
import { Screen, Button, Serif, Body, s } from "../ui/kit";

/* ---------------------------------------------------------------
   4. THE CYCLE CALENDAR — phases, not just days

   Four painted glows on forest green, joined by one thin contour.
   The artwork stays as artwork; only the marker, the active glow
   and the labels are live.
   --------------------------------------------------------------- */

/** Glow images are squares with the blob in the middle ~55%. */
const GLOW_SIZE = 236;

const PhaseColumn = ({ day, today, length, onChange }) => {
  const [width, setWidth] = useState(0);
  const k = width / CAL.width;
  // day is null when nothing is chosen yet and the calendar is unknown
  const active = day ? groupForPhase(getPhase(day, length)).key : null;
  const m = day ? markerPoint(day, length) : null;
  const t = today ? markerPoint(today, length) : null;
  const path = useMemo(() => calendarPath(), []);

  // Dragging anywhere left of the labels moves the marker to that height.
  const latest = useRef({ k, length, onChange });
  latest.current = { k, length, onChange };
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
    const { k: kk, length: len, onChange: cb } = latest.current;
    if (kk > 0) cb(dayFromY(y / kk, len));
  }

  const labelLeft = m ? m.x < 95 : false;

  return (
    <View testID="phase-column" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: "100%", aspectRatio: CAL.width / CAL.height }}>
      {width > 0 && (
        <>
          {CAL_GROUPS.map((g) => {
            const c = groupCenter(g);
            const on = g.key === active;
            const size = GLOW_SIZE * k * (on ? 1.08 : 1);
            return (
              <Image
                key={g.key}
                source={IMG.glow[g.key]}
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={{
                  position: "absolute",
                  left: c.x * k - size / 2,
                  top: c.y * k - size / 2,
                  width: size,
                  height: size,
                  opacity: on ? 1 : 0.72,
                  mixBlendMode: "screen",
                }}
              />
            );
          })}

          <Svg width={width} height={width * (CAL.height / CAL.width)} viewBox={`0 0 ${CAL.width} ${CAL.height}`} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={path} fill="none" stroke={T.canvas} strokeWidth={0.9} opacity={0.7} />
            {CAL_GROUPS.map((g) => {
              const c = groupCenter(g);
              const on = g.key === active;
              return (
                <G key={g.key} opacity={on ? 0.95 : 0.55}>
                  <Line x1={c.x} y1={c.y} x2={CAL.labelX - 6} y2={c.y} stroke={T.canvas} strokeWidth={0.7} />
                  <Circle cx={c.x} cy={c.y} r={2.4} fill={T.canvas} />
                  <Circle cx={CAL.labelX - 6} cy={c.y} r={1.6} fill={T.canvas} />
                </G>
              );
            })}
            {t && today !== day && <Circle cx={t.x} cy={t.y} r={3} fill="none" stroke={T.canvas} strokeWidth={1} opacity={0.7} />}
            {m && <Circle cx={m.x} cy={m.y} r={9} fill={T.canvas} opacity={0.18} />}
            {m && <Circle cx={m.x} cy={m.y} r={4.5} fill={T.canvas} />}
            {m && (
            <SvgText
              x={labelLeft ? m.x + 14 : m.x - 14}
              y={m.y + 3}
              textAnchor={labelLeft ? "start" : "end"}
              fontSize={8.5}
              letterSpacing={1.2}
              fill={T.canvas}
              fontFamily={F.sansMed}
            >
              {today === day ? "YOU ARE HERE" : `DAY ${day}`}
            </SvgText>
            )}
          </Svg>

          {/* the drag surface and its screen-reader equivalent */}
          <View
            {...pan.panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Cycle day"
            accessibilityValue={{ min: 1, max: length, now: day ?? 1, text: day ? `Day ${day} of ${length}` : "No day chosen" }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) =>
              onChange(Math.min(length, Math.max(1, (day ?? 0) + (e.nativeEvent.actionName === "increment" ? 1 : -1))))
            }
            testID="cycle-slider"
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (CAL.labelX - 10) * k }}
          />

          {CAL_GROUPS.map((g) => {
            const r = groupRange(g.key, length);
            const on = g.key === active;
            const color = on ? DARK_TEXT.text : DARK_TEXT.textSoft;
            return (
              <Pressable
                key={g.key}
                onPress={() => onChange(r.start)}
                accessibilityRole="button"
                accessibilityLabel={`${g.label}, days ${r.start} to ${r.end}`}
                accessibilityState={{ selected: on }}
                style={{ position: "absolute", left: CAL.labelX * k, right: 0, top: (g.cy - 14) * k, minHeight: 44 }}
              >
                <Text style={{ fontFamily: F.serif, fontSize: 15, letterSpacing: 1.8, color }}>{g.label.toUpperCase()}</Text>
                <Text style={{ fontFamily: F.serif, fontSize: 15, color }}>{`${r.start}–${r.end}`}</Text>
                <Text style={{ fontFamily: F.serifItalic, fontSize: 12.5, color, marginTop: 2 }}>{g.words.join(" · ")}</Text>
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
};

export function Cycle() {
  const { ctx } = useApp();
  const [picked, setPicked] = useState(null);
  // with no last period on record there is no "today" to mark
  const today = ctx.calendarKnown ? ctx.day : null;
  const day = picked ?? today;
  const label = day ? PHASES.find((p) => p.key === getPhase(day, ctx.length)).label : null;
  const isToday = day != null && day === today;

  return (
    <Screen bg="forest">
      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }]}>
        <View>
          <Text accessibilityRole="header" style={{ fontFamily: F.serif, fontSize: 24, letterSpacing: 3.2, color: DARK_TEXT.text }}>
            CYCLE CALENDAR
          </Text>
          <Serif size={16} italic color={DARK_TEXT.textSoft}>
            phases, not just days
          </Serif>
        </View>
        {today != null && !isToday && (
          <Pressable onPress={() => setPicked(null)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
            <Body size={12.5} color={DARK_TEXT.textSoft} style={{ textDecorationLine: "underline" }}>
              Back to today
            </Body>
          </Pressable>
        )}
      </View>

      {!ctx.calendarKnown && (
        <View style={[styles.unknown, { borderColor: DARK_TEXT.textFaint }]} testID="cycle-unknown">
          <Body size={13.5} color={DARK_TEXT.text} style={{ marginBottom: 10 }}>
            Selena does not know where you are in your cycle yet. Add the first day of your last period, or come back when
            your next one starts.
          </Body>
          <Button tone="outline" dark size="sm" full={false} label="Add your last period" onPress={() => router.push("/edit-cycle")} />
        </View>
      )}

      <PhaseColumn day={day} today={today} length={ctx.length} onChange={setPicked} />

      <Body
        size={13}
        color={DARK_TEXT.text}
        style={{ textAlign: "center", marginTop: 16 }}
        accessibilityLiveRegion="polite"
        testID="selected-day"
      >
        {day == null ? "Tap a phase to explore it." : `${isToday ? "Today" : "Exploring"} · Day ${day} of ${ctx.length} · ${label}`}
      </Body>

      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-end", marginVertical: 24 }]}>
        <Serif size={16} italic color={DARK_TEXT.textSoft}>
          {"same you,\ndifferent energy"}
        </Serif>
        <Leaf size={30} strokeWidth={1} color={DARK_TEXT.textSoft} />
      </View>

      <Button label="Log today's reality" onPress={() => router.push("/tracker")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  unknown: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 18 },
});
