import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, Linking, Platform, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Pedometer } from "expo-sensors";
import { Footprints, Flame, Plus, Trash2, Flower2, Wind, Play, Camera, Sparkles, X } from "lucide-react-native";
import { KIND, dayMovement, weightOf, caloriesFor, PHASE_PRACTICE, youTubeSearch, DEFAULT_STEP_GOAL } from "../lib/activity";
import { Bar, OLIVE } from "./food";
import { T, F } from "./theme";
import { Card, Body, SectionLabel, s } from "./kit";
import { MinutesSheet } from "./workout";

/* ---------------------------------------------------------------
   ACTIVITY PIECES — today's movement, the yoga and meditation area,
   encouragement and the gentle photo nudge, for the Workouts tab.
   --------------------------------------------------------------- */

const fmt = (n) => Math.round(n).toLocaleString("en-GB");

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Read today's steps from the iPhone's motion sensor, if allowed. */
export const useIphoneSteps = (onSteps) => {
  const [state, setState] = useState("idle");
  // the latest callback, so reading never re-runs just because the screen re-rendered
  const save = useRef(onSteps);
  save.current = onSteps;
  const read = useCallback(
    async (ask) => {
      try {
        if (Platform.OS !== "ios" || !(await Pedometer.isAvailableAsync())) return setState("unavailable");
        const perm = ask ? await Pedometer.requestPermissionsAsync() : await Pedometer.getPermissionsAsync?.();
        if (!perm?.granted) return setState(ask ? "denied" : "idle");
        const { steps } = await Pedometer.getStepCountAsync(startOfDay(), new Date());
        save.current(steps);
        setState("done");
      } catch {
        setState("unavailable");
      }
    },
    []
  );
  // quietly refresh when access was already given
  useEffect(() => {
    read(false);
  }, [read]);
  return { state, read: () => read(true) };
};

