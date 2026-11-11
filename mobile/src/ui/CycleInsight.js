import React, { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { cycleInsight, describeCycle } from "../lib/insights";
import { F, TOILE, IMG } from "./theme";

/* ---------------------------------------------------------------
   SMART INSIGHTS, DRESSED — the cycle insight as a parchment card in
   the misty forest: a satin bow on its corner, a lily at its side,
   then small cards with a keepsake each (a pocket watch for protein,
   a teacup for treat days, a lily for the luteal phase) and the
   working-out behind a bow.
   --------------------------------------------------------------- */

const NAVY = TOILE.navy;
const SOFT = "#5A5E70";
const PAPER = "rgba(246,239,225,0.95)";
const DOT = { lighter: "#E7DCC6", around: NAVY, fuller: "#D39A63" };
const PHASES = [
  ["menstruation", "Period"],
  ["follicular", "Follicular"],
  ["ovulation", "Ovulation"],
  ["luteal", "Luteal"],
];
const NOTE_ICON = { protein: "watch", treat: "teacup", luteal: "lily" };

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const art = (key) => IMG.insights[key];

/** The thin line with a small star in the middle, under the kicker. */
const Divider = () => (
  <View style={styles.divider}>
    <View style={styles.rule} />
    <Text style={styles.ornament}>✦</Text>
    <View style={styles.rule} />
  </View>
);

/** Her average day on a soft scale; the paler band is about right for her aim. */
const Gauge = ({ m, hidden }) => {
  const lo = Math.min(m.avgEaten, m.goalKcal, m.avgUsed) * 0.85;
  const hi = Math.max(m.avgEaten, m.goalKcal, m.avgUsed) * 1.15;
  const pct = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  return (
    <View style={{ marginTop: 22 }} testID="insight-gauge" accessibilityLabel={hidden ? "Your average day against what your body used" : `Your average day ${fmt(m.avgEaten)} kcal; your body used ${fmt(m.avgUsed)}`}>
      <View style={styles.track}>
        <View style={[styles.band, { left: `${pct(m.goalKcal * 0.9)}%`, width: `${pct(m.goalKcal * 1.1) - pct(m.goalKcal * 0.9)}%` }]} />
        <View style={[styles.fill, { width: `${pct(m.avgEaten)}%` }]} />
        <View style={[styles.tick, { left: `${pct(m.avgUsed)}%` }]} />
        <View style={[styles.marker, { left: `${pct(m.avgEaten)}%` }]}>
          <Text style={styles.markerStar}>✦</Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { width: 10, height: 10, borderRadius: 5, backgroundColor: NAVY }]} />
          <Text style={styles.legend}>{hidden ? "Your average day" : `Your average day · ${fmt(m.avgEaten)}`}</Text>
        </View>
        <Text style={[styles.legend, { opacity: 0.5 }]}>|</Text>
        <Text style={styles.legend}>{hidden ? "Body used" : `Body used · ${fmt(m.avgUsed)}`}</Text>
      </View>
      <Text style={styles.caption}>The soft band is about right for your aim.</Text>
    </View>
  );
};

/** One dot per day, a row per phase. */
const DayDots = ({ list }) => {
  const rows = PHASES.map(([key, label]) => [label, list.filter((d) => d.group === key)]).filter(([, ds]) => ds.length);
  const dot = (d) =>
    d.state === "treat" ? (
      <Image key={d.date} source={art("flowerHead")} style={styles.treat} accessibilityLabel="Treat day" />
    ) : (
      <View key={d.date} style={[styles.dot, d.state === "none" ? styles.dotEmpty : { backgroundColor: DOT[d.state], borderColor: d.state === "lighter" ? "rgba(27,35,64,0.3)" : DOT[d.state] }]} />
    );
  return (
    <View style={{ marginTop: 20, gap: 10 }} testID="insight-dots">
      {rows.length ? (
        rows.map(([label, ds]) => (
          <View key={label} style={styles.phaseRow}>
            <Text style={styles.phase}>{label}</Text>
            <View style={styles.dots}>{ds.map(dot)}</View>
          </View>
        ))
      ) : (
        <View style={styles.dots}>{list.map(dot)}</View>
      )}
      <View style={styles.key}>
        {[
          ["lighter", "Lighter"],
          ["around", "About right"],
          ["fuller", "Fuller"],
        ].map(([k, label]) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.dot, { width: 14, height: 14, backgroundColor: DOT[k], borderColor: k === "lighter" ? "rgba(27,35,64,0.3)" : DOT[k] }]} />
            <Text style={styles.legend}>{label}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <Image source={art("flowerHead")} style={[styles.treat, { width: 18, height: 15 }]} />
          <Text style={styles.legend}>Treat</Text>
        </View>
      </View>
    </View>
  );
};

/** A small card with a keepsake on its left. */
const Keepsake = ({ icon, children, onPress, expanded, testID }) => {
  const Box = onPress ? Pressable : View;
  return (
    <Box
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { expanded } : undefined}
      style={styles.keepsake}
      testID={testID}
    >
      <View style={styles.keepsakeFrame} pointerEvents="none" />
      <Image source={art(icon)} style={[styles.keepsakeIcon, expanded && { alignSelf: "flex-start" }]} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />
      <View style={{ flex: 1 }}>{children}</View>
    </Box>
  );
};

