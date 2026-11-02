import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search, ScanBarcode, Zap, PencilLine, X, Carrot, CookingPot, Soup } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { MEAL, defaultGrams, foodEntry, savedMealEntries, recipeEntry, perServing, itemsTotal, amountLabel, matches } from "../lib/food";
import { SELENA_RECIPES } from "../content/recipes";
import { FoodRow, AmountSheet, SectionTitle, useFoodSearch, OLIVE, diaryDay, dayLabel } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Body, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ADD FOOD — as few taps as possible.

   Recent foods are waiting before anything is typed; + adds the usual
   amount straight away, a tap on the name picks a different amount.
   Typing searches the phone at once and packaged UK products after a
   short pause. The keyboard's microphone works in the search box, so
   saying "porridge" is as quick as typing it.
   --------------------------------------------------------------- */

const MODES = [
  { key: "search", label: "Search", icon: Search },
  { key: "barcode", label: "Barcode", icon: ScanBarcode },
  { key: "quick", label: "Quick add", icon: Zap },
  { key: "create", label: "Create", icon: PencilLine },
];

const CREATE = [
  { kind: "food", title: "New food", sub: "One item, with or without a barcode (e.g. a bread roll)", icon: Carrot },
  { kind: "meal", title: "New meal", sub: "Foods you often eat together (e.g. cereal with milk)", icon: Soup },
  { kind: "recipe", title: "New recipe", sub: "A dish with servings and optional method", icon: CookingPot },
];

const foodSub = (f, grams) => [f.brand, amountLabel(f, grams)].filter(Boolean).join(", ");

