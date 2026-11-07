import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, PanResponder, StyleSheet } from "react-native";
import { BLOOM_SHEET, BLOOM_COUNT, BLOOM_COLUMNS, BLOOM_FRAME, bloomFrame, intensityWord } from "../content/bloom";
import { T, F } from "./theme";

/* ---------------------------------------------------------------
   FLOWER INTENSITY — one living flower and the slider that moves it.

   Every item uses the peony from flowerbloom.gif. Positive states open
   it as they grow; difficult symptoms close it back into a bud. Dragging
   feeds every in-between value to a spring, so the same flower changes
   in place and eases back when the slider returns.
   --------------------------------------------------------------- */

const OLIVE = "#4A4A2B";
const testing = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

/** A critically damped spring that follows `target` frame by frame.
 *  With `immediate` it sits exactly on the target (the finger, while
 *  dragging), so the next release springs on from where the finger was. */
const useSpring = (target, immediate = false) => {
  const [value, setValue] = useState(target);
  const state = useRef({ x: target, v: 0, raf: null });

  useEffect(() => {
    const s = state.current;
    if (testing || immediate) {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = null;
      s.x = target;
      s.v = 0;
      setValue(target);
      return undefined;
    }
    const stiffness = 180;
    const damping = 24;
    const step = () => {
      const dt = 1 / 60;
      const a = stiffness * (target - s.x) - damping * s.v;
      s.v += a * dt;
      s.x += s.v * dt;
      if (Math.abs(target - s.x) < 0.002 && Math.abs(s.v) < 0.002) {
        s.x = target;
        s.v = 0;
        setValue(target);
        s.raf = null;
        return;
      }
      setValue(s.x);
      s.raf = requestAnimationFrame(step);
    };
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(step);
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = null;
    };
  }, [target, immediate]);

  return value;
};

/** Where along the track a finger is, as a level from 1 to 5. */
export const levelFromX = (pageX, { x, width }) => 1 + Math.min(1, Math.max(0, (pageX - x) / width)) * 4;

/** The peony. One sheet holds every frame; the window shows one cell and
 *  scrubbing only shifts the sheet, so no frame ever has to load. */
export const PeonyBloom = ({ level, direction = "open", width = 190 }) => {
  const current = bloomFrame(level, direction);
  const height = (width * BLOOM_FRAME.height) / BLOOM_FRAME.width;
  const rows = Math.ceil(BLOOM_COUNT / BLOOM_COLUMNS);
  const col = current % BLOOM_COLUMNS;
  const row = Math.floor(current / BLOOM_COLUMNS);
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Image
        source={BLOOM_SHEET}
        fadeDuration={0}
        style={{ width: width * BLOOM_COLUMNS, height: height * rows, transform: [{ translateX: -col * width }, { translateY: -row * height }] }}
      />
    </View>
  );
};

/** Flower and slider for one item; the level is shown in words. */
export const FlowerIntensity = ({ label, value = 3, onChange, direction = "close", onDragChange }) => {
  const [drag, setDrag] = useState(null);
  const shown = useSpring(drag ?? value, drag != null);
  const track = useRef(null);
  const geometry = useRef({ x: 0, width: 0 });
  const latest = useRef({ onChange, onDragChange });
  latest.current = { onChange, onDragChange };

  // know where the track is before the finger arrives, so the first touch lands true
  const measure = () =>
    track.current?.measureInWindow?.((x, _y, width) => {
      if (width) geometry.current = { x, width };
    });

  const levelAt = (pageX) => levelFromX(pageX, geometry.current);

  // A tap jumps to that point; a drag follows the finger exactly; letting go
  // springs to the nearest level. The slider claims the gesture straight away
  // and never hands it to the scrolling panel around it.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e) => {
        latest.current.onDragChange?.(true);
        const pageX = e.nativeEvent.pageX;
        if (geometry.current.width) setDrag(levelAt(pageX));
        // refresh in case the panel moved since it was laid out
        track.current?.measureInWindow?.((x, _y, width) => {
          if (!width) return;
          geometry.current = { x, width };
          setDrag(levelAt(pageX));
        });
      },
      onPanResponderMove: (e) => {
        if (geometry.current.width) setDrag(levelAt(e.nativeEvent.pageX));
      },
      onPanResponderRelease: (e) => {
        const level = geometry.current.width ? Math.round(levelAt(e.nativeEvent.pageX)) : null;
        setDrag(null);
        latest.current.onDragChange?.(false);
        if (level) latest.current.onChange(level);
      },
      onPanResponderTerminate: () => {
        setDrag(null);
        latest.current.onDragChange?.(false);
      },
    })
  ).current;

  const pct = ((shown - 1) / 4) * 100;
  const word = intensityWord(drag ?? value);

  return (
    <View style={{ alignItems: "center" }}>
      <View accessible accessibilityRole="image" accessibilityLabel={`${label}: ${intensityWord(value)}`} testID="flower">
        <PeonyBloom level={shown} direction={direction} />
      </View>
      <Text style={styles.word} accessibilityLiveRegion="polite">
        {word}
      </Text>

      <View
        ref={track}
        onLayout={measure}
        {...pan.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${label} intensity`}
        accessibilityValue={{ min: 1, max: 5, now: value, text: intensityWord(value) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => onChange(Math.min(5, Math.max(1, value + (e.nativeEvent.actionName === "increment" ? 1 : -1))))}
        style={styles.trackArea}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
        {/* the rail is narrower by one thumb, so the thumb never leaves the track */}
        <View pointerEvents="none" style={styles.rail}>
          <View style={[styles.thumb, { left: `${pct}%` }]} />
        </View>
      </View>

      <View style={styles.ends} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.end}>Very mild</Text>
        <Text style={styles.end}>Very intense</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  word: { fontFamily: F.serifItalic, fontSize: 20, color: T.ink, marginTop: 6 },
  trackArea: { width: "100%", height: 60, justifyContent: "center", marginTop: 2 },
  track: { height: 6, backgroundColor: "rgba(74,74,43,0.18)", marginHorizontal: 15, overflow: "hidden" },
  fill: { height: 6, backgroundColor: OLIVE },
  rail: { position: "absolute", left: 0, right: 30, top: 15, height: 30 },
  thumb: { position: "absolute", top: 0, width: 30, height: 30, backgroundColor: T.canvas, borderWidth: 2.5, borderColor: OLIVE },
  ends: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 2 },
  end: { fontFamily: F.serif, fontSize: 12.5, color: T.inkSoft },
});
