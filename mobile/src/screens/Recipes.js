import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Clock, Plus, Minus, Leaf, Trash2 } from "lucide-react-native";
import { getPhase, groupForPhase, CAL_GROUPS } from "../shared";
import { useApp } from "../state/AppState";
import { SELENA_RECIPES, RECIPE_CATEGORIES } from "../content/recipes";
import { perServing, recipeEntry, MEALS, MEAL, amountLabel } from "../lib/food";
import { kcalText, SectionTitle, OLIVE, diaryDay, dayLabel } from "../ui/food";
import { T, F } from "../ui/theme";
import { Screen, Card, Body, Serif, Chip, IconBtn, s } from "../ui/kit";

/* ---------------------------------------------------------------
   RECIPES — Selena's simple dishes, each tagged with the phases it
   suits, and the user's own. One tap adds a serving to a meal.
   --------------------------------------------------------------- */

const HIGH_PROTEIN = 25;
const MEAL_FOR = { breakfast: "breakfast", lunch: "lunch", dinner: "dinner", snack: "snacks" };
const phaseLabel = (key) => CAL_GROUPS.find((g) => g.key === key)?.label;

export const allRecipes = (library) => [...(library.recipes ?? []), ...SELENA_RECIPES];

const RecipeCard = ({ recipe, hidden, date }) => {
  const n = perServing(recipe);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/recipe/[id]", params: { id: recipe.id, date } })}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.name}${recipe.minutes ? `, ${recipe.minutes} minutes` : ""}`}
      style={styles.card}
    >
      <Text style={styles.cardName} numberOfLines={2}>
        {recipe.name}
      </Text>
      <View style={[s.row, { gap: 10, marginTop: 6, flexWrap: "wrap" }]}>
        {!!recipe.minutes && (
          <View style={[s.row, { gap: 4 }]}>
            <Clock size={13} color={T.inkSoft} />
            <Body size={12.5}>{`${recipe.minutes} min`}</Body>
          </View>
        )}
        {recipe.vegetarian && (
          <View style={[s.row, { gap: 4 }]}>
            <Leaf size={13} color={OLIVE} />
            <Body size={12.5}>Vegetarian</Body>
          </View>
        )}
        {!hidden && <Body size={12.5}>{`${kcalText(n.kcal)} · ${n.protein} g protein`}</Body>}
      </View>
    </Pressable>
  );
};

export const RecipesView = ({ hidden, date }) => {
  const { ctx, foodLibrary } = useApp();
  const [filter, setFilter] = useState("all");
  const phase = ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null;
  const mine = foodLibrary.recipes ?? [];
  const keep = (r) =>
    filter === "all" ||
    r.category === filter ||
    (filter === "vegetarian" && r.vegetarian) ||
    (filter === "protein" && perServing(r).protein >= HIGH_PROTEIN);
  const forPhase = phase ? SELENA_RECIPES.filter((r) => r.phases.includes(phase)) : [];

  return (
    <View testID="recipes">
      <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 8 }]}>
        {[["all", "All"], ...RECIPE_CATEGORIES.map((c) => [c.key, c.label]), ["vegetarian", "Vegetarian"], ["protein", "High protein"]].map(([k, label]) => (
          <Chip key={k} label={label} selected={filter === k} onPress={() => setFilter(k)} />
        ))}
      </View>

      {filter === "all" && forPhase.length > 0 && (
        <>
          <SectionTitle>{`FOR YOUR ${phaseLabel(phase).toUpperCase()} PHASE`}</SectionTitle>
          <View style={{ gap: 10 }}>
            {forPhase.map((r) => (
              <RecipeCard key={r.id} recipe={r} hidden={hidden} date={date} />
            ))}
          </View>
        </>
      )}

      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-end" }]}>
        <SectionTitle>MY RECIPES</SectionTitle>
        <Pressable
          onPress={() => router.push({ pathname: "/food/new", params: { kind: "recipe" } })}
          accessibilityRole="button"
          accessibilityLabel="New recipe"
          style={[s.row, styles.newBtn]}
        >
          <Plus size={14} color={T.ink} />
          <Text style={{ fontFamily: F.sansMed, fontSize: 12.5, color: T.ink }}>New recipe</Text>
        </Pressable>
      </View>
      {mine.filter(keep).length ? (
        <View style={{ gap: 10 }}>
          {mine.filter(keep).map((r) => (
            <RecipeCard key={r.id} recipe={r} hidden={hidden} date={date} />
          ))}
        </View>
      ) : (
        <Body size={13}>Recipes you write yourself will live here.</Body>
      )}

      <SectionTitle>SELENA RECIPES</SectionTitle>
      <View style={{ gap: 10 }}>
        {SELENA_RECIPES.filter(keep).map((r) => (
          <RecipeCard key={r.id} recipe={r} hidden={hidden} date={date} />
        ))}
      </View>
    </View>
  );
};

/* ---- one recipe ---- */

