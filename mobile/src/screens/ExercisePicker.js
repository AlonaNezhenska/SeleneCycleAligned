import React, { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, ScrollView, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Search, Check, Info, X } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { findExercises, exerciseById, EQUIPMENT, MUSCLES, muscleLabel, equipmentLabel, customExercise } from "../lib/exercises";
import { entryFrom } from "../lib/workout";
import { newId } from "../lib/food";
import { sendPicked } from "../state/pickBus";
import { BodyThumb } from "../ui/BodyFigure";
import { OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Body, Chip, s } from "../ui/kit";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------------------------------------------------------
   ADD EXERCISE — the library, searchable and filtered by equipment
   and muscle, with her recent exercises first. Pick several at once.
   Opened from a workout, a routine, or just to browse.
   --------------------------------------------------------------- */

const TYPES = [
  ["weight", "Weight × reps"],
  ["reps", "Reps only"],
  ["duration", "Time"],
];

const Row = ({ ex, picked, onPress, onInfo }) => (
  <View style={[s.row, styles.row]}>
    <Pressable onPress={onPress} accessibilityRole={picked == null ? "button" : "checkbox"} accessibilityLabel={ex.name} accessibilityState={picked == null ? undefined : { checked: picked }} style={[s.row, { flex: 1, gap: 12 }]}>
      <BodyThumb primary={ex.p} secondary={ex.s} size={52} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={2}>
          {ex.name}
        </Text>
        <Body size={12.5}>{[(ex.p ?? []).map(muscleLabel).join(", "), equipmentLabel(ex.eq)].filter(Boolean).join(" · ")}</Body>
      </View>
      {picked && (
        <View style={styles.check}>
          <Check size={14} color={T.canvas} strokeWidth={2.6} />
        </View>
      )}
    </Pressable>
    <Pressable onPress={onInfo} accessibilityRole="button" accessibilityLabel={`About ${ex.name}`} hitSlop={6} style={styles.info}>
      <Info size={18} color={T.inkSoft} />
    </Pressable>
  </View>
);

