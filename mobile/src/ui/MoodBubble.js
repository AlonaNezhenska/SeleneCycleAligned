import React from "react";
import { View } from "react-native";
import Svg, { Defs, ClipPath, Circle, Path, Ellipse, LinearGradient, RadialGradient, Stop, G } from "react-native-svg";
import { VIBE_COLORS } from "../lib/vibes";

/* ---------------------------------------------------------------
   MOOD BUBBLE — a glass ball that fills a little with each day's
   vibe. Monday settles at the bottom; by Sunday the week is one
   layered drop of colour. Empty days leave the glass clear.
   --------------------------------------------------------------- */

const lighten = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * t);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
};

/** A band from a gently waving top edge down to the bottom of the ball. */
const bandPath = (size, top, amp, phase) => {
  const steps = 24;
  let d = `M 0 ${top}`;
  for (let i = 1; i <= steps; i++) {
    const x = (size * i) / steps;
    const y = top + amp * Math.sin((i / steps) * Math.PI * 2 + phase);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L ${size} ${size} L 0 ${size} Z`;
};

export const MoodBubble = ({ vibes, size = 220, id = "week", label, testID }) => {
  const r = size / 2 - Math.max(3, size * 0.025);
  const c = size / 2;
  const logged = vibes.filter(Boolean);
  const bandH = (2 * r) / 7;
  const amp = size > 100 ? 4 : 1.5;
  const bottom = c + r;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} testID={testID} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id={`${id}-clip`}>
            <Circle cx={c} cy={c} r={r} />
          </ClipPath>
          <RadialGradient id={`${id}-glass`} cx="45%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#E6DFD2" stopOpacity="0.9" />
          </RadialGradient>
          {Object.entries(VIBE_COLORS).map(([vibe, color]) => (
            <LinearGradient key={vibe} id={`${id}-${vibe}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lighten(color, 0.35)} />
              <Stop offset="100%" stopColor={color} />
            </LinearGradient>
          ))}
          <RadialGradient id={`${id}-shine`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* the glass, then the week's layers, highest first so each lower day sits on top */}
        <Circle cx={c} cy={c} r={r} fill={`url(#${id}-glass)`} />
        <G clipPath={`url(#${id}-clip)`}>
          {logged
            .map((vibe, i) => ({ vibe, i }))
            .reverse()
            .map(({ vibe, i }) => (
              <Path key={i} d={bandPath(size, bottom - bandH * (i + 1), amp, i * 1.7)} fill={`url(#${id}-${vibe})`} />
            ))}
        </G>

        {/* rim and shine make it read as glass */}
        <Circle cx={c} cy={c} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={Math.max(1, size * 0.012)} />
        <Ellipse cx={c - r * 0.35} cy={c - r * 0.45} rx={r * 0.32} ry={r * 0.18} fill={`url(#${id}-shine)`} transform={`rotate(-30 ${c - r * 0.35} ${c - r * 0.45})`} />
        <Circle cx={c + r * 0.45} cy={c + r * 0.5} r={r * 0.06} fill="#FFFFFF" opacity={0.5} />
      </Svg>
    </View>
  );
};
