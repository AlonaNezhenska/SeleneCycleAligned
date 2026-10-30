import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Eye, EyeOff, Heart, Salad, Activity, Check, Beef, Plus, RotateCcw } from "lucide-react-native";
import { maskValue, applyBuffer, MASK } from "../shared";
import { useApp } from "../state/AppState";
import { T, F, IMG } from "../ui/theme";
import { Screen, Card, Eyebrow, Body, Serif, SectionLabel, Instruction, s } from "../ui/kit";

/* ---------------------------------------------------------------
   6. THE FUEL ENGINE
   --------------------------------------------------------------- */

export const TARGETS = { kcal: 1850, protein: 110, plates: 4, movement: 45 };

const FOCUS_CARDS = [
  { title: "Brain fog + sugar craving", body: "Try dark chocolate and pumpkin seeds: magnesium your body is asking for right now.", img: IMG.hero },
  { title: "Heavy flow", body: "Iron-rich foods help replenish what your body is losing. Try a warm stew with lentils and dark leafy greens.", img: IMG.orbBody },
];

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const pct = (v, of) => Math.min(100, (v / of) * 100);

const Meter = ({ icon: Icon, label, value, progress, hidden, adds }) => (
  <View style={{ gap: 8 }}>
    <View style={[s.row, { gap: 14 }]}>
      <View style={styles.meterIcon}>
        <Icon size={17} color={T.ink} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={[s.row, { justifyContent: "space-between", marginBottom: 7 }]}>
          <Body size={12.5} weight="medium" color={T.ink}>
            {label}
          </Body>
          <Text testID={`meter-${label}`} style={{ fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, letterSpacing: hidden ? 1.5 : 0 }}>
            {maskValue(value, hidden)}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
    {adds && (
      <View style={[s.row, { gap: 8, paddingLeft: 50 }]}>
        {adds.map(({ label: l, onPress, a11y }) => (
          <Pressable key={l} onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} style={styles.add}>
            {l === "undo" ? <RotateCcw size={13} color={T.inkSoft} /> : <Plus size={13} color={T.ink} />}
            {l !== "undo" && <Text style={{ fontFamily: F.sansMed, fontSize: 12, color: T.ink }}>{hidden ? "" : l}</Text>}
          </Pressable>
        ))}
      </View>
    )}
  </View>
);