export function ExercisePicker() {
  const params = useLocalSearchParams();
  const mode = params.for === "workout" || params.for === "routine" ? params.for : "browse";
  const { workouts, customExercises, updateWorkout, addCustomExercise } = useApp();
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState(null);
  const [muscle, setMuscle] = useState(null);
  const [picked, setPicked] = useState([]);
  const [creating, setCreating] = useState(null);
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

  const recent = useMemo(() => {
    const ids = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.id)))].slice(0, 12);
    return ids.map((id) => exerciseById(id, customExercises)).filter(Boolean);
  }, [workouts, customExercises]);
  const filtering = query.trim() || equipment || muscle;
  const results = useMemo(() => findExercises({ query, equipment, muscle, custom: customExercises, limit: 120 }), [query, equipment, muscle, customExercises]);
  const list = filtering ? results : [...recent, ...results.filter((r) => !recent.some((x) => x.id === r.id))];

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const add = () => {
    if (mode === "workout") updateWorkout((w) => ({ ...w, exercises: [...w.exercises, ...picked.map((id) => entryFrom({ id, sets: 3 }, customExercises))] }));
    if (mode === "routine") sendPicked(picked);
    close();
  };
  const open = (ex) => router.push({ pathname: "/workout/exercise/[id]", params: { id: ex.id } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.canvas }} edges={["top"]}>
      <View style={[s.row, styles.header]}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Cancel" style={styles.headBtn}>
          <Text style={styles.headBtnText}>{mode === "browse" ? "Back" : "Cancel"}</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          {mode === "browse" ? "Exercises" : "Add exercise"}
        </Text>
        <Pressable onPress={() => setCreating({ name: query, eq: "other", p: [], type: "weight" })} accessibilityRole="button" accessibilityLabel="Create exercise" style={styles.headBtn}>
          <Text style={styles.headBtnText}>Create</Text>
        </Pressable>
      </View>

      <View style={[s.row, styles.search]}>
        <Search size={18} color={T.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercise"
          placeholderTextColor={T.inkSoft}
          accessibilityLabel="Search exercise"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <X size={16} color={T.inkSoft} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
        <Chip label="All equipment" selected={!equipment} onPress={() => setEquipment(null)} />
        {Object.entries(EQUIPMENT).map(([k, label]) => (
          <Chip key={k} label={label} selected={equipment === k} onPress={() => setEquipment(equipment === k ? null : k)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0 }}>
        <Chip label="All muscles" selected={!muscle} onPress={() => setMuscle(null)} />
        {Object.entries(MUSCLES).map(([k, label]) => (
          <Chip key={k} label={label} selected={muscle === k} onPress={() => setMuscle(muscle === k ? null : k)} />
        ))}
      </ScrollView>

      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        ListHeaderComponent={!filtering && recent.length ? <Text style={styles.section}>Recent exercises</Text> : null}
        ListEmptyComponent={<Body style={{ paddingVertical: 20 }}>No exercise found. Create it with "Create".</Body>}
        renderItem={({ item }) => (
          <Row ex={item} picked={mode === "browse" ? null : picked.includes(item.id)} onPress={() => (mode === "browse" ? open(item) : toggle(item.id))} onInfo={() => open(item)} />
        )}
        testID="exercise-list"
      />

      {mode !== "browse" && picked.length > 0 && (
        <View style={styles.footer}>
          <Pressable onPress={add} accessibilityRole="button" accessibilityLabel={`Add ${picked.length} exercise${picked.length === 1 ? "" : "s"}`} style={styles.addBtn}>
            <Text style={styles.addText}>{`Add ${picked.length} exercise${picked.length === 1 ? "" : "s"}`}</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={!!creating} transparent animationType="slide" onRequestClose={() => setCreating(null)}>
        <View style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setCreating(null)} accessibilityRole="button" accessibilityLabel="Close" />
          {creating && (
            <ScrollView style={styles.sheet} contentContainerStyle={{ gap: 10, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>New exercise</Text>
              <TextInput
                value={creating.name}
                onChangeText={(name) => setCreating((c) => ({ ...c, name }))}
                placeholder="Name"
                placeholderTextColor={T.inkSoft}
                accessibilityLabel="Exercise name"
                style={styles.input}
              />
              <Text style={styles.label}>Logged as</Text>
              <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
                {TYPES.map(([k, label]) => (
                  <Chip key={k} label={label} selected={creating.type === k} onPress={() => setCreating((c) => ({ ...c, type: k }))} />
                ))}
              </View>
              <Text style={styles.label}>Equipment</Text>
              <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
                {Object.entries(EQUIPMENT).map(([k, label]) => (
                  <Chip key={k} label={label} selected={creating.eq === k} onPress={() => setCreating((c) => ({ ...c, eq: k }))} />
                ))}
              </View>
              <Text style={styles.label}>Main muscles</Text>
              <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
                {Object.entries(MUSCLES).map(([k, label]) => (
                  <Chip
                    key={k}
                    label={label}
                    selected={creating.p.includes(k)}
                    onPress={() => setCreating((c) => ({ ...c, p: c.p.includes(k) ? c.p.filter((m) => m !== k) : [...c.p, k] }))}
                  />
                ))}
              </View>
              <Pressable
                onPress={() => {
                  const ex = customExercise({ ...creating, id: `mine:${newId()}` });
                  addCustomExercise(ex);
                  setPicked((p) => [...p, ex.id]);
                  setCreating(null);
                  setQuery("");
                }}
                disabled={!creating.name.trim()}
                accessibilityRole="button"
                accessibilityLabel="Save exercise"
                accessibilityState={{ disabled: !creating.name.trim() }}
                style={[styles.addBtn, !creating.name.trim() && { opacity: 0.45 }]}
              >
                <Text style={styles.addText}>Save exercise</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  headBtn: { minHeight: 44, minWidth: 64, paddingHorizontal: 12, borderRadius: 999, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  headBtnText: { fontFamily: F.sansMed, fontSize: 14, color: OLIVE },
  title: { fontFamily: F.serif, fontSize: 20, color: T.ink },
  search: { gap: 10, marginHorizontal: 20, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: T.canvasDeep },
  searchInput: { flex: 1, fontFamily: F.sans, fontSize: 15.5, color: T.ink, paddingVertical: 10 },
  chips: { gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  section: { fontFamily: F.sansMed, fontSize: 13, color: T.inkSoft, marginTop: 8, marginBottom: 2 },
  row: { gap: 6, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  name: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  info: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: T.canvas },
  addBtn: { minHeight: 52, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  addText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.35)" },
  sheet: { maxHeight: "80%", backgroundColor: T.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  input: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: T.hair, fontFamily: F.sans, fontSize: 15.5, color: T.ink },
  label: { fontFamily: F.sansMed, fontSize: 13, color: T.inkSoft, marginTop: 4 },
});
