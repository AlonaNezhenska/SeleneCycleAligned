import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import Svg, { Path, Ellipse, Circle, G } from "react-native-svg";
import { T, F } from "./theme";

/* ---------------------------------------------------------------
   BODY FIGURE — a woman's figure, front and back, drawn for Selena.

   The muscles an exercise works glow: primary in deep red, secondary
   in a softer rose, breathing slowly so the figure feels alive. Shapes
   are stylised on purpose: calm and readable rather than anatomical.
   --------------------------------------------------------------- */

const SKIN = "#EDE4D6";
const LINE = "#9A8F7C";
const HAIR = "#6B5446";
const PRIMARY = "#C8553D";
const SECONDARY = "#E7A694";

/** The figure's outline, shared by front and back. */
const Silhouette = ({ back }) => (
  <G>
    {/* long hair framing the face; on the back it is drawn last, over the shoulders */}
    {!back && <Path d="M77 46 Q72 11 100 10 Q128 11 123 46 Q125 66 129 80 Q119 76 117 56 Q116 30 100 28 Q84 30 83 56 Q81 76 71 80 Q75 66 77 46 Z" fill={HAIR} />}
    {!back && <Ellipse cx={100} cy={42} rx={16} ry={19} fill={SKIN} stroke={LINE} strokeWidth={1} />}
    <Path d="M93 58 L107 58 L108 74 L92 74 Z" fill={SKIN} stroke={LINE} strokeWidth={1} />
    {/* arms, joined at the shoulder */}
    {[-1, 1].map((side) => (
      <G key={side}>
        <Ellipse cx={100 + side * 45} cy={124} rx={9} ry={31} rotation={side * -9} origin={`${100 + side * 45}, 124`} fill={SKIN} stroke={LINE} strokeWidth={1} />
        <Ellipse cx={100 + side * 52} cy={184} rx={7.5} ry={29} rotation={side * -5} origin={`${100 + side * 52}, 184`} fill={SKIN} stroke={LINE} strokeWidth={1} />
        <Ellipse cx={100 + side * 55} cy={220} rx={6} ry={8} fill={SKIN} stroke={LINE} strokeWidth={1} />
      </G>
    ))}
    {/* torso: soft shoulders, a waist, rounded hips */}
    <Path
      d="M68 82 Q100 72 132 82 Q141 87 139 101 Q137 122 130 142 Q122 168 124 190 Q140 212 139 246 L61 246 Q60 212 76 190 Q78 168 70 142 Q63 122 61 101 Q59 87 68 82 Z"
      fill={SKIN}
      stroke={LINE}
      strokeWidth={1}
    />
    {!back && <Path d="M76 116 Q86 130 99 121 M101 121 Q114 130 124 116" fill="none" stroke={LINE} strokeWidth={1} />}
    {/* legs */}
    {[-1, 1].map((side) => (
      <G key={side}>
        <Ellipse cx={100 + side * 18} cy={288} rx={20} ry={46} fill={SKIN} stroke={LINE} strokeWidth={1} />
        <Ellipse cx={100 + side * 16} cy={354} rx={11} ry={36} fill={SKIN} stroke={LINE} strokeWidth={1} />
        <Ellipse cx={100 + side * 18} cy={392} rx={9} ry={5} fill={SKIN} stroke={LINE} strokeWidth={1} />
      </G>
    ))}
    {back && <Path d="M80 40 Q78 12 100 11 Q122 12 120 40 Q122 70 118 100 Q100 108 82 100 Q78 70 80 40 Z" fill={HAIR} />}
  </G>
);

