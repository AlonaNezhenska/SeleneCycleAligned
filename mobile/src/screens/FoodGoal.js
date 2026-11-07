import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, ChevronDown, ChevronUp, Info } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { DEFAULT_GOAL } from "../lib/food";
import { ACTIVITY, AIMS, DIETS, NHS_WOMAN_KCAL, goalFromBody, macrosFor, kgFromStones, cmFromFeet, ageFromGroup } from "../lib/energy";
import { DEFAULT_STEP_GOAL } from "../lib/activity";
import { OLIVE } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Card, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   YOUR GOALS — energy and macros worked out from the body, or typed in
   by hand, shared out by an eating style; and a daily steps goal.

   Weight, height and age give an estimate; tape measurements are
   optional and make it follow the user's build. Anyone who would
   rather not share these can skip straight to her own numbers. Body
   details stay on this phone and are never backed up.
   --------------------------------------------------------------- */

const fmt = (n) => Math.round(n).toLocaleString("en-GB");
const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const str = (v) => (v ? String(v) : "");

const Input = ({ label, value, onChange, unit, width = 90 }) => (
  <View style={[s.row, { gap: 6 }]}>
    <TextInput
      value={value}
      onChangeText={(v) => onChange(v.replace(/[^\d.,]/g, ""))}
      keyboardType="decimal-pad"
      accessibilityLabel={label}
      style={[styles.input, { width }]}
    />
    <Body size={13}>{unit}</Body>
  </View>
);

const Row = ({ label, children }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {children}
  </View>
);