/** Today's movement: steps, energy burned, and what was logged. */
export const TodayActivity = ({ day, profile, hidden, onSteps, onRemove, onEdit, date }) => {
  const kg = weightOf(profile);
  const m = dayMovement(day, kg);
  const goal = profile.stepGoal ?? DEFAULT_STEP_GOAL;
  const [editing, setEditing] = useState(false);
  const [changing, setChanging] = useState(null);
  const [typed, setTyped] = useState("");
  const phone = useIphoneSteps(onSteps);

  return (
    <Card style={{ marginBottom: 14, gap: 12 }} testID="today-activity">
      <SectionLabel>Today's activity</SectionLabel>

      <View style={[s.row, { gap: 12 }]}>
        <View style={styles.disc}>
          <Footprints size={18} color={T.canvas} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Body size={14} weight="medium" color={T.ink}>
              Steps
            </Body>
            {!hidden && (
              <Text style={styles.value} testID="steps-value">{`${fmt(m.steps)} / ${fmt(goal)}`}</Text>
            )}
          </View>
          <Bar value={m.steps} goal={goal} />
        </View>
      </View>

      <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
        {Platform.OS === "ios" && phone.state !== "unavailable" && (
          <Pressable onPress={phone.read} accessibilityRole="button" accessibilityLabel="Get steps from iPhone" style={styles.pill}>
            <Text style={styles.pillText}>{phone.state === "done" ? "Update from iPhone" : "Get steps from iPhone"}</Text>
          </Pressable>
        )}
        <Pressable onPress={() => setEditing(!editing)} accessibilityRole="button" accessibilityLabel="Type your steps" style={styles.pill}>
          <Text style={styles.pillText}>Type steps</Text>
        </Pressable>
      </View>
      {phone.state === "denied" && <Body size={12.5}>Motion access is off. You can allow it in Settings, or type your steps.</Body>}
      {editing && (
        <View style={[s.row, { gap: 8 }]}>
          <TextInput
            value={typed}
            onChangeText={(v) => setTyped(v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            placeholder="Steps today"
            placeholderTextColor={T.inkSoft}
            accessibilityLabel="Steps today"
            style={styles.input}
          />
          <Pressable
            onPress={() => {
              onSteps(parseInt(typed, 10) || 0);
              setEditing(false);
              setTyped("");
            }}
            accessibilityRole="button"
            accessibilityLabel="Save steps"
            style={[styles.pill, { backgroundColor: OLIVE, borderColor: OLIVE }]}
          >
            <Text style={[styles.pillText, { color: T.canvas }]}>Save</Text>
          </Pressable>
        </View>
      )}

      {!hidden && (
        <View style={[s.row, { gap: 12 }]} testID="burned">
          <View style={[styles.disc, { backgroundColor: T.terracotta }]}>
            <Flame size={18} color={T.canvas} />
          </View>
          <View style={{ flex: 1 }}>
            <Body size={14} weight="medium" color={T.ink}>{`About ${fmt(m.kcal)} kcal burned`}</Body>
            <Body size={12}>
              {`${fmt(m.stepKcal)} from steps, ${fmt(m.activityKcal)} from activities${profile.body?.kg ? "" : " · add your weight in Profile for a closer estimate"}`}
            </Body>
          </View>
        </View>
      )}

      {m.list.map((a) => (
        <View key={a.id} style={[s.row, styles.item]}>
          <Pressable
            onPress={() => (a.workoutId ? router.push({ pathname: "/workout/history/[id]", params: { id: a.workoutId } }) : onEdit && a.source === "activity" ? setChanging(a) : null)}
            disabled={!a.workoutId && !(onEdit && a.source === "activity")}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${a.title || KIND[a.kind]?.label}`}
            style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
          >
            <Text style={styles.itemName} numberOfLines={1}>
              {a.title || KIND[a.kind]?.label}
            </Text>
            <Body size={12.5}>
              {[`${KIND[a.kind]?.label} · ${a.minutes} min`, !hidden && KIND[a.kind]?.met ? `${caloriesFor(a, kg)} kcal` : null, a.source === "tracker" ? "from your tracker" : null]
                .filter(Boolean)
                .join(" · ")}
            </Body>
          </Pressable>
          {a.url && (
            <Pressable onPress={() => Linking.openURL(a.url)} accessibilityRole="button" accessibilityLabel={`Open video: ${a.title || "video"}`} hitSlop={6} style={styles.iconBtn}>
              <Play size={16} color={T.ink} />
            </Pressable>
          )}
          {a.source === "activity" && (
            <Pressable onPress={() => onRemove(a.id)} accessibilityRole="button" accessibilityLabel={`Remove ${a.title || KIND[a.kind]?.label}`} hitSlop={6} style={styles.iconBtn}>
              <Trash2 size={15} color={T.inkSoft} />
            </Pressable>
          )}
        </View>
      ))}
      <Body size={12.5}>Did something else? Add it from Start workout, under "Log something you did".</Body>

      <MinutesSheet
        visible={!!changing}
        title={changing ? `How long was ${(changing.title || KIND[changing.kind]?.label || "it").toLowerCase()}?` : ""}
        minutes={changing?.minutes ?? 30}
        onClose={() => setChanging(null)}
        onSave={(minutes) => {
          onEdit(changing.id, { minutes });
          setChanging(null);
        }}
      />

    </Card>
  );
};

/** Yoga and meditation for this phase, a video of her own, or a quiet timer. */
export const YogaMeditation = ({ phase }) => {
  const p = PHASE_PRACTICE[phase] ?? PHASE_PRACTICE.follicular;
  const Row = ({ icon: Icon, title, sub, onPress, label }) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label ?? title} style={[s.row, styles.practice]}>
      <View style={[styles.disc, { backgroundColor: OLIVE }]}>
        <Icon size={18} color={T.canvas} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{title}</Text>
        <Body size={12.5}>{sub}</Body>
      </View>
    </Pressable>
  );
  return (
    <View style={{ marginBottom: 14 }} testID="yoga-meditation">
      <SectionLabel>Yoga & meditation</SectionLabel>
      <View style={{ gap: 10, marginTop: 6 }}>
        <Row icon={Flower2} title={p.yoga.title} sub={`${p.yoga.sub} Opens YouTube.`} onPress={() => Linking.openURL(youTubeSearch(p.yoga.search))} />
        <Row icon={Wind} title={p.meditation.title} sub={`${p.meditation.sub} Opens YouTube.`} onPress={() => Linking.openURL(youTubeSearch(p.meditation.search))} />
        <Row icon={Sparkles} title="Quiet meditation timer" sub="A breathing guide and timer, right here." onPress={() => router.push("/meditate")} />
        <Row
          icon={Play}
          title="Log a yoga video"
          sub="Paste a YouTube link and how long you practised."
          onPress={() => router.push({ pathname: "/activity/add", params: { kind: "yoga" } })}
        />
      </View>
    </View>
  );
};

export const Encouragement = ({ message }) =>
  message ? (
    <Card style={[s.row, styles.encourage]} accessibilityLiveRegion="polite" testID="encouragement">
      <Sparkles size={20} color={OLIVE} />
      <View style={{ flex: 1 }}>
        <Text style={styles.encourageTitle}>{message.title}</Text>
        <Body size={13} color={T.ink}>
          {message.body}
        </Body>
      </View>
    </Card>
  ) : null;

/** After moving, a soft offer to take a progress photo, if she asked for it. */
export const PhotoNudge = ({ onTake, onDismiss }) => (
  <Card style={[s.row, { gap: 12, marginBottom: 14 }]} testID="photo-nudge">
    <Camera size={20} color={OLIVE} />
    <View style={{ flex: 1 }}>
      <Text style={styles.encourageTitle}>A progress photo?</Text>
      <Body size={12.5}>You asked for a little reminder after training. Only if you feel like it.</Body>
      <View style={[s.row, { gap: 8, marginTop: 8 }]}>
        <Pressable onPress={onTake} accessibilityRole="button" accessibilityLabel="Take a progress photo" style={[styles.pill, { backgroundColor: OLIVE, borderColor: OLIVE }]}>
          <Text style={[styles.pillText, { color: T.canvas }]}>Take a photo</Text>
        </Pressable>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Not today" style={styles.pill}>
          <Text style={styles.pillText}>Not today</Text>
        </Pressable>
      </View>
    </View>
    <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
      <X size={16} color={T.inkSoft} />
    </Pressable>
  </Card>
);

const styles = StyleSheet.create({
  disc: { width: 38, height: 38, backgroundColor: T.sage, alignItems: "center", justifyContent: "center" },
  value: { fontFamily: F.sans, fontSize: 13, color: T.inkSoft },
  pill: { minHeight: 40, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  pillText: { fontFamily: F.sansMed, fontSize: 12.5, color: T.ink },
  input: { flex: 1, minHeight: 44, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 15, color: T.ink },
  item: { gap: 8, minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.hair, paddingTop: 8 },
  itemName: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  add: { flexDirection: "row", gap: 8, minHeight: 48, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  addText: { fontFamily: F.sansMed, fontSize: 15, color: T.canvas },
  practice: { gap: 12, padding: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  encourage: { gap: 12, alignItems: "flex-start", marginBottom: 14, backgroundColor: "#EEF0E2", borderColor: "#D6DABF" },
  encourageTitle: { fontFamily: F.serif, fontSize: 18, color: T.ink, marginBottom: 2 },
});
