import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Moon, Activity, UtensilsCrossed, Check, Lock } from "lucide-react-native";
import { T, tone } from "./theme";
import { Body } from "./kit";

/* What the user wants Selena to follow. The cycle is the spine of every
   recommendation, so it is always on; training and nutrition are optional. */

export const DEFAULT_TRACKING = { training: true, nutrition: true };

const CHOICES = [
  { key: "cycle", icon: Moon, label: "Cycle", sub: "Phases, symptoms, mood and energy. Always on: everything else follows your rhythm.", locked: true },
  { key: "training", icon: Activity, label: "Training", sub: "Daily movement plan, session timer and recovery." },
  { key: "nutrition", icon: UtensilsCrossed, label: "Nutrition", sub: "Fuel log, protein and the Luteal Buffer." },
];

export const TrackChoices = ({ value = DEFAULT_TRACKING, onChange, dark = false }) => {
  const c = tone(dark);
  return (
    <View style={{ gap: 10 }}>
      {CHOICES.map(({ key, icon: Icon, label, sub, locked }) => {
        const on = locked || value[key];
        return (
          <Pressable
            key={key}
            onPress={locked ? undefined : () => onChange({ ...value, [key]: !value[key] })}
            disabled={locked}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled: !!locked }}
            accessibilityLabel={locked ? `${label}, always on` : label}
            style={[styles.row, { borderColor: on ? T.sage : c.hair, backgroundColor: on ? (dark ? c.surfaceDeep : T.canvasDeep) : c.surface }]}
          >
            <Icon size={20} color={c.text} strokeWidth={1.6} />
            <View style={{ flex: 1 }}>
              <Body size={14.5} weight="medium" color={c.text}>
                {label}
              </Body>
              <Body size={12} color={c.textSoft}>
                {sub}
              </Body>
            </View>
            <View style={[styles.box, on && { backgroundColor: T.sage, borderColor: T.sage }]}>
              {locked ? <Lock size={12} color={T.canvas} /> : on && <Check size={14} color={T.canvas} strokeWidth={2.6} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12 },
  box: { width: 24, height: 24, borderWidth: 1.5, borderColor: T.inkSoft, alignItems: "center", justifyContent: "center" },
});
