import React, { useRef, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Button, Menu, Portal, Searchbar, TouchableRipple } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search, ScanBarcode, Zap, PencilLine, X, Carrot, CookingPot, Soup, BookOpen, ChevronDown, Star } from "lucide-react-native";
import { useApp } from "../state/AppState";
import { MEAL, defaultGrams, foodEntry, savedMealEntries, recipeEntry, perServing, itemsTotal, amountLabel, matches, scale, byFrequency, rankByQuery } from "../lib/food";
import { SELENA_RECIPES } from "../content/recipes";
import { FoodRow, ResultCard, useFoodSearch, diaryDay, dayLabel } from "../ui/food";
import { FoodDetail } from "../ui/FoodDetail";
import { T, F, TOILE } from "../ui/theme";
import { Screen, Body, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   ADD FOOD — as few taps as possible.

   The ways to add sit along the top, with the foods eaten most often
   waiting below: + adds the usual amount, a tap on the name opens the
   food's own page. Tapping search clears everything else away and
   shows recent searches; typing searches the phone at once and packaged
   UK products after a short pause.
   --------------------------------------------------------------- */

const TOOLS = [
  { key: "search", label: "Search", icon: Search },
  { key: "barcode", label: "Barcode", icon: ScanBarcode },
  { key: "quick", label: "Quick add", icon: Zap },
  { key: "recipes", label: "Recipes", icon: BookOpen },
  { key: "create", label: "Create", icon: PencilLine },
];

const LISTS = [
  ["foods", "Foods"],
  ["mine", "My foods"],
  ["meals", "My meals"],
  ["recipes", "Recipes"],
];

const ORDERS = [
  ["frequent", "Frequent"],
  ["recent", "Recent"],
  ["az", "A to Z"],
];

const CREATE = [
  { kind: "food", title: "New food", sub: "One item, with or without a barcode (e.g. a bread roll)", icon: Carrot },
  { kind: "meal", title: "New meal", sub: "Foods you often eat together (e.g. cereal with milk)", icon: Soup },
  { kind: "recipe", title: "New recipe", sub: "A dish with servings and optional method", icon: CookingPot },
];

const foodSub = (f, grams) => [f.brand, amountLabel(f, grams)].filter(Boolean).join(", ");
const inOrder = (foods, order) => {
  if (order === "frequent") return byFrequency(foods);
  if (order === "az") return [...foods].sort((a, b) => a.name.localeCompare(b.name));
  return foods;
};

/** A dropdown from the library: the current choice, and the others on a tap. */
const Dropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchorPosition="bottom"
      contentStyle={{ backgroundColor: T.canvas }}
      anchor={
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label} style={[s.row, styles.dropdown]}>
          <Text style={styles.dropdownText}>{options.find(([k]) => k === value)[1]}</Text>
          <ChevronDown size={18} color={T.ink} />
        </Pressable>
      }
    >
      {options.map(([k, text]) => (
        <Menu.Item
          key={k}
          title={text}
          titleStyle={{ fontFamily: value === k ? F.sansSemi : F.sans }}
          onPress={() => {
            setOpen(false);
            onChange(k);
          }}
        />
      ))}
    </Menu>
  );
};

