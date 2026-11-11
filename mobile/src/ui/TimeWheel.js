import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { T, F } from "./theme";

/* ---------------------------------------------------------------
   TIME WHEEL — how long something took, scrolled to the exact minute:
   an hours wheel and a minutes wheel, like the phone's own timer.
   --------------------------------------------------------------- */

const HOURS = Array.from({ length: 6 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export const TimeWheel = ({ minutes, onChange, testID = "time-wheel" }) => {
  const total = Math.max(0, Math.min(5 * 60 + 59, Math.round(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return (
    <View style={styles.wrap} testID={testID}>
      <Picker style={styles.wheel} itemStyle={styles.item} selectedValue={h} onValueChange={(v) => onChange(Number(v) * 60 + m)} accessibilityLabel="Hours">
        {HOURS.map((i) => (
          <Picker.Item key={i} label={String(i)} value={i} />
        ))}
      </Picker>
      <Text style={styles.unit}>h</Text>
      <Picker style={styles.wheel} itemStyle={styles.item} selectedValue={m} onValueChange={(v) => onChange(h * 60 + Number(v))} accessibilityLabel="Minutes">
        {MINUTES.map((i) => (
          <Picker.Item key={i} label={String(i).padStart(2, "0")} value={i} />
        ))}
      </Picker>
      <Text style={styles.unit}>min</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  wheel: { width: 96 },
  item: { fontFamily: F.sans, fontSize: 21, color: T.ink },
  unit: { fontFamily: F.sansMed, fontSize: 15, color: T.inkSoft, marginRight: 8 },
});