export function FoodGoal() {
  const { profile, setProfile } = useApp();
  const saved = { ...DEFAULT_GOAL, ...profile.nutritionGoal };
  const b = profile.body ?? {};
  const [mode, setMode] = useState(profile.goalMode ?? "body");
  const [weightUnit, setWeightUnit] = useState(b.weightUnit ?? "kg");
  const [heightUnit, setHeightUnit] = useState(b.heightUnit ?? "cm");
  const [f, setF] = useState({
    kg: str(b.kg),
    st: str(b.st),
    lb: str(b.lb),
    cm: str(b.cm),
    ft: str(b.ft),
    inch: str(b.inch),
    age: str(b.age ?? ageFromGroup(profile.ageGroup)),
    activity: b.activity ?? "light",
    aim: b.aim ?? "maintain",
    waist: str(b.waist),
    hip: str(b.hip),
    neck: str(b.neck),
  });
  const [tape, setTape] = useState(!!(b.waist || b.hip || b.neck));
  const [diet, setDiet] = useState(profile.diet ?? "balanced");
  const [stepGoal, setStepGoal] = useState(String(profile.stepGoal ?? DEFAULT_STEP_GOAL));
  const steps = Math.round(num(stepGoal)) || DEFAULT_STEP_GOAL;
  const [own, setOwn] = useState({ kcal: String(saved.kcal), protein: String(saved.protein), carbs: String(saved.carbs), fat: String(saved.fat) });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));

  const kg = weightUnit === "kg" ? num(f.kg) : kgFromStones(num(f.st), num(f.lb));
  const cm = heightUnit === "cm" ? num(f.cm) : cmFromFeet(num(f.ft), num(f.inch));
  const result = goalFromBody({
    kg,
    cm,
    age: num(f.age),
    activity: f.activity,
    aim: f.aim,
    diet,
    ...(tape ? { waist: num(f.waist), hip: num(f.hip), neck: num(f.neck) } : {}),
  });

  const useBody = () => {
    if (!result) return;
    setProfile({
      goalMode: "body",
      diet,
      stepGoal: steps,
      nutritionGoal: { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat },
      body: {
        weightUnit,
        heightUnit,
        kg: Math.round(kg * 10) / 10,
        cm: Math.round(cm),
        st: num(f.st) || null,
        lb: num(f.lb) || null,
        ft: num(f.ft) || null,
        inch: num(f.inch) || null,
        age: num(f.age),
        activity: f.activity,
        aim: f.aim,
        waist: tape ? num(f.waist) || null : null,
        hip: tape ? num(f.hip) || null : null,
        neck: tape ? num(f.neck) || null : null,
      },
    });
    back();
  };
  const useOwn = () => {
    const g = { kcal: num(own.kcal), protein: num(own.protein), carbs: num(own.carbs), fat: num(own.fat) };
    if (!g.kcal) return;
    setProfile({ goalMode: "own", nutritionGoal: g, diet, stepGoal: steps });
    back();
  };

  return (
    <Screen>
      <View style={[s.row, { gap: 12 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Serif size={24} accessibilityRole="header">
          Your goals
        </Serif>
      </View>

      <Card style={[s.row, { alignItems: "flex-start", gap: 12, marginTop: 16 }]} testID="nhs-note">
        <Info size={18} color={OLIVE} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Body size={13.5} color={T.ink}>
            {`As a guide, the NHS suggests about ${fmt(NHS_WOMAN_KCAL)} kcal a day for an adult woman. Your own needs depend on your size, age and how active you are, and they shift a little through your cycle.`}
          </Body>
          <Body size={13} testID="current-goal">{`Your goal now: ${fmt(saved.kcal)} kcal · protein ${saved.protein} g · carbs ${saved.carbs} g · fat ${saved.fat} g`}</Body>
        </View>
      </Card>

      <Text style={styles.section}>EATING STYLE</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {DIETS.map((d) => {
          const on = diet === d.key;
          return (
            <Pressable
              key={d.key}
              onPress={() => setDiet(d.key)}
              accessibilityRole="radio"
              accessibilityLabel={d.label}
              accessibilityState={{ checked: on }}
              style={[styles.option, on && styles.optionOn]}
            >
              <Text style={[styles.optionTitle, on && { color: T.canvas }]}>{d.label}</Text>
              <Text style={[styles.optionSub, on && { color: T.canvas }]}>{d.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <Row label="Steps a day">
        <Input label="Steps goal" value={stepGoal} onChange={setStepGoal} unit="steps" width={90} />
      </Row>

      <View style={styles.switch} accessibilityRole="tablist">
        {[
          ["body", "Work it out for me"],
          ["own", "I'll set my own"],
        ].map(([k, label]) => (
          <Pressable
            key={k}
            onPress={() => setMode(k)}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: mode === k }}
            style={[styles.switchItem, mode === k && styles.switchOn]}
          >
            <Text style={{ fontFamily: F.sansMed, fontSize: 13, color: mode === k ? T.canvas : T.ink }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "body" ? (
        <>
          <Body size={13} style={{ marginBottom: 10 }}>
            Your weight, height and measurements stay on this phone and are never backed up. Prefer not to share them? Set your own goal instead.
          </Body>

          <Row label="Weight">
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              {weightUnit === "kg" ? (
                <Input label="Weight in kilograms" value={f.kg} onChange={set("kg")} unit="kg" />
              ) : (
                <View style={[s.row, { gap: 10 }]}>
                  <Input label="Weight, stones" value={f.st} onChange={set("st")} unit="st" width={56} />
                  <Input label="Weight, pounds" value={f.lb} onChange={set("lb")} unit="lb" width={56} />
                </View>
              )}
              <View style={[s.row, { gap: 6 }]}>
                <Chip label="kg" selected={weightUnit === "kg"} onPress={() => setWeightUnit("kg")} />
                <Chip label="st & lb" selected={weightUnit === "st"} onPress={() => setWeightUnit("st")} />
              </View>
            </View>
          </Row>

          <Row label="Height">
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              {heightUnit === "cm" ? (
                <Input label="Height in centimetres" value={f.cm} onChange={set("cm")} unit="cm" />
              ) : (
                <View style={[s.row, { gap: 10 }]}>
                  <Input label="Height, feet" value={f.ft} onChange={set("ft")} unit="ft" width={56} />
                  <Input label="Height, inches" value={f.inch} onChange={set("inch")} unit="in" width={56} />
                </View>
              )}
              <View style={[s.row, { gap: 6 }]}>
                <Chip label="cm" selected={heightUnit === "cm"} onPress={() => setHeightUnit("cm")} />
                <Chip label="ft & in" selected={heightUnit === "ft"} onPress={() => setHeightUnit("ft")} />
              </View>
            </View>
          </Row>

          <Row label="Age">
            <Input label="Age in years" value={f.age} onChange={set("age")} unit="years" width={70} />
          </Row>

          <Text style={styles.section}>HOW ACTIVE ARE YOU?</Text>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {ACTIVITY.map((a) => {
              const on = f.activity === a.key;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => set("activity")(a.key)}
                  accessibilityRole="radio"
                  accessibilityLabel={a.label}
                  accessibilityState={{ checked: on }}
                  style={[styles.option, on && styles.optionOn]}
                >
                  <Text style={[styles.optionTitle, on && { color: T.canvas }]}>{a.label}</Text>
                  <Text style={[styles.optionSub, on && { color: T.canvas }]}>{a.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>YOUR AIM</Text>
          <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
            {AIMS.map((a) => (
              <Chip key={a.key} label={a.label} selected={f.aim === a.key} onPress={() => set("aim")(a.key)} />
            ))}
          </View>

          <Pressable
            onPress={() => setTape(!tape)}
            accessibilityRole="button"
            accessibilityLabel={tape ? "Leave out measurements" : "Add measurements (optional)"}
            accessibilityState={{ expanded: tape }}
            style={[s.row, { gap: 6, minHeight: 48, marginTop: 14 }]}
          >
            {tape ? <ChevronUp size={16} color={OLIVE} /> : <ChevronDown size={16} color={OLIVE} />}
            <Text style={{ fontFamily: F.sansMed, fontSize: 14, color: OLIVE }}>{tape ? "Leave out measurements" : "Add measurements (optional)"}</Text>
          </Pressable>
          {tape && (
            <>
              <Body size={12.5} style={{ marginBottom: 6 }}>
                With a soft tape: waist at its narrowest, hips at their widest, neck just below the voice box. With all three, the estimate follows your own build.
              </Body>
              <Row label="Waist">
                <Input label="Waist in centimetres" value={f.waist} onChange={set("waist")} unit="cm" />
              </Row>
              <Row label="Hips">
                <Input label="Hips in centimetres" value={f.hip} onChange={set("hip")} unit="cm" />
              </Row>
              <Row label="Neck">
                <Input label="Neck in centimetres" value={f.neck} onChange={set("neck")} unit="cm" />
              </Row>
            </>
          )}

          <Card style={{ marginTop: 16, gap: 6 }} testID="goal-result">
            {result ? (
              <>
                <Text style={styles.resultBig}>{`About ${fmt(result.kcal)} kcal a day`}</Text>
                <Body size={13.5} color={T.ink}>{`Protein ${result.protein} g · carbs ${result.carbs} g · fat ${result.fat} g`}</Body>
                <Body size={12.5}>
                  {`Your body uses about ${fmt(result.resting)} kcal at rest and ${fmt(result.daily)} kcal on an ordinary day${
                    result.bodyFat != null ? ", worked out from your measurements" : ""
                  }.${f.aim === "lose" ? " A gentle loss goal never goes below what your body needs at rest." : ""}`}
                </Body>
              </>
            ) : (
              <Body size={13.5}>Add your weight, height and age to see your goal.</Body>
            )}
          </Card>

          <Pressable
            onPress={useBody}
            disabled={!result}
            accessibilityRole="button"
            accessibilityLabel="Use this goal"
            accessibilityState={{ disabled: !result }}
            style={[styles.primary, !result && { opacity: 0.45 }]}
          >
            <Text style={styles.primaryText}>Use this goal</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Body size={13} style={{ marginBottom: 10 }}>
            Type the numbers that feel right for you. You can change them any time.
          </Body>
          {[
            ["kcal", "Energy", "kcal"],
            ["protein", "Protein", "g"],
            ["carbs", "Carbs", "g"],
            ["fat", "Fat", "g"],
          ].map(([k, label, unit]) => (
            <Row key={k} label={label}>
              <Input label={`${label} goal`} value={own[k]} onChange={(v) => setOwn((o) => ({ ...o, [k]: v }))} unit={unit} />
            </Row>
          ))}
          <Pressable
            onPress={() => {
              const m = macrosFor(num(own.kcal), { diet, kg: profile.body?.kg ?? 0 });
              setOwn((o) => ({ ...o, protein: String(m.protein), carbs: String(m.carbs), fat: String(m.fat) }));
            }}
            accessibilityRole="button"
            accessibilityLabel="Share my energy by eating style"
            style={styles.ghost}
          >
            <Text style={styles.ghostText}>Share my energy by eating style</Text>
          </Pressable>
          <Pressable onPress={useOwn} accessibilityRole="button" accessibilityLabel="Save goal" style={styles.primary}>
            <Text style={styles.primaryText}>Save goal</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: { flexDirection: "row", alignSelf: "center", padding: 4, backgroundColor: T.canvasDeep, marginTop: 18, marginBottom: 16 },
  switchItem: { minHeight: 40, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  switchOn: { backgroundColor: T.ink },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 56, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  rowLabel: { fontFamily: F.sansMed, fontSize: 15, color: T.ink },
  input: { minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sansMed, fontSize: 16, color: T.ink, textAlign: "right" },
  section: { fontFamily: F.serif, fontSize: 13, letterSpacing: 2.4, color: T.inkSoft, marginTop: 20, marginBottom: 8 },
  option: { padding: 14, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface },
  optionOn: { backgroundColor: OLIVE, borderColor: OLIVE },
  optionTitle: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  optionSub: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft, marginTop: 2 },
  resultBig: { fontFamily: F.serif, fontSize: 22, color: T.ink },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center", marginTop: 16 },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  ghost: { minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center", marginTop: 16 },
  ghostText: { fontFamily: F.sansMed, fontSize: 14, color: T.ink },
});