/** The insights page body: the parchment card, then the keepsakes. */
export const CycleInsight = ({ days, todayKey, profile, goalKcal, proteinGoal, workouts = [], hidden }) => {
  const [open, setOpen] = useState(false);
  const m = cycleInsight({ days, todayKey, profile, goalKcal, proteinGoal, workouts });
  const d = describeCycle(m, { hidden });
  return (
    <View testID="month-insight" style={{ paddingBottom: 90 }}>
      <View style={styles.card}>
        <View style={styles.cardFrame} pointerEvents="none" />
        <Text style={styles.kicker}>{d.kicker}</Text>
        <Divider />
        <Text style={styles.headline} accessibilityRole="header">
          {d.headline}
        </Text>
        <Text style={styles.line}>{d.line}</Text>
        {m.logged > 0 && <Gauge m={m} hidden={hidden} />}
        <DayDots list={m.days} />

        {/* the bow tied on the corner, the lily tucked at the side */}
        <Image source={art("bow")} style={styles.bow} resizeMode="contain" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no" />
        <Image source={art("lily")} style={styles.lily} resizeMode="contain" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no" />
      </View>

      {d.notes.map((n) => (
        <Keepsake key={n.kind} icon={NOTE_ICON[n.kind] ?? "flower"}>
          <Text style={styles.note}>{n.text}</Text>
        </Keepsake>
      ))}

      {d.working.length > 0 && (
        <Keepsake icon="bowSmall" onPress={() => setOpen(!open)} expanded={open} testID="working">
          <View style={styles.workingHead}>
            <Text style={styles.note}>How we worked this out</Text>
            <ChevronDown size={18} color={NAVY} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
          </View>
          {open && (
            <View style={{ gap: 6, marginTop: 8 }}>
              {d.working.map((l, i) => (
                <Text key={i} style={styles.working}>
                  {l}
                </Text>
              ))}
            </View>
          )}
        </Keepsake>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginTop: 22, marginHorizontal: 4, paddingHorizontal: 22, paddingTop: 30, paddingBottom: 24, backgroundColor: PAPER, borderRadius: 22, borderWidth: 1, borderColor: "rgba(27,35,64,0.18)" },
  cardFrame: { position: "absolute", top: 7, left: 7, right: 7, bottom: 7, borderRadius: 17, borderWidth: 1, borderColor: "rgba(27,35,64,0.22)" },
  bow: { position: "absolute", top: -62, right: -54, width: 118, height: 150 },
  lily: { position: "absolute", top: 70, left: -42, width: 92, height: 92, transform: [{ rotate: "-18deg" }] },
  kicker: { fontFamily: F.serif, fontSize: 13, letterSpacing: 2.4, color: NAVY, textAlign: "center", paddingHorizontal: 34 },
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginBottom: 14, marginHorizontal: 30 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: NAVY, opacity: 0.45 },
  ornament: { fontSize: 11, color: NAVY },
  headline: { fontFamily: F.serif, fontSize: 25, lineHeight: 32, color: NAVY, textAlign: "center", paddingHorizontal: 6 },
  line: { fontFamily: F.serifItalic, fontSize: 15.5, lineHeight: 23, color: SOFT, textAlign: "center", marginTop: 10 },
  track: { height: 14, borderRadius: 7, backgroundColor: "rgba(27,35,64,0.1)", justifyContent: "center" },
  band: { position: "absolute", top: 0, bottom: 0, backgroundColor: "rgba(27,35,64,0.12)", borderRadius: 7 },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 7, backgroundColor: NAVY, opacity: 0.85 },
  tick: { position: "absolute", top: -5, bottom: -5, width: 2, marginLeft: -1, backgroundColor: SOFT },
  marker: { position: "absolute", width: 28, height: 28, marginLeft: -14, borderRadius: 14, backgroundColor: "#FFF9EE", borderWidth: 1.5, borderColor: NAVY, alignItems: "center", justifyContent: "center" },
  markerStar: { fontSize: 15, color: NAVY, lineHeight: 18 },
  legendRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legend: { fontFamily: F.serif, fontSize: 13, color: NAVY },
  caption: { fontFamily: F.serifItalic, fontSize: 13, color: SOFT, textAlign: "center", marginTop: 10 },
  phaseRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  phase: { width: 84, fontFamily: F.serif, fontSize: 15, color: NAVY },
  dots: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
  dotEmpty: { borderColor: "rgba(27,35,64,0.3)", backgroundColor: "transparent" },
  treat: { width: 22, height: 18, resizeMode: "contain" },
  key: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 8 },
  keepsake: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 14, marginHorizontal: 4, minHeight: 84, paddingVertical: 14, paddingLeft: 12, paddingRight: 20, backgroundColor: PAPER, borderRadius: 30, borderWidth: 1, borderColor: "rgba(27,35,64,0.18)" },
  keepsakeFrame: { position: "absolute", top: 5, left: 5, right: 5, bottom: 5, borderRadius: 25, borderWidth: 1, borderColor: "rgba(27,35,64,0.2)" },
  keepsakeIcon: { width: 64, height: 64 },
  note: { fontFamily: F.serif, fontSize: 15, lineHeight: 21, color: NAVY },
  workingHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: 10 },
  working: { fontFamily: F.serif, fontSize: 13.5, lineHeight: 19, color: SOFT },
});
