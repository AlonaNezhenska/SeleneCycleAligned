import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { MEALS, MEAL } from "../lib/food";
import { Calendar } from "./Calendar";
import { OLIVE, dayLabel } from "./food";
import { T, F } from "./theme";
import { Body, Chip, s } from "./kit";

/* ---------------------------------------------------------------
   COPY TO — pick a meal and a day (back in time, or ahead to plan),
   and the chosen foods are added there too.
   --------------------------------------------------------------- */

const shift = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const CopySheet = ({ visible, count, fromMeal, fromDate, todayKey, onCopy, onClose }) => {
  const [meal, setMeal] = useState(fromMeal);
  const [date, setDate] = useState(fromDate);
  useEffect(() => {
    if (visible) {
      setMeal(fromMeal);
      setDate(fromDate === todayKey ? shift(todayKey, 1) : todayKey);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const quick = [
    [shift(todayKey, -1), "Yesterday"],
    [todayKey, "Today"],
    [shift(todayKey, 1), "Tomorrow"],
  ];
  const same = meal === fromMeal && date === fromDate;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.page} testID="copy-sheet">
        <View style={[s.row, { justifyContent: "space-between", marginBottom: 8 }]}>
          <Text style={styles.title}>{`Copy ${count} ${count === 1 ? "food" : "foods"} to…`}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <X size={20} color={T.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={styles.label}>Meal</Text>
          <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
            {MEALS.map((m) => (
              <Chip key={m.key} label={m.label} selected={meal === m.key} onPress={() => setMeal(m.key)} />
            ))}
          </View>
          <Text style={styles.label}>Day</Text>
          <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 10 }]}>
            {quick.map(([d, label]) => (
              <Chip key={d} label={label} selected={date === d} onPress={() => setDate(d)} />
            ))}
          </View>
          {/* any day back in time, or up to a month ahead to plan */}
          <Calendar mode="single" value={date} maxDate={shift(todayKey, 30)} onChange={setDate} />
          <Body size={13} style={{ marginTop: 12 }}>{`${MEAL[meal].label}, ${dayLabel(date, todayKey)}`}</Body>
        </ScrollView>
        <Pressable
          onPress={() => onCopy({ meal, date })}
          disabled={same}
          accessibilityRole="button"
          accessibilityLabel="Copy here"
          accessibilityState={{ disabled: same }}
          style={[styles.primary, same && { opacity: 0.45 }]}
        >
          <Text style={styles.primaryText}>Copy here</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.canvas, padding: 20 },
  title: { fontFamily: F.serif, fontSize: 22, color: T.ink, flex: 1 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.hair },
  label: { fontFamily: F.sansMed, fontSize: 13, color: T.inkSoft, marginTop: 16, marginBottom: 8 },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
});