export function FoodAdd() {
  const params = useLocalSearchParams();
  const meal = MEAL[params.meal] ? params.meal : "snacks";
  const { foodLibrary, addFoodEntries, saveSearch, toggleFavorite, hideNumbers, profile, todayKey } = useApp();
  // the diary day this was opened for: today, a past day, or one planned ahead
  const date = diaryDay(params.date, todayKey);
  const hidden = hideNumbers || profile.trackingStyle === "Visual plates";
  const searchBox = useRef(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [only, setOnly] = useState(null);
  const [list, setList] = useState("foods");
  const [order, setOrder] = useState("frequent");
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState(null);
  const [added, setAdded] = useState({});
  const { local, remote } = useFoodSearch(query, foodLibrary);
  const count = Object.values(added).reduce((a, b) => a + b, 0);
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));
  const q = query.trim();
  const searching = focused || !!q || !!only;

  const mark = (key, n = 1) => setAdded((a) => ({ ...a, [key]: (a[key] ?? 0) + n }));
  const addFood = (food, grams = defaultGrams(food, foodLibrary.recent)) => {
    addFoodEntries([foodEntry(meal, food, grams)], date);
    mark(food.id);
    if (q) saveSearch(q);
  };
  const addMeal = (m) => {
    addFoodEntries(savedMealEntries(meal, m), date);
    mark(m.id, m.items.length);
  };
  const addRecipe = (r) => {
    addFoodEntries([recipeEntry(meal, r, 1)], date);
    mark(r.id);
  };
  const openRecipe = (r) => router.push({ pathname: "/recipe/[id]", params: { id: r.id, meal, date } });
  const cancelSearch = () => {
    setQuery("");
    setOnly(null);
    setFocused(false);
    searchBox.current?.blur();
  };

  const tool = (key) => {
    if (key === "search") searchBox.current?.focus();
    if (key === "barcode") router.push({ pathname: "/food/scan", params: { meal, date } });
    if (key === "quick") router.push({ pathname: "/food/new", params: { kind: "quick", meal, date } });
    if (key === "recipes") setList("recipes");
    if (key === "create") setCreating(true);
  };

  const foodRows = (foods) =>
    foods.map((f) => {
      const g = defaultGrams(f, foodLibrary.recent);
      return <FoodRow key={f.id} name={f.name} sub={foodSub(f, g)} kcal={Math.round((f.per100.kcal * g) / 100)} hidden={hidden} added={!!added[f.id]} onAdd={() => addFood(f, g)} onPress={() => setPicked(f)} />;
    });
  const mealRows = (meals) =>
    meals.map((m) => <FoodRow key={m.id} name={m.name} sub={`${m.items.length} foods`} kcal={itemsTotal(m.items).kcal} hidden={hidden} added={!!added[m.id]} onAdd={() => addMeal(m)} onPress={() => addMeal(m)} />);
  const recipeRows = (recipes) =>
    recipes.map((r) => <FoodRow key={r.id} name={r.name} sub="1 serving" kcal={perServing(r).kcal} hidden={hidden} added={!!added[r.id]} onAdd={() => addRecipe(r)} onPress={() => openRecipe(r)} />);

  const foodCards = (foods, start = 0) =>
    foods.map((f, i) => {
      const g = defaultGrams(f, foodLibrary.recent);
      const n = scale(f.per100, g);
      return (
        <ResultCard
          key={f.id}
          name={f.name}
          sub={foodSub(f, g)}
          tag={foodLibrary.foods.some((m) => m.id === f.id) ? "Yours" : f.source === "off" ? "Product" : "Food"}
          logged={foodLibrary.recent.some((r) => r.id === f.id)}
          kcal={n.kcal}
          macros={i + start === 0 ? n : null}
          hidden={hidden}
          added={!!added[f.id]}
          onAdd={() => addFood(f, g)}
          onPress={() => setPicked(f)}
        />
      );
    });

  const empty = (text) => (
    <Body size={13} style={{ paddingVertical: 12 }}>
      {text}
    </Body>
  );

  // one list of results: anything already on the phone first, then products
  const seen = new Set();
  const once = (foods) => foods.filter((f) => !seen.has(f.id) && seen.add(f.id));
  const phoneFoods = rankByQuery(once([...local.foods, ...local.everyday]), q);
  const products = once(remote.items);
  const recipes = q ? [...local.recipes, ...SELENA_RECIPES.filter((r) => matches(r, q))] : [];
  const filtered = only === "favorites" ? foodLibrary.favorites : foodLibrary.foods;
  const chosen = q ? filtered.filter((f) => matches(f, q)) : filtered;

  const search = (
    <Searchbar
      ref={searchBox}
      value={query}
      onChangeText={setQuery}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onSubmitEditing={() => saveSearch(q)}
      onClearIconPress={() => setQuery("")}
      placeholder={`What did you have for ${MEAL[meal].label.toLowerCase()}?`}
      placeholderTextColor={T.inkSoft}
      accessibilityLabel="Search foods"
      clearAccessibilityLabel="Clear search"
      icon={() => <Search size={20} color={T.inkSoft} />}
      clearIcon={() => (query ? <X size={18} color={T.inkSoft} /> : null)}
      returnKeyType="search"
      autoCorrect={false}
      elevation={0}
      style={[styles.search, { flex: 1 }]}
      inputStyle={styles.searchInput}
    />
  );

  return (
    <Portal.Host>
      <Screen
        footer={
          <View style={styles.footer}>
            <Button mode="contained" onPress={close} accessibilityLabel="Done" buttonColor={T.ink} textColor={T.canvas} labelStyle={styles.doneText}>
              Done
            </Button>
          </View>
        }
      >
        {/* the search box stays put in the tree, so opening it keeps the keyboard up */}
        {!searching && (
          <>
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tools} contentContainerStyle={{ gap: 10, paddingRight: 24 }}>
              {TOOLS.map(({ key, label, icon: Icon }) => (
                <TouchableRipple key={key} onPress={() => tool(key)} accessibilityRole="button" accessibilityLabel={label} style={[styles.tool, key === "search" && styles.toolOn]}>
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <Icon size={26} color={TOILE.navy} strokeWidth={1.5} />
                    <Text style={[styles.toolLabel, key === "search" && { fontFamily: F.sansSemi }]}>{label}</Text>
                  </View>
                </TouchableRipple>
              ))}
            </ScrollView>
          </>
        )}

        <View style={[s.row, { gap: 6 }]}>
          {search}
          {searching && (
            <Button mode="text" onPress={cancelSearch} accessibilityLabel="Cancel search" textColor={TOILE.navy} labelStyle={styles.cancel}>
              Cancel
            </Button>
          )}
        </View>

        {!searching && (
          <>
            <View style={[s.row, { gap: 10, marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Dropdown label="Choose a list" value={list} options={LISTS} onChange={setList} />
              </View>
              {(list === "foods" || list === "mine") && (
                <View style={{ flex: 1 }}>
                  <Dropdown label="Choose an order" value={order} options={ORDERS} onChange={setOrder} />
                </View>
              )}
            </View>

            <View style={{ marginTop: 6 }} testID={`list-${list}`}>
              {list === "foods" && (foodLibrary.recent.length ? foodRows(inOrder(foodLibrary.recent, order)) : empty("Foods you add will be waiting here next time."))}
              {list === "mine" && (foodLibrary.foods.length ? foodRows(inOrder(foodLibrary.foods, order)) : empty("Foods you create will live here."))}
              {list === "meals" && (foodLibrary.meals.length ? mealRows(foodLibrary.meals) : empty("Save foods you eat together as a meal to add them in one tap."))}
              {list === "recipes" && recipeRows([...foodLibrary.recipes, ...SELENA_RECIPES])}
            </View>
          </>
        )}

        {searching && (q || only) ? (
          <View style={[s.row, { gap: 8, marginTop: 12, marginBottom: 12 }]}>
            {[
              ["favorites", "Favourites", Star],
              ["created", "Created by me", PencilLine],
            ].map(([k, label, Icon]) => (
              <Pressable key={k} onPress={() => setOnly(only === k ? null : k)} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: only === k }} style={[s.row, styles.filter, only === k && styles.filterOn]}>
                <Icon size={15} color={only === k ? T.canvas : TOILE.navy} />
                <Text style={[styles.filterText, only === k && { color: T.canvas }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {searching && !q && !only && (
          <View style={{ marginTop: 18 }} testID="recent-searches">
            {foodLibrary.searches.length > 0 && <Text style={styles.recentTitle}>Recent searches</Text>}
            {foodLibrary.searches.map((text) => (
              <TouchableRipple key={text} onPress={() => setQuery(text)} accessibilityRole="button" accessibilityLabel={`Search for ${text}`} style={styles.recentRow}>
                <Text style={styles.recentText}>{text}</Text>
              </TouchableRipple>
            ))}
          </View>
        )}

        {only && (
          <View testID="filtered-foods">
            {chosen.length ? foodCards(chosen) : empty(only === "favorites" ? "Tap the star on a food to keep it here." : "Foods you create will live here.")}
          </View>
        )}

        {q && !only ? (
          <View testID="search-results">
            {foodCards(phoneFoods)}
            {mealRows(local.meals)}
            {recipeRows(recipes)}
            {foodCards(products, phoneFoods.length)}
            {remote.status === "loading" && empty("Looking through UK products…")}
            {remote.status === "error" && empty("Products can't be reached right now. Everyday foods and your own foods still work.")}
            {remote.status === "done" && !remote.items.length && empty("No products found. You can create this food yourself.")}
            {remote.status === "idle" && q.length < 3 && empty("Keep typing to search packaged products.")}
            <Pressable onPress={() => router.push({ pathname: "/food/new", params: { kind: "food", meal, name: q, date } })} accessibilityRole="button" accessibilityLabel={`Create "${q}" as a new food`} style={styles.createLink}>
              <PencilLine size={15} color={TOILE.navy} />
              <Text style={{ fontFamily: F.sansMed, fontSize: 13.5, color: TOILE.navy }}>{`Create “${q}” as a new food`}</Text>
            </Pressable>
          </View>
        ) : null}

        <FoodDetail
          food={picked}
          grams={picked ? defaultGrams(picked, foodLibrary.recent) : undefined}
          visible={!!picked}
          hidden={hidden}
          title={MEAL[meal].label}
          logged={!!picked && foodLibrary.recent.some((r) => r.id === picked.id)}
          favorite={!!picked && foodLibrary.favorites.some((f) => f.id === picked.id)}
          onFavorite={() => toggleFavorite(picked)}
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
                  <Icon size={22} color={TOILE.navy} strokeWidth={1.6} />
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
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: F.serif, fontSize: 22, color: T.ink },
  titleDay: { fontFamily: F.sans, fontSize: 12.5, color: T.inkSoft },
  badge: { minWidth: 44, height: 44, borderWidth: 1.5, borderColor: TOILE.navy, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: F.sansSemi, fontSize: 15, color: TOILE.navy },
  tools: { marginTop: 16, marginBottom: 16, marginRight: -24 },
  tool: { width: 88, height: 88, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: TOILE.line, backgroundColor: T.surface },
  toolOn: { borderColor: TOILE.navy, borderWidth: 1.5 },
  toolLabel: { fontFamily: F.sans, fontSize: 12.5, color: T.ink },
  search: { backgroundColor: T.surface, borderWidth: 1.5, borderColor: TOILE.navy },
  searchInput: { fontFamily: F.sans, fontSize: 15.5, color: T.ink, minHeight: 0 },
  cancel: { fontFamily: F.sansSemi, fontSize: 15, marginHorizontal: 6 },
  dropdown: { minHeight: 48, paddingHorizontal: 14, justifyContent: "space-between", borderWidth: 1, borderColor: TOILE.line, backgroundColor: T.surface },
  dropdownText: { fontFamily: F.sansSemi, fontSize: 14, color: T.ink },
  filter: { minHeight: 44, gap: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: TOILE.line, backgroundColor: T.surface },
  filterOn: { backgroundColor: TOILE.navy, borderColor: TOILE.navy },
  filterText: { fontFamily: F.sansMed, fontSize: 13, color: TOILE.navy },
  recentTitle: { fontFamily: F.sansSemi, fontSize: 16, color: T.ink, marginBottom: 6 },
  recentRow: { minHeight: 52, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: TOILE.line },
  recentText: { fontFamily: F.sans, fontSize: 15.5, color: T.ink },
  createLink: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, backgroundColor: T.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: TOILE.line },
  doneText: { fontFamily: F.sansSemi, fontSize: 16, marginVertical: 15 },
  backdrop: { flex: 1, backgroundColor: "rgba(20,24,18,0.35)" },
  sheet: { backgroundColor: T.canvas, padding: 22, paddingBottom: 34, gap: 10 },
  sheetTitle: { fontFamily: F.serif, fontSize: 22, color: T.ink, marginBottom: 6 },
  createRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: T.surface, borderWidth: 1, borderColor: TOILE.line },
  createTitle: { fontFamily: F.sansMed, fontSize: 15.5, color: T.ink },
});
