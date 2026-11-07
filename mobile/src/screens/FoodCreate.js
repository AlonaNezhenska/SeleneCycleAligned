import React, { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Minus, Plus, X } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { MEAL, newId, quickEntry, foodEntry, defaultGrams, amountLabel, itemsTotal, perServing } from "../lib/food";
import { RECIPE_CATEGORIES } from "../content/recipes";
import { FoodRow, SectionTitle, useFoodSearch, kcalText, OLIVE, diaryDay } from "../ui/food";
import { FoodDetail } from "../ui/FoodDetail";
import { T, F } from "../ui/theme";
import { Screen, Body, Serif, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   CREATE — quick add, a new food, a saved meal or a recipe.

   Quick add goes straight into the diary. Foods, meals and recipes are
   saved to the user's own library on this phone, and back up with the
   food diary only if that box is ticked.
   --------------------------------------------------------------- */

const TITLES = { quick: "Quick add", food: "New food", meal: "New meal", recipe: "New recipe" };

const toNum = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const Field = ({ label, value, onChange, numeric, placeholder, multiline, unit }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={[s.row, { gap: 8 }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "decimal-pad" : "default"}
        placeholder={placeholder}
        placeholderTextColor={T.inkSoft}
        accessibilityLabel={label}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 110, textAlignVertical: "top", paddingTop: 12 }]}
      />
      {!!unit && <Body size={13}>{unit}</Body>}
    </View>
  </View>
);

/** Search and add foods to a list, each with its own amount. */
const IngredientPicker = ({ items, onChange, hidden }) => {
  const { foodLibrary } = useApp();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const { local, remote } = useFoodSearch(query, foodLibrary);
  const results = query.trim() ? [...local.foods, ...local.everyday, ...(remote.status === "done" ? remote.items : [])].slice(0, 30) : [];
  const add = (food) => {
    onChange([...items, { food, grams: defaultGrams(food, foodLibrary.recent) }]);
    setQuery("");
  };
  return (
    <View>
      {items.map((it, i) => (
        <View key={`${it.food.id}-${i}`} style={[s.row, styles.itemRow]}>
          <Pressable onPress={() => setEditing(i)} accessibilityRole="button" accessibilityLabel={`${it.food.name}, change amount`} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
            <Text style={styles.itemName}>{it.food.name}</Text>
            <Body size={12.5}>{amountLabel(it.food, it.grams)}</Body>
          </Pressable>
          <Pressable onPress={() => onChange(items.filter((_, k) => k !== i))} accessibilityRole="button" accessibilityLabel={`Remove ${it.food.name}`} hitSlop={8} style={styles.iconHit}>
            <X size={18} color={T.inkSoft} />
          </Pressable>
        </View>
      ))}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Add a food, e.g. oats"
        placeholderTextColor={T.inkSoft}
        accessibilityLabel="Find a food to add"
        autoCorrect={false}
        style={[styles.input, { marginTop: 8 }]}
      />
      {results.map((f) => (
        <FoodRow key={f.id} name={f.name} sub={[f.brand, "per 100 g"].filter(Boolean).join(", ")} kcal={f.per100.kcal} hidden={hidden} onAdd={() => add(f)} onPress={() => add(f)} />
      ))}
      {query.trim().length >= 3 && remote.status === "loading" && <Body size={12.5}>Looking through UK products…</Body>}
      <FoodDetail
        food={editing != null ? items[editing]?.food : null}
        grams={editing != null ? items[editing]?.grams : undefined}
        visible={editing != null}
        hidden={hidden}
        confirmLabel="Done"
        onClose={() => setEditing(null)}
        onConfirm={(g) => {
          onChange(items.map((it, k) => (k === editing ? { ...it, grams: g } : it)));
          setEditing(null);
        }}
      />
    </View>
  );
};