export function Fuel() {
  const { ctx, today, setToday, hideNumbers, setHideNumbers, saved, toggleSaved, profile } = useApp();
  const food = { kcal: 0, protein: 0, plates: 0, ...today.food };
  const add = (patch) => setToday({ food: { ...food, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, Math.max(0, food[k] + v)])) } });
  const target = applyBuffer(TARGETS.kcal, ctx.buffer, today.bufferAccepted);
  const kcalText = target.max === target.base ? `${fmt(food.kcal)} / ${fmt(target.base)} kcal` : `${fmt(food.kcal)} / ${fmt(target.min)}–${fmt(target.max)} kcal`;
  const plates = profile.trackingStyle === "Visual plates";
  const movement = today.movement ?? 0;

  return (
    <Screen>
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 22 }]}>
        <Eyebrow>Fuel Engine</Eyebrow>
        <Pressable
          onPress={() => setHideNumbers(!hideNumbers)}
          accessibilityRole="switch"
          accessibilityLabel="Hide numbers"
          accessibilityState={{ checked: hideNumbers }}
          style={styles.hideBtn}
        >
          {hideNumbers ? <EyeOff size={14} color={T.inkSoft} /> : <Eye size={14} color={T.inkSoft} />}
          <Text style={{ fontFamily: F.sans, fontSize: 12, color: T.ink }}>Hide numbers</Text>
        </Pressable>
      </View>

      {/* Luteal Buffer — offered, never applied on its own */}
      {ctx.buffer && !today.bufferDismissed && (
        <Card style={{ marginBottom: 20 }} accessibilityLabel="Luteal Buffer" testID="luteal-buffer">
          <View style={[s.row, { alignItems: "flex-start", gap: 14 }]}>
            <Image source={IMG.meditate} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Serif size={17}>Your body is burning slightly more energy today.</Serif>
              <Body size={12.5} style={{ marginTop: 6, marginBottom: 6 }}>
                {`Optional Luteal Buffer: ${hideNumbers ? `+${MASK}` : `+${ctx.buffer.min}–${ctx.buffer.max}`} kcal`}
              </Body>
              <Instruction topic="lutealBuffer" />
              <View style={[s.row, { gap: 8, marginTop: 10 }]}>
                <Pressable
                  onPress={() => setToday({ bufferAccepted: !today.bufferAccepted })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: today.bufferAccepted }}
                  style={[styles.pill, { backgroundColor: T.sage }]}
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

      <Card style={{ marginBottom: 20, gap: 18 }}>
        <SectionLabel>Today so far</SectionLabel>
        {plates ? (
          <Meter
            icon={Salad}
            label="Plates"
            value={`${food.plates} / ${TARGETS.plates} plates`}
            progress={pct(food.plates, TARGETS.plates)}
            hidden={hideNumbers}
            adds={[
              { label: "1 plate", a11y: "Add a plate", onPress: () => add({ plates: 1 }) },
              { label: "undo", a11y: "Remove a plate", onPress: () => add({ plates: -1 }) },
            ]}
          />
        ) : (
          <Meter
            icon={Salad}
            label="Energy"
            value={kcalText}
            progress={pct(food.kcal, target.max)}
            hidden={hideNumbers}
            adds={[
              { label: "100", a11y: "Add a snack, 100 kcal", onPress: () => add({ kcal: 100 }) },
              { label: "500", a11y: "Add a meal, 500 kcal", onPress: () => add({ kcal: 500 }) },
              { label: "undo", a11y: "Remove 100 kcal", onPress: () => add({ kcal: -100 }) },
            ]}
          />
        )}
        <Meter
          icon={Beef}
          label="Protein"
          value={`${food.protein} / ${TARGETS.protein} g`}
          progress={pct(food.protein, TARGETS.protein)}
          hidden={hideNumbers}
          adds={[
            { label: "10g", a11y: "Add 10 grams of protein", onPress: () => add({ protein: 10 }) },
            { label: "30g", a11y: "Add 30 grams of protein", onPress: () => add({ protein: 30 }) },
            { label: "undo", a11y: "Remove 10 grams of protein", onPress: () => add({ protein: -10 }) },
          ]}
        />
        <Meter icon={Activity} label="Movement" value={`${movement} / ${TARGETS.movement} min`} progress={pct(movement, TARGETS.movement)} hidden={hideNumbers} />
      </Card>

      <SectionLabel>Today's focus</SectionLabel>
      <View style={{ gap: 12, marginBottom: 20 }}>
        {FOCUS_CARDS.map(({ title, body, img }, i) => {
          const on = !!saved[i];
          return (
            <Card key={title} style={[s.row, { alignItems: "flex-start", gap: 14, paddingHorizontal: 16 }]}>
              <Image source={img} style={[styles.thumb, { width: 52, height: 52 }]} />
              <View style={{ flex: 1 }}>
                <Body size={13} weight="semi" color={T.ink}>
                  {title}
                </Body>
                <Body size={12.5}>{body}</Body>
              </View>
              <Pressable
                onPress={() => toggleSaved(i)}
                accessibilityRole="button"
                accessibilityLabel={`Save suggestion: ${title}`}
                accessibilityState={{ selected: on }}
                style={styles.heart}
              >
                <Heart size={17} strokeWidth={1.6} color={on ? T.terracotta : T.inkSoft} fill={on ? T.terracotta : "none"} />
              </Pressable>
            </Card>
          );
        })}
      </View>

      <View style={[s.row, styles.note]}>
        <View style={styles.noteIcon}>
          <Salad size={15} color={T.sage} strokeWidth={1.6} />
        </View>
        <Body size={12.5} style={{ flex: 1 }}>
          Eating more on a hungry day is your body doing its job. Your target only moves if you choose the buffer.
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hideBtn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: T.canvasDeep },
  meterIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: T.canvasDeep, alignItems: "center", justifyContent: "center" },
  track: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: "rgba(42,38,34,0.09)" },
  fill: { height: "100%", borderRadius: 4, backgroundColor: T.sage },
  add: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: T.hair, justifyContent: "center" },
  thumb: { width: 54, height: 54, borderRadius: 15 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 999 },
  heart: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  note: { alignItems: "flex-start", gap: 14, borderRadius: 18, padding: 18, backgroundColor: T.canvasDeep },
  noteIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.canvas, alignItems: "center", justifyContent: "center" },
});