export function RecipeDetail() {
  const params = useLocalSearchParams();
  const { id } = params;
  const { foodLibrary, addFoodEntries, removeFromLibrary, hideNumbers, profile, todayKey } = useApp();
  const recipe = allRecipes(foodLibrary).find((r) => r.id === id);
  const [meal, setMeal] = useState(MEAL[params.meal] ? params.meal : (MEAL_FOR[recipe?.category] ?? "lunch"));
  const date = diaryDay(params.date, todayKey);
  const [portions, setPortions] = useState(1);
  const [added, setAdded] = useState(false);
  const hidden = hideNumbers || profile.trackingStyle === "Visual plates";
  const back = () => (router.canGoBack?.() ? router.back() : router.replace("/nutrition"));

  if (!recipe) {
    return (
      <Screen>
        <IconBtn label="Back" onPress={back}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <Body style={{ marginTop: 20 }}>This recipe is no longer here.</Body>
      </Screen>
    );
  }
  const n = perServing(recipe);
  const mine = !recipe.id.startsWith("selena:");

  return (
    <Screen>
      <IconBtn label="Back" onPress={back}>
        <ArrowLeft size={20} color={T.ink} />
      </IconBtn>
      <Serif size={28} style={{ marginTop: 16 }} accessibilityRole="header">
        {recipe.name}
      </Serif>
      <View style={[s.row, { gap: 12, marginTop: 6, flexWrap: "wrap" }]}>
        {!!recipe.minutes && <Body size={13}>{`${recipe.minutes} min`}</Body>}
        <Body size={13}>{`Makes ${recipe.servings} ${recipe.servings === 1 ? "serving" : "servings"}`}</Body>
        {recipe.phases?.length > 0 && <Body size={13}>{`Suits ${recipe.phases.map(phaseLabel).join(", ").toLowerCase()}`}</Body>}
      </View>
      {!hidden && (
        <Card style={{ marginTop: 14 }} testID="per-serving">
          <Body size={13.5} color={T.ink}>{`Per serving: ${kcalText(n.kcal)} · protein ${n.protein} g · carbs ${n.carbs} g · fat ${n.fat} g`}</Body>
        </Card>
      )}

      <SectionTitle>INGREDIENTS</SectionTitle>
      {recipe.items.map((i, k) => (
        <View key={k} style={[s.row, styles.ingredient]}>
          <Body size={14.5} color={T.ink} style={{ flex: 1 }}>
            {i.food.name}
          </Body>
          <Body size={13}>{amountLabel(i.food, i.grams)}</Body>
        </View>
      ))}

      {recipe.steps?.length > 0 && (
        <>
          <SectionTitle>METHOD</SectionTitle>
          {recipe.steps.map((st, k) => (
            <View key={k} style={[s.row, { alignItems: "flex-start", gap: 10, marginBottom: 8 }]}>
              <Text style={styles.stepNum}>{k + 1}</Text>
              <Body size={14} color={T.ink} style={{ flex: 1 }}>
                {st}
              </Body>
            </View>
          ))}
        </>
      )}

      <Card style={{ marginTop: 18, gap: 12 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 18, color: T.ink }}>{date === todayKey ? "Add to your diary" : `Add to ${dayLabel(date, todayKey)}`}</Text>
        <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
          {MEALS.map((m) => (
            <Chip key={m.key} label={m.label} selected={meal === m.key} onPress={() => setMeal(m.key)} />
          ))}
        </View>
        <View style={[s.row, { gap: 12 }]}>
          <IconBtn label="Fewer servings" onPress={() => setPortions((p) => Math.max(0.5, p - 0.5))}>
            <Minus size={16} color={T.ink} />
          </IconBtn>
          <Body size={15} color={T.ink} accessibilityLiveRegion="polite">{`${portions} ${portions === 1 ? "serving" : "servings"}`}</Body>
          <IconBtn label="More servings" onPress={() => setPortions((p) => p + 0.5)}>
            <Plus size={16} color={T.ink} />
          </IconBtn>
        </View>
        <Pressable
          onPress={() => {
            addFoodEntries([recipeEntry(meal, recipe, portions)], date);
            setAdded(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add to ${MEAL[meal].label}`}
          style={styles.addBtn}
        >
          <Text style={{ fontFamily: F.sansMed, fontSize: 15.5, color: T.canvas }}>{added ? `Added to ${MEAL[meal].label}` : `Add to ${MEAL[meal].label}`}</Text>
        </Pressable>
      </Card>

      {mine && (
        <Pressable
          onPress={() => {
            removeFromLibrary("recipes", recipe.id);
            back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete this recipe"
          style={[s.row, { gap: 6, minHeight: 44, marginTop: 14 }]}
        >
          <Trash2 size={14} color={T.terracotta} />
          <Body size={13} color={T.terracotta}>
            Delete this recipe
          </Body>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hair },
  cardName: { fontFamily: F.serif, fontSize: 17, color: T.ink },
  newBtn: { gap: 4, minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: T.hair },
  ingredient: { gap: 10, minHeight: 40, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.canvasDeep, textAlign: "center", lineHeight: 24, fontFamily: F.sansMed, fontSize: 12, color: T.ink },
  addBtn: { minHeight: 52, borderRadius: 999, backgroundColor: OLIVE, alignItems: "center", justifyContent: "center" },
});