/** Where each muscle sits, as shapes, on the front and on the back. */
const FRONT = {
  shoulders: [<Ellipse key="l" cx={66} cy={92} rx={10} ry={12} />, <Ellipse key="r" cx={134} cy={92} rx={10} ry={12} />],
  chest: [<Ellipse key="l" cx={86} cy={108} rx={15} ry={11} />, <Ellipse key="r" cx={114} cy={108} rx={15} ry={11} />],
  biceps: [<Ellipse key="l" cx={55} cy={126} rx={6} ry={16} />, <Ellipse key="r" cx={145} cy={126} rx={6} ry={16} />],
  forearms: [<Ellipse key="l" cx={48} cy={184} rx={5} ry={19} />, <Ellipse key="r" cx={152} cy={184} rx={5} ry={19} />],
  abdominals: [<Path key="a" d="M88 126 Q100 122 112 126 L113 182 Q100 190 87 182 Z" />],
  quadriceps: [<Ellipse key="l" cx={84} cy={282} rx={12} ry={34} />, <Ellipse key="r" cx={116} cy={282} rx={12} ry={34} />],
  adductors: [<Ellipse key="l" cx={95} cy={268} rx={5} ry={20} />, <Ellipse key="r" cx={105} cy={268} rx={5} ry={20} />],
  abductors: [<Ellipse key="l" cx={70} cy={238} rx={6} ry={15} />, <Ellipse key="r" cx={130} cy={238} rx={6} ry={15} />],
  neck: [<Ellipse key="n" cx={100} cy={64} rx={6} ry={7} />],
  traps: [<Ellipse key="l" cx={86} cy={78} rx={9} ry={4} />, <Ellipse key="r" cx={114} cy={78} rx={9} ry={4} />],
  calves: [<Ellipse key="l" cx={84} cy={352} rx={6} ry={22} />, <Ellipse key="r" cx={116} cy={352} rx={6} ry={22} />],
};
const BACK = {
  traps: [<Path key="t" d="M84 78 Q100 70 116 78 L108 112 Q100 118 92 112 Z" />],
  shoulders: [<Ellipse key="l" cx={66} cy={92} rx={10} ry={12} />, <Ellipse key="r" cx={134} cy={92} rx={10} ry={12} />],
  "middle back": [<Ellipse key="l" cx={88} cy={120} rx={9} ry={12} />, <Ellipse key="r" cx={112} cy={120} rx={9} ry={12} />],
  lats: [<Ellipse key="l" cx={80} cy={146} rx={10} ry={24} />, <Ellipse key="r" cx={120} cy={146} rx={10} ry={24} />],
  "lower back": [<Ellipse key="b" cx={100} cy={186} rx={13} ry={13} />],
  triceps: [<Ellipse key="l" cx={55} cy={126} rx={6} ry={16} />, <Ellipse key="r" cx={145} cy={126} rx={6} ry={16} />],
  forearms: [<Ellipse key="l" cx={48} cy={184} rx={5} ry={19} />, <Ellipse key="r" cx={152} cy={184} rx={5} ry={19} />],
  glutes: [<Ellipse key="l" cx={87} cy={232} rx={14} ry={16} />, <Ellipse key="r" cx={113} cy={232} rx={14} ry={16} />],
  abductors: [<Ellipse key="l" cx={70} cy={236} rx={6} ry={14} />, <Ellipse key="r" cx={130} cy={236} rx={6} ry={14} />],
  hamstrings: [<Ellipse key="l" cx={84} cy={286} rx={11} ry={32} />, <Ellipse key="r" cx={116} cy={286} rx={11} ry={32} />],
  adductors: [<Ellipse key="l" cx={95} cy={270} rx={4} ry={18} />, <Ellipse key="r" cx={105} cy={270} rx={4} ry={18} />],
  calves: [<Ellipse key="l" cx={84} cy={348} rx={9} ry={22} />, <Ellipse key="r" cx={116} cy={348} rx={9} ry={22} />],
  neck: [<Ellipse key="n" cx={100} cy={64} rx={6} ry={7} />],
};

const Muscles = ({ map, primary, secondary }) => (
  <G>
    {secondary.flatMap((m) => (map[m] ?? []).map((shape, i) => React.cloneElement(shape, { key: `s-${m}-${i}`, fill: SECONDARY })))}
    {primary.flatMap((m) => (map[m] ?? []).map((shape, i) => React.cloneElement(shape, { key: `p-${m}-${i}`, fill: PRIMARY })))}
  </G>
);

/** A breath-like pulse for the working muscles. */
const usePulse = (still) => {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (still) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.45, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [still, v]);
  return v;
};

/** One view of the figure: the body, with the muscles laid over it and pulsing. */
const View1 = ({ back, primary, secondary, height, pulse }) => {
  const width = height / 2;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 200 400" style={StyleSheet.absoluteFill}>
        <Silhouette back={back} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse }]}>
        <Svg width={width} height={height} viewBox="0 0 200 400">
          <Muscles map={back ? BACK : FRONT} primary={primary} secondary={secondary} />
        </Svg>
      </Animated.View>
    </View>
  );
};

/**
 * The figure for an exercise. `primary` and `secondary` are muscle keys
 * from the library. `still` turns the pulse off (small thumbnails, tests).
 */
export const BodyFigure = ({ primary = [], secondary = [], height = 240, still = false, labels = true }) => {
  const pulse = usePulse(still);
  const backFirst = primary.some((m) => BACK[m] && !FRONT[m]);
  const views = backFirst ? [true, false] : [false, true];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Body figure. Working: ${primary.join(", ") || "whole body"}.`} testID="body-figure">
      <View style={styles.row}>
        {views.map((back) => (
          <View key={String(back)} style={{ alignItems: "center" }}>
            <View1 back={back} primary={primary} secondary={secondary} height={height} pulse={pulse} />
            {labels && <Text style={styles.label}>{back ? "Back" : "Front"}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
};

/** A small single view for lists. */
export const BodyThumb = ({ primary = [], secondary = [], size = 56 }) => {
  const back = primary.some((m) => BACK[m] && !FRONT[m]);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F1E7" }} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={size * 0.5} height={size} viewBox="0 0 200 400">
        <Silhouette back={back} />
        <Muscles map={back ? BACK : FRONT} primary={primary} secondary={secondary} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 18 },
  label: { fontFamily: F.sans, fontSize: 11.5, color: T.inkSoft, marginTop: 4 },
});