export function FoodCreate() {
  const params = useLocalSearchParams();
  const kind = TITLES[params.kind] ? params.kind : "food";
  const meal = MEAL[params.meal] ? params.meal : null;
  const { addFoodEntries, saveToLibrary, hideNumbers, profile, todayKey } = useApp();
  const date = diaryDay(params.date, todayKey);
  const hidden = hideNumbers || profile.trackingStyle === "Visual plates";
  const [f, setF] = useState({
    name: params.name ?? "",
    brand: "",
    barcode: params.barcode ?? "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
    per: "100g",
    portionLabel: "",
    portionGrams: "",
    servings: 1,
    minutes: "",
    category: params.meal === "breakfast" ? "breakfast" : params.meal === "snacks" ? "snack" : params.meal ?? "dinner",
    vegetarian: false,
    steps: "",
  });
  const [items, setItems] = useState([]);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));

  const portionGrams = toNum(f.portionGrams);
  const perPortion = f.per === "portion";
  const valid =
    kind === "quick"
      ? toNum(f.kcal) > 0
      : kind === "food"
        ? f.name.trim() && f.kcal !== "" && (!perPortion || portionGrams > 0)
        : f.name.trim() && items.length > 0;

  /** The food as Selena keeps it: values per 100 g, with its portion if given. */
  const buildFood = () => {
    const k = perPortion ? 100 / portionGrams : 1;
    return {
      id: `mine:${newId()}`,
      name: f.name.trim(),
      brand: f.brand.trim() || null,
      barcode: f.barcode.trim() || null,
      source: "mine",
      per100: {
        kcal: Math.round(toNum(f.kcal) * k),
        protein: Math.round(toNum(f.protein) * k * 10) / 10,
        carbs: Math.round(toNum(f.carbs) * k * 10) / 10,
        fat: Math.round(toNum(f.fat) * k * 10) / 10,
      },
      serving: portionGrams > 0 ? { label: f.portionLabel.trim() || "1 portion", grams: Math.round(portionGrams) } : null,
    };
  };

  const save = (andAdd) => {
    if (!valid) return;
    if (kind === "quick") {
      addFoodEntries([quickEntry(meal ?? "snacks", { name: f.name, kcal: toNum(f.kcal), protein: toNum(f.protein), carbs: toNum(f.carbs), fat: toNum(f.fat) })], date);
    } else if (kind === "food") {
      const food = buildFood();
      saveToLibrary("foods", food);
      if (andAdd && meal) addFoodEntries([foodEntry(meal, food, food.serving?.grams ?? 100)], date);
    } else if (kind === "meal") {
      saveToLibrary("meals", { id: `mine:${newId()}`, name: f.name.trim(), items });
    } else {
      saveToLibrary("recipes", {
        id: `mine:${newId()}`,
        name: f.name.trim(),
        category: f.category,
        phases: [],
        vegetarian: f.vegetarian,
        minutes: toNum(f.minutes) || null,
        servings: f.servings,
        items,
        steps: f.steps
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      });
    }
    back();
  };

  const total = kind === "recipe" ? perServing({ items, servings: f.servings }) : itemsTotal(items);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {kind === "food" && meal && (
            <Pressable
              onPress={() => save(true)}
              disabled={!valid}
              accessibilityRole="button"
              accessibilityLabel={`Save and add to ${MEAL[meal].label}`}
              accessibilityState={{ disabled: !valid }}
              style={[styles.primary, !valid && { opacity: 0.45 }]}
            >
              <Text style={styles.primaryText}>{`Save and add to ${MEAL[meal].label}`}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => save(false)}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityLabel={kind === "quick" ? `Add to ${MEAL[meal ?? "snacks"].label}` : "Save"}
            accessibilityState={{ disabled: !valid }}
            style={[kind === "food" && meal ? styles.ghost : styles.primary, !valid && { opacity: 0.45 }]}
          >
            <Text style={kind === "food" && meal ? styles.ghostText : styles.primaryText}>{kind === "quick" ? `Add to ${MEAL[meal ?? "snacks"].label}` : "Save"}</Text>
          </Pressable>
        </View>
      }
    >
      <View style={[s.row, { gap: 12, marginBottom: 18 }]}>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Serif size={24} accessibilityRole="header">
          {TITLES[kind]}
        </Serif>
      </View>

      {kind === "quick" && (
        <>
          <Body size={13} style={{ marginBottom: 14 }}>
            For when you just want to note it and move on. Only energy is needed.
          </Body>
          <Field label="Name (optional)" value={f.name} onChange={set("name")} placeholder="e.g. Lunch out" />
          <Field label="Energy" value={f.kcal} onChange={set("kcal")} numeric unit="kcal" />
          <View style={[s.row, { gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <Field label="Protein" value={f.protein} onChange={set("protein")} numeric unit="g" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Carbs" value={f.carbs} onChange={set("carbs")} numeric unit="g" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Fat" value={f.fat} onChange={set("fat")} numeric unit="g" />
            </View>
          </View>
        </>
      )}

      {kind === "food" && (
        <>
          <Field label="Name" value={f.name} onChange={set("name")} placeholder="e.g. Bread roll" />
          <Field label="Brand (optional)" value={f.brand} onChange={set("brand")} />
          <Field label="Barcode (optional)" value={f.barcode} onChange={(v) => set("barcode")(v.replace(/\D/g, ""))} numeric />
          <Field label="Portion (optional)" value={f.portionLabel} onChange={set("portionLabel")} placeholder="e.g. 1 roll" />
          <Field label="Portion weight" value={f.portionGrams} onChange={set("portionGrams")} numeric unit="g" />
          <Text style={styles.label}>The values on the label are</Text>
          <View style={[s.row, { gap: 8, marginBottom: 12 }]}>
            <Chip label="Per 100 g" selected={!perPortion} onPress={() => set("per")("100g")} />
            <Chip label="Per portion" selected={perPortion} onPress={() => set("per")("portion")} />
          </View>
          <Field label="Energy" value={f.kcal} onChange={set("kcal")} numeric unit="kcal" />
          <View style={[s.row, { gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <Field label="Protein" value={f.protein} onChange={set("protein")} numeric unit="g" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Carbs" value={f.carbs} onChange={set("carbs")} numeric unit="g" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Fat" value={f.fat} onChange={set("fat")} numeric unit="g" />
            </View>
          </View>
          {perPortion && !(portionGrams > 0) && <Body size={12.5}>Add the portion weight so Selena can work out any amount.</Body>}
        </>
      )}

      {(kind === "meal" || kind === "recipe") && (
        <>
          <Field label="Name" value={f.name} onChange={set("name")} placeholder={kind === "meal" ? "e.g. Cereal with milk" : "e.g. Mushroom soup"} />
          {kind === "recipe" && (
            <>
              <Text style={styles.label}>Servings it makes</Text>
              <View style={[s.row, { gap: 12, marginBottom: 12 }]}>
                <IconBtn label="Fewer servings" onPress={() => set("servings")(Math.max(1, f.servings - 1))}>
                  <Minus size={16} color={T.ink} />
                </IconBtn>
                <Body size={16} color={T.ink}>
                  {String(f.servings)}
                </Body>
                <IconBtn label="More servings" onPress={() => set("servings")(f.servings + 1)}>
                  <Plus size={16} color={T.ink} />
                </IconBtn>
              </View>
              <Text style={styles.label}>Best for</Text>
              <View style={[s.row, { gap: 8, flexWrap: "wrap", marginBottom: 12 }]}>
                {RECIPE_CATEGORIES.map((c) => (
                  <Chip key={c.key} label={c.label} selected={f.category === c.key} onPress={() => set("category")(c.key)} />
                ))}
                <Chip label="Vegetarian" selected={f.vegetarian} onPress={() => set("vegetarian")(!f.vegetarian)} />
              </View>
              <Field label="Time (optional)" value={f.minutes} onChange={set("minutes")} numeric unit="min" />
            </>
          )}
          <SectionTitle>{kind === "meal" ? "FOODS IN THIS MEAL" : "INGREDIENTS"}</SectionTitle>
          <IngredientPicker items={items} onChange={setItems} hidden={hidden} />
          {items.length > 0 && !hidden && (
            <Body size={13} style={{ marginTop: 10 }} testID="create-total">
              {`${kind === "recipe" ? "Per serving" : "Altogether"}: ${kcalText(total.kcal)} · protein ${total.protein} g · carbs ${total.carbs} g · fat ${total.fat} g`}
            </Body>
          )}
          {kind === "recipe" && (
            <>
              <SectionTitle>METHOD (OPTIONAL)</SectionTitle>
              <Field label="Steps, one per line" value={f.steps} onChange={set("steps")} multiline />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: F.sansMed, fontSize: 12.5, color: T.inkSoft, marginBottom: 6 },
  input: { flex: 1, minHeight: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, fontFamily: F.sans, fontSize: 15.5, color: T.ink },
  itemRow: { gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  itemName: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
  iconHit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  footer: { gap: 8, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, backgroundColor: T.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.hair },
  primary: { minHeight: 52, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
  primaryText: { fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas },
  ghost: { minHeight: 48, borderWidth: 1, borderColor: T.hair, alignItems: "center", justifyContent: "center" },
  ghostText: { fontFamily: F.sansMed, fontSize: 14.5, color: T.ink },
});