export function FoodAdd() {
  const params = useLocalSearchParams();
  const meal = MEAL[params.meal] ? params.meal : "snacks";
  const { foodLibrary, addFoodEntries, hideNumbers, profile, todayKey } = useApp();
  // the diary day this was opened for: today, a past day, or one planned ahead
  const date = diaryDay(params.date, todayKey);
  const hidden = hideNumbers || profile.trackingStyle === "Visual plates";
  const [query, setQuery] = useState("");
  const [list, setList] = useState("recent");
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState(null);
  const [added, setAdded] = useState({});
  const { local, remote } = useFoodSearch(query, foodLibrary);
  const count = Object.values(added).reduce((a, b) => a + b, 0);
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));

  const mark = (key, n = 1) => setAdded((a) => ({ ...a, [key]: (a[key] ?? 0) + n }));
  const addFood = (food, grams = defaultGrams(food, foodLibrary.recent)) => {
    addFoodEntries([foodEntry(meal, food, grams)], date);
    mark(food.id);
  };

  const go = (mode) => {
    if (mode === "barcode") router.push({ pathname: "/food/scan", params: { meal, date } });
    if (mode === "quick") router.push({ pathname: "/food/new", params: { kind: "quick", meal, date } });
    if (mode === "create") setCreating(true);
  };

  const foodRows = (foods) =>
    foods.map((f) => {
      const g = defaultGrams(f, foodLibrary.recent);
      return (
        <FoodRow
          key={f.id}
          name={f.name}
          sub={foodSub(f, g)}
          kcal={Math.round((f.per100.kcal * g) / 100)}
          hidden={hidden}
          added={!!added[f.id]}
          onAdd={() => addFood(f, g)}
          onPress={() => setPicked(f)}
        />
      );
    });

  const mealRows = (meals) =>
    meals.map((m) => (
      <FoodRow
        key={m.id}
        name={m.name}
        sub={`${m.items.length} foods`}
        kcal={itemsTotal(m.items).kcal}
        hidden={hidden}
        added={!!added[m.id]}
        onAdd={() => {
          addFoodEntries(savedMealEntries(meal, m), date);
          mark(m.id, m.items.length);
        }}
        onPress={() => {
          addFoodEntries(savedMealEntries(meal, m), date);
          mark(m.id, m.items.length);
        }}
      />
    ));

  const recipeRows = (recipes) =>
    recipes.map((r) => (
      <FoodRow
        key={r.id}
        name={r.name}
        sub="1 serving"
        kcal={perServing(r).kcal}
        hidden={hidden}
        added={!!added[r.id]}
        onAdd={() => {
          addFoodEntries([recipeEntry(meal, r, 1)], date);
          mark(r.id);
        }}
        onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: r.id, meal, date } })}
      />
    ));

  const q = query.trim();
  const selenaRecipes = q ? SELENA_RECIPES.filter((r) => matches(r, q)) : SELENA_RECIPES;
  const empty = (text) => (
    <Body size={13} style={{ paddingVertical: 12 }}>
      {text}
    </Body>
  );

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Done" style={styles.done}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      }
    >
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <IconBtn label="Back to your diary" onPress={close}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <View style={{ alignItems: "center" }}>
          <Text accessibilityRole="header" style={styles.title}>
            {MEAL[meal].label}
          </Text>
          {date !== todayKey && <Text style={styles.titleDay}>{dayLabel(date, todayKey)}</Text>}
        </View>
        <View style={styles.badge} accessibilityLabel={`${count} added`} testID="added-count">
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </View>

      <View style={[s.row, { gap: 10, marginTop: 18 }]}>
        {MODES.map(({ key, label, icon: Icon }) => (
          <Pressable
            key={key}
            onPress={() => go(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: key === "search" }}
            style={{ flex: 1, alignItems: "center", gap: 6 }}
          >
            <View style={[styles.mode, key === "search" && styles.modeOn]}>
              <Icon size={24} color={key === "search" ? T.canvas : T.ink} strokeWidth={1.6} />
            </View>
            <Text style={styles.modeLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={T.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`What did you have for ${MEAL[meal].label.toLowerCase()}?`}
          placeholderTextColor={T.inkSoft}
          accessibilityLabel="Search foods"
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
            <X size={18} color={T.inkSoft} />
          </Pressable>
        )}
      </View>
      <Body size={12} style={{ marginTop: 6 }}>
        Tip: tap the microphone on your keyboard to say it instead.
      </Body>

      {!q ? (
        <>
          <View style={[s.row, { gap: 8, marginTop: 14, flexWrap: "wrap" }]}>
            {[
              ["recent", "Recent"],
              ["mine", "My foods"],
              ["meals", "My meals"],
              ["recipes", "Recipes"],
            ].map(([k, label]) => (
              <Chip key={k} label={label} selected={list === k} onPress={() => setList(k)} />
            ))}
          </View>
          <View style={{ marginTop: 6 }} testID={`list-${list}`}>
            {list === "recent" && (foodLibrary.recent.length ? foodRows(foodLibrary.recent) : empty("Foods you add will be waiting here next time."))}
            {list === "mine" && (foodLibrary.foods.length ? foodRows(foodLibrary.foods) : empty("Foods you create will live here."))}
            {list === "meals" && (foodLibrary.meals.length ? mealRows(foodLibrary.meals) : empty("Save foods you eat together as a meal to add them in one tap."))}
            {list === "recipes" && recipeRows([...foodLibrary.recipes, ...SELENA_RECIPES])}
          </View>
        </>
      ) : (
        <View testID="search-results">
          {local.foods.length > 0 && (
            <>
              <SectionTitle>YOUR FOODS</SectionTitle>
              {foodRows(local.foods)}
            </>
          )}
          {local.meals.length > 0 && (
            <>
              <SectionTitle>YOUR MEALS</SectionTitle>
              {mealRows(local.meals)}
            </>
          )}
          {local.recipes.length + selenaRecipes.length > 0 && (
            <>
              <SectionTitle>RECIPES</SectionTitle>
              {recipeRows([...local.recipes, ...selenaRecipes])}
            </>
          )}
          {local.everyday.length > 0 && (
            <>
              <SectionTitle>EVERYDAY FOODS</SectionTitle>
              {foodRows(local.everyday)}
            </>
          )}
          <SectionTitle>PRODUCTS</SectionTitle>
          {remote.status === "loading" && empty("Looking through UK products…")}
          {remote.status === "error" && empty("Products can't be reached right now. Everyday foods and your own foods still work.")}
          {remote.status === "done" && (remote.items.length ? foodRows(remote.items) : empty("No products found. You can create this food yourself."))}
          {remote.status === "idle" && q.length < 3 && empty("Keep typing to search packaged products.")}
          <Pressable
            onPress={() => router.push({ pathname: "/food/new", params: { kind: "food", meal, name: q, date } })}
            accessibilityRole="button"
            accessibilityLabel={`Create "${q}" as a new food`}
            style={styles.createLink}
          >
            <PencilLine size={15} color={OLIVE} />
            <Text style={{ fontFamily: F.sansMed, fontSize: 13.5, color: OLIVE }}>{`Create “${q}” as a new food`}</Text>
          </Pressable>
        </View>
      )}

      <AmountSheet
        food={picked}
        grams={picked ? defaultGrams(picked, foodLibrary.recent) : undefined}
        visible={!!picked}
        hidden={hidden}
        confirmLabel={`Add to ${MEAL[meal].label}`}
        onClose={() => setPicked(null)}
        onConfirm={(g) => {
          addFood(picked, g);
          setPicked(null);
        }}
      />

      <Modal visible={creating} transparent animationType="slide" onRequestClose={() => setCreating(false)}>
        <View style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setCreating(false)} accessibilityRole="button" accessibilityLabel="Close" />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>What would you like to create?</Text>
            {CREATE.map(({ kind, title, sub, icon: Icon }) => (
              <Pressable
                key={kind}
                onPress={() => {
                  setCreating(false);
                  router.push({ pathname: "/food/new", params: { kind, meal, date } });
                }}
                accessibilityRole="button"
                accessibilityLabel={title}
                style={styles.createRow}
              >
                <Icon size={22} color={OLIVE} strokeWidth={1.6} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.createTitle}>{title}</Text>
                  <Body size={12.5}>{sub}</Body>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: F.serif, fontSize: 22, color: T.ink },
  titleDay: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft },
  badge: { minWidth: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: OLIVE, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: F.sansSemi, fontSize: 15, color: OLIVE },
  mode: { width: "100%", aspectRatio: 1, maxWidth: 76, borderRadius: 20, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  modeOn: { backgroundColor: OLIVE, borderColor: OLIVE },
  modeLabel: { fontFamily: F.sansMed, fontSize: 12, color: T.ink },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, minHeight: 52, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: OLIVE, backgroundColor: T.surface },
  searchInput: { flex: 1, fontFamily: F.sans, fontSize: 15.5, color: T.ink, paddingVertical: 10 },
  createLink: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, backgroundColor: T.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.hair },
  done: { minHeight: 52, borderRadius: 999, backgroundColor: T.ink, alignItems: "center", justifyContent: "center" },
  doneText: { fontFamily: F.sansMed, fontSize: 16, color: T.canvas },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.35)" },
  sheet: { backgroundColor: T.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, gap: 10 },
  sheetTitle: { fontFamily: F.serif, fontSize: 22, color: T.ink, marginBottom: 6 },
  createRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  createTitle: { fontFamily: F.sansMed, fontSize: 15.5, color: T.ink },
});
