import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   MEDITATE — a quiet timer with a breathing circle: in for four,
   out for six. When it ends, or she stops early, the calm minutes are
   added to today's activity.
   --------------------------------------------------------------- */

const LENGTHS = [3, 5, 10, 15, 20];
const IN_MS = 4000;
const OUT_MS = 6000;

const clock = (ms) => {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

export function Meditate() {
  const { addActivity } = useApp();
  const [length, setLength] = useState(5);
  const [state, setState] = useState({ status: "ready", left: 5 * 60000, startedAt: null, used: 0 });
  const [breath, setBreath] = useState("Breathe in");
  const scale = useRef(new Animated.Value(0.6)).current;
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));
  const running = state.status === "running";

  // the circle grows on the in-breath and settles on the out-breath
  useEffect(() => {
    if (!running) return undefined;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      setBreath("Breathe in");
      Animated.timing(scale, { toValue: 1, duration: IN_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start(() => {
        if (!alive) return;
        setBreath("Breathe out");
        Animated.timing(scale, { toValue: 0.6, duration: OUT_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start(loop);
      });
    };
    loop();
    return () => {
      alive = false;
      scale.stopAnimation();
    };
  }, [running, scale]);

  // count down once a second
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setState((st) => {
        const left = st.left - 1000;
        return left <= 0 ? { ...st, status: "done", left: 0, used: st.used + 1000 } : { ...st, left, used: st.used + 1000 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const finish = (used) => {
    const minutes = Math.max(1, Math.round(used / 60000));
    addActivity({ kind: "meditation", minutes, title: "Quiet meditation" });
    back();
  };

  useEffect(() => {
    if (state.status === "done") finish(state.used);
  }, [state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Serif size={24} accessibilityRole="header">
          Quiet meditation
        </Serif>
      </View>

      {state.status === "ready" && (
        <>
          <Body size={14} style={{ marginTop: 18 }}>
            Sit or lie comfortably. Follow the circle: breathe in as it grows, out as it settles.
          </Body>
          <View style={[s.row, { gap: 8, flexWrap: "wrap", marginTop: 16 }]}>
            {LENGTHS.map((m) => (
              <Chip
                key={m}
                label={`${m} min`}
                selected={length === m}
                onPress={() => {
                  setLength(m);
                  setState((st) => ({ ...st, left: m * 60000 }));
                }}
              />
            ))}
          </View>
        </>
      )}

      <View style={styles.stage}>
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} accessibilityElementsHidden importantForAccessibility="no" />
        <View style={styles.centre}>
          <Text style={styles.breath} accessibilityLiveRegion="polite">
            {running ? breath : state.status === "paused" ? "Paused" : "Ready when you are"}
          </Text>
          <Text style={styles.time} testID="meditation-time">
            {clock(state.left)}
          </Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {state.status === "ready" && (
          <Pressable
            onPress={() => setState((st) => ({ ...st, status: "running", startedAt: Date.now() }))}
            accessibilityRole="button"
            accessibilityLabel="Begin"
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Begin</Text>
          </Pressable>
        )}
        {(running || state.status === "paused") && (
          <>
            <Pressable
              onPress={() => setState((st) => ({ ...st, status: running ? "paused" : "running" }))}
              accessibilityRole="button"
              accessibilityLabel={running ? "Pause" : "Carry on"}
              style={styles.primary}
            >
              <Text style={styles.primaryText}>{running ? "Pause" : "Carry on"}</Text>
            </Pressable>
            <Pressable onPress={() => finish(state.used)} accessibilityRole="button" accessibilityLabel="Finish now" style={styles.ghost}>
              <Text style={styles.ghostText}>Finish now</Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { height: 300, alignItems: "center", justifyContent: "center", marginVertical: 18 },
  circle: { position: "absolute", width: 260, height: 260, backgroundColor: "rgba(91,107,74,0.22)", borderWidth: 1.5, borderColor: OLIVE },
  centre: { alignItems: "center" },
  breath: { fontFamily: F.serifItalic, fontSize: 22, color: T.ink },
  time: { fontFamily: F.sans, fontSize: 15, color: T.inkSoft, marginTop: 6 },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  ghost: { minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  ghostText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
});
