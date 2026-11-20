import React from "react";
import { View } from "react-native";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { AppProvider, useApp, dateKey, STATE_KEY } from "../state/AppState";
import { TrackerSessionProvider } from "../state/TrackerSession";
import { findBlocked, AGREEMENT_VERSION } from "../shared";
import { Fuel } from "../screens/Fuel";
import { FoodAdd } from "../screens/FoodAdd";
import { FoodCreate } from "../screens/FoodCreate";
import { FoodScan } from "../screens/FoodScan";
import { FoodMeal } from "../screens/FoodMeal";
import { RecipeDetail } from "../screens/Recipes";
import { FoodGoal } from "../screens/FoodGoal";
import { goalFromBody, navyBodyFat, kgFromStones, cmFromFeet, MIN_KCAL } from "../lib/energy";
import { scale, amountLabel, perServing, searchLocal, fullnessWord, remember, rememberSearch, byFrequency, rankByQuery, unitsFor, nutritionFacts, nutrientsOf, quickEntry, emptyLibrary } from "../lib/food";
import { fromOff, lookupBarcode, searchProducts } from "../lib/openFoodFacts";
import { EVERYDAY } from "../content/foods";
import { SELENA_RECIPES } from "../content/recipes";
import { toBackup, mergeBackup } from "../lib/backup";

// Paper's Menu waits for a native measurement that tests never get
jest.mock("react-native-paper", () => {
  const actual = jest.requireActual("react-native-paper");
  const Menu = ({ visible, anchor, children }) => (
    <>
      {anchor}
      {visible ? children : null}
    </>
  );
  Menu.Item = actual.Menu.Item;
  return new Proxy(actual, { get: (target, key) => (key === "Menu" ? Menu : target[key]) });
});

const NOW = new Date(2026, 9, 29, 15, 0);
const TODAY = dateKey(NOW);
const lastPeriod = (() => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - 20);
  return dateKey(d);
})();

const Ready = ({ children }) => (useApp().ready ? <View testID="ready" style={{ flex: 1 }}>{children}</View> : null);

const mount = async (Screen, { params = {}, profile = {}, initial = {} } = {}) => {
  useLocalSearchParams.mockReturnValue(params);
  await render(
    <AppProvider
      now={NOW}
      initial={{
        onboarded: true,
        agreement: { version: AGREEMENT_VERSION, acceptedAt: "2026-10-01T09:00:00.000Z" },
        profile: { lastPeriod, ...profile },
        ...initial,
      }}
    >
      <TrackerSessionProvider>
        <Ready>
          <Screen />
        </Ready>
      </TrackerSessionProvider>
    </AppProvider>
  );
  await screen.findByTestId("ready");
};

const stored = async () => {
  await act(async () => {});
  return JSON.parse(await AsyncStorage.getItem(STATE_KEY));
};
const entries = async () => (await stored()).days[TODAY]?.food?.entries ?? [];
const showNumbers = () => AsyncStorage.setItem("selena.hideNumbers", "false");

const allText = (node) => {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(allText).join(" ");
  return allText(node.children);
};

const okJson = (json) => Promise.resolve({ ok: true, json: () => Promise.resolve(json) });

beforeEach(async () => {
  await AsyncStorage.clear();
  global.fetch.mockReset();
  global.fetch.mockImplementation(() => Promise.reject(new Error("offline in tests")));
  router.push.mockClear();
  router.back.mockClear();
  router.replace.mockClear();
});

describe("food arithmetic", () => {
  it("scales values per 100 g to any amount", () => {
    expect(scale({ kcal: 375, protein: 11, carbs: 60, fat: 8 }, 40)).toEqual({ kcal: 150, protein: 4.4, carbs: 24, fat: 3.2 });
  });

  it("reads amounts as portions where it can", () => {
    expect(amountLabel(EVERYDAY["white-bread"], 36)).toBe("1 slice (36 g)");
    expect(amountLabel(EVERYDAY["white-bread"], 72)).toBe("2 × 1 slice (72 g)");
    expect(amountLabel(EVERYDAY["white-bread"], 50)).toBe("50 g");
  });

  it("works out a recipe per serving", () => {
    const oats = SELENA_RECIPES.find((r) => r.id === "selena:overnight-oats");
    const n = perServing(oats);
    expect(n.kcal).toBeGreaterThan(300);
    expect(n.kcal).toBeLessThan(400);
    const dal = SELENA_RECIPES.find((r) => r.id === "selena:lentil-dal");
    expect(perServing(dal).kcal).toBeLessThan(perServing({ ...dal, servings: 1 }).kcal);
  });

  it("has every recipe ingredient in the everyday foods", () => {
    for (const r of SELENA_RECIPES) for (const i of r.items) expect(i.food).toBeTruthy();
  });

  it("finds everyday foods by any word", () => {
    expect(searchLocal("oats").everyday.map((f) => f.name)).toContain("Porridge oats");
    expect(searchLocal("greek yog").everyday.length).toBe(2);
  });

  it("keeps recent foods newest first without repeats", () => {
    const r1 = remember([], EVERYDAY.oats, 40);
    const r2 = remember(r1, EVERYDAY.banana, 100);
    const r3 = remember(r2, EVERYDAY.oats, 50);
    expect(r3.map((f) => [f.id, f.lastGrams])).toEqual([
      ["uk:oats", 50],
      ["uk:banana", 100],
    ]);
  });

  it("speaks in gentle words when numbers are hidden", () => {
    expect(fullnessWord(0, 100)).toBe("Not started");
    expect(fullnessWord(50, 100)).toBe("On your way");
    expect(fullnessWord(140, 100)).toBe("Well fed");
  });

  it("adds up quick adds and servings", () => {
    expect(nutrientsOf({ ...quickEntry("lunch", { kcal: 450, protein: 20 }), portions: 2 })).toMatchObject({ kcal: 900, protein: 40 });
  });
});

describe("Open Food Facts", () => {
  const product = {
    code: "5000000000001",
    product_name: "Wheat biscuits",
    brands: "Brand A, Brand B",
    serving_size: "2 biscuits (37.5 g)",
    serving_quantity: "37.5",
    nutriments: { "energy-kcal_100g": 362, proteins_100g: 12, carbohydrates_100g: 69, fat_100g: 2 },
  };

  it("reads a product as a food, with its portion and first brand", () => {
    expect(fromOff(product)).toEqual({
      id: "off:5000000000001",
      barcode: "5000000000001",
      name: "Wheat biscuits",
      brand: "Brand A",
      source: "off",
      per100: { kcal: 362, protein: 12, carbs: 69, fat: 2 },
      serving: { label: "2 biscuits (37.5 g)", grams: 38 },
    });
  });

  it("works out kcal from kJ and skips products without energy", () => {
    expect(fromOff({ code: "1", product_name: "X", nutriments: { energy_100g: 418.4 } }).per100.kcal).toBe(100);
    expect(fromOff({ code: "2", product_name: "Y", nutriments: {} })).toBeNull();
  });

  it("looks up a barcode and searches British products, sending only the code or words", async () => {
    global.fetch.mockImplementationOnce(() => okJson({ status: 1, product }));
    expect((await lookupBarcode("5000000000001")).name).toBe("Wheat biscuits");
    expect(global.fetch.mock.calls[0][0]).toMatch(/world\.openfoodfacts\.org\/api\/v2\/product\/5000000000001/);

    global.fetch.mockImplementationOnce(() => okJson({ status: 0 }));
    expect(await lookupBarcode("123")).toBeNull();

    global.fetch.mockImplementationOnce(() => okJson({ hits: [{ ...product, brands: ["Weetabix"] }, { code: "x", nutriments: {} }] }));
    const found = await searchProducts("wheat biscuits");
    expect(found).toHaveLength(1);
    expect(found[0].brand).toBe("Weetabix");
    expect(global.fetch.mock.calls[2][0]).toMatch(/search\.openfoodfacts\.org\/search\?.*q=wheat%20biscuits%20countries_tags%3A%22en%3Aunited-kingdom%22/);
  });
});

describe("finding food", () => {
  it("keeps count of what is eaten, and shows the most eaten first", () => {
    const a = { id: "a", name: "A" };
    const b = { id: "b", name: "B" };
    let recent = remember([], a, 10);
    recent = remember(recent, a, 10);
    recent = remember(recent, b, 10);
    expect(recent.map((f) => f.id)).toEqual(["b", "a"]);
    expect(byFrequency(recent).map((f) => [f.id, f.uses])).toEqual([
      ["a", 2],
      ["b", 1],
    ]);
  });

  it("remembers searches without repeats, newest first", () => {
    let s = rememberSearch([], "oats");
    s = rememberSearch(s, " Tomato ");
    s = rememberSearch(s, "OATS");
    s = rememberSearch(s, "a");
    expect(s).toEqual(["OATS", "Tomato"]);
  });

  it("measures a food by its portion or in grams, and only shows facts it knows", () => {
    const tomato = { id: "t", name: "Tomato", per100: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, serving: { label: "Whole", grams: 62 }, more: { sugars: 2.6 } };
    expect(unitsFor(tomato).map((u) => u.label)).toEqual(["Whole (62 g)", "Gram"]);
    expect(unitsFor({ per100: {} }).map((u) => u.key)).toEqual(["g"]);
    expect(unitsFor({ servingsOnly: true }).map((u) => u.key)).toEqual(["serving"]);
    const facts = nutritionFacts(tomato, 200);
    expect(facts.find((f) => f.label === "of which Sugars").value).toBe(5.2);
    expect(facts.some((f) => f.label === "Fibre")).toBe(false);
  });

  it("knows raw and dry foods for weighing before cooking", () => {
    const names = searchLocal("chicken breast").everyday.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["Chicken breast, cooked", "Chicken breast, raw"]));
    expect(searchLocal("uncooked rice").everyday.map((f) => f.name)).toContain("White rice, dry");
    expect(EVERYDAY["rice-dry"].per100).toEqual({ kcal: 355, protein: 6.7, carbs: 85.1, fat: 1 });
    expect(EVERYDAY["rice-dry"].more.fibre).toBe(1.1);
    expect(new Set(Object.keys(EVERYDAY)).size).toBe(Object.keys(EVERYDAY).length);
  });

  it("puts names that start with the search first", () => {
    const foods = [{ name: "Baked beans in tomato sauce" }, { name: "Tomato" }];
    expect(rankByQuery(foods, "tomato").map((f) => f.name)).toEqual(["Tomato", "Baked beans in tomato sauce"]);
  });

  it("keeps searches on the phone when backing up", () => {
    const backup = toBackup({ profile: {}, days: {}, foodLibrary: { foods: [], searches: ["private"], favorites: [{ id: "f" }] } }, "nutrition");
    expect(backup.foodLibrary.searches).toBeUndefined();
    expect(backup.foodLibrary.favorites).toEqual([{ id: "f" }]);
  });

  it("clears the screen for search, and offers recent searches", async () => {
    await mount(FoodAdd, { params: { meal: "breakfast" } });
    expect(screen.getByRole("button", { name: "Barcode" })).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "oats");
    expect(screen.queryByRole("button", { name: "Barcode" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Add Porridge oats" }));
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "");
    await fireEvent(screen.getByLabelText("Search foods"), "focus");
    expect(screen.getByRole("button", { name: "Search for oats" })).toBeOnTheScreen();
  });

  it("stars a food from its own page and finds it under Favourites", async () => {
    await mount(FoodAdd, { params: { meal: "breakfast" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "banana");
    await fireEvent.press(screen.getByRole("button", { name: "Banana, choose amount" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add to favourites" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    await fireEvent.press(screen.getByRole("button", { name: "Favourites" }));
    expect(screen.getByTestId("filtered-foods")).toHaveTextContent(/Banana/);
  });

  it("hides every figure on a food's page with Hide numbers on", async () => {
    await mount(FoodAdd, { params: { meal: "breakfast" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "banana");
    await fireEvent.press(screen.getByRole("button", { name: "Banana, choose amount" }));
    expect(screen.queryByTestId("amount-preview")).toBeNull();
    expect(screen.queryByTestId("nutrition-facts")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Choose amount and unit" }));
    expect(screen.getByTestId("amount-wheel")).toBeOnTheScreen();
  });
});

describe("the diary", () => {
  it("adds a food with one tap and shows it on the diary", async () => {
    await mount(FoodAdd, { params: { meal: "breakfast" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "oats");
    await fireEvent.press(screen.getByRole("button", { name: "Add Porridge oats" }));
    await fireEvent.press(screen.getByRole("button", { name: "Cancel search" }));
    expect(screen.getByTestId("added-count")).toHaveTextContent("1");
    expect(await entries()).toEqual([expect.objectContaining({ meal: "breakfast", name: "Porridge oats", grams: 40 })]);

    await cleanup();
    await showNumbers();
    await mount(Fuel);
    expect(screen.getByRole("button", { name: /^Breakfast, 150 of 463 kcal, 1 items$/ })).toHaveTextContent(/Porridge oats/);
    expect(screen.getByTestId("macro-Protein")).toHaveTextContent("4 / 110 g");
    await fireEvent.press(screen.getByRole("button", { name: "Add food to Lunch" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/food/add", params: { meal: "lunch", date: TODAY } });
  });

  it("keeps what was eaten in Recent for next time", async () => {
    await mount(FoodAdd, { params: { meal: "breakfast" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "banana");
    await fireEvent.press(screen.getByRole("button", { name: "Add Banana" }));
    await cleanup();
    await mount(FoodAdd, { params: { meal: "snacks" } });
    expect(screen.getByTestId("list-foods")).toHaveTextContent(/Banana/);
  });

  it("lets a different amount be chosen", async () => {
    await showNumbers();
    await mount(FoodAdd, { params: { meal: "lunch" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "white rice");
    await fireEvent.press(screen.getByRole("button", { name: "White rice, boiled, choose amount" }));
    await fireEvent.changeText(screen.getByLabelText("Amount"), "2");
    expect(screen.getByTestId("amount-preview")).toHaveTextContent(/^504 kcal/);
    await fireEvent.press(screen.getByRole("button", { name: "Add to Lunch" }));
    expect(await entries()).toEqual([expect.objectContaining({ name: "White rice, boiled", grams: 360 })]);
  });

  it("shows no figures while numbers are hidden", async () => {
    await mount(FoodAdd, { params: { meal: "lunch" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "rice");
    expect(allText(screen.toJSON())).not.toMatch(/kcal/);
  });

  it("says so when products can't be reached, and still finds everyday foods", async () => {
    jest.useFakeTimers();
    await mount(FoodAdd, { params: { meal: "lunch" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "apple");
    await act(async () => {
      jest.advanceTimersByTime(800);
    });
    jest.useRealTimers();
    await act(async () => {});
    expect(screen.getByTestId("search-results")).toHaveTextContent(/Apple/);
    expect(screen.getByTestId("search-results")).toHaveTextContent(/can't be reached/);
  });

  it("quick-adds energy straight into a meal", async () => {
    await mount(FoodCreate, { params: { kind: "quick", meal: "lunch" } });
    expect(screen.getByRole("button", { name: "Add to Lunch" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Energy"), "450");
    await fireEvent.press(screen.getByRole("button", { name: "Add to Lunch" }));
    const [e] = await entries();
    expect(e).toMatchObject({ meal: "lunch", name: "Quick add", fixed: { kcal: 450 } });
  });

  it("creates a food from per-portion values and adds it", async () => {
    await mount(FoodCreate, { params: { kind: "food", meal: "snacks" } });
    await fireEvent.changeText(screen.getByLabelText("Name"), "Bread roll");
    await fireEvent.changeText(screen.getByLabelText("Portion (optional)"), "1 roll");
    await fireEvent.changeText(screen.getByLabelText("Portion weight"), "60");
    await fireEvent.press(screen.getByRole("button", { name: "Per portion" }));
    await fireEvent.changeText(screen.getByLabelText("Energy"), "150");
    await fireEvent.press(screen.getByRole("button", { name: "Save and add to Snacks" }));
    const data = await stored();
    expect(data.foodLibrary.foods[0]).toMatchObject({ name: "Bread roll", per100: { kcal: 250 }, serving: { label: "1 roll", grams: 60 } });
    expect(await entries()).toEqual([expect.objectContaining({ name: "Bread roll", grams: 60 })]);
  });

  it("edits her own food, scanning a barcode onto it, and keeps the same food", async () => {
    const mine = { id: "mine:roll", name: "Bred roll", source: "mine", barcode: null, per100: { kcal: 250, protein: 8, carbs: 48, fat: 3 }, serving: { label: "1 roll", grams: 60 } };
    await mount(FoodCreate, { params: { kind: "food", edit: "mine:roll", meal: "snacks" }, initial: { foodLibrary: { foods: [mine], recent: [{ ...mine, lastGrams: 60, uses: 3 }], favorites: [mine] } } });
    expect(screen.getByText("Edit food")).toBeOnTheScreen();
    expect(screen.getByLabelText("Name").props.value).toBe("Bred roll");
    expect(screen.getByLabelText("Energy").props.value).toBe("250");
    expect(screen.queryByRole("button", { name: "Save and add to Snacks" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Bread roll");
    await fireEvent.press(screen.getByRole("button", { name: "Scan the barcode" }));
    await fireEvent(screen.getByTestId("camera"), "barcodeScanned", { data: "5012345678900", type: "ean13" });
    expect(screen.getByLabelText("Barcode (optional)").props.value).toBe("5012345678900");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    const lib = (await stored()).foodLibrary;
    expect(lib.foods).toHaveLength(1);
    expect(lib.foods[0]).toMatchObject({ id: "mine:roll", name: "Bread roll", barcode: "5012345678900", per100: { kcal: 250 } });
    // the copies in recent and favourites follow, keeping how often it was eaten
    expect(lib.recent[0]).toMatchObject({ name: "Bread roll", uses: 3 });
    expect(lib.favorites[0].name).toBe("Bread roll");
  });

  it("saves a meal of several foods and adds it in one tap", async () => {
    await mount(FoodCreate, { params: { kind: "meal" } });
    await fireEvent.changeText(screen.getByLabelText("Name"), "Cereal with milk");
    await fireEvent.changeText(screen.getByLabelText("Find a food to add"), "cornflakes");
    await fireEvent.press(screen.getByRole("button", { name: "Add Cornflakes" }));
    await fireEvent.changeText(screen.getByLabelText("Find a food to add"), "semi-skimmed");
    await fireEvent.press(screen.getByRole("button", { name: "Add Semi-skimmed milk" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect((await stored()).foodLibrary.meals[0]).toMatchObject({ name: "Cereal with milk" });
    await cleanup();

    await mount(FoodAdd, { params: { meal: "breakfast" } });
    await fireEvent.press(screen.getByRole("button", { name: "Choose a list" }));
    await fireEvent.press(await screen.findByText("My meals"));
    await fireEvent.press(screen.getByRole("button", { name: "Add Cereal with milk" }));
    expect((await entries()).map((e) => e.name)).toEqual(["Cornflakes", "Semi-skimmed milk"]);
  });

  it("writes a recipe with servings and steps", async () => {
    await mount(FoodCreate, { params: { kind: "recipe" } });
    await fireEvent.changeText(screen.getByLabelText("Name"), "Mushroom soup");
    await fireEvent.press(screen.getByRole("button", { name: "More servings" }));
    await fireEvent.changeText(screen.getByLabelText("Find a food to add"), "mushrooms");
    await fireEvent.press(screen.getByRole("button", { name: "Add Mushrooms" }));
    await fireEvent.changeText(screen.getByLabelText("Steps, one per line"), "Slice\nSimmer");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect((await stored()).foodLibrary.recipes[0]).toMatchObject({ name: "Mushroom soup", servings: 2, steps: ["Slice", "Simmer"] });
  });

  it("adds a serving of a Selena recipe", async () => {
    await mount(RecipeDetail, { params: { id: "selena:overnight-oats" } });
    await fireEvent.press(screen.getByRole("button", { name: "Add to Breakfast" }));
    const [e] = await entries();
    expect(e).toMatchObject({ meal: "breakfast", name: "Berry overnight oats", recipeId: "selena:overnight-oats", portions: 1 });
  });

  it("selects foods to copy to another meal and day, or delete them", async () => {
    const { Alert } = require("react-native");
    const alert = jest.spyOn(Alert, "alert").mockImplementation((title, msg, buttons) => buttons.find((b) => b.style === "destructive").onPress());
    const egg = { id: "e1", meal: "breakfast", name: "Egg", fixed: { kcal: 80, protein: 7, carbs: 0, fat: 5 }, portions: 1 };
    const toast = { id: "e2", meal: "breakfast", name: "Toast", fixed: { kcal: 90, protein: 3, carbs: 17, fat: 1 }, portions: 1 };
    await mount(FoodMeal, { params: { meal: "breakfast" }, initial: { days: { [TODAY]: { food: { entries: [egg, toast] } } } } });
    await fireEvent.press(screen.getByRole("button", { name: "Select foods" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Egg" }));
    await fireEvent.press(screen.getByRole("button", { name: "Copy to another meal or day" }));
    expect(screen.getByTestId("copy-sheet")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Lunch" }));
    await fireEvent.press(screen.getByRole("button", { name: "Tomorrow" }));
    await fireEvent.press(screen.getByRole("button", { name: "Copy here" }));
    let data = await stored();
    expect(data.days["2026-10-30"].food.entries).toEqual([expect.objectContaining({ name: "Egg", meal: "lunch" })]);
    expect(data.days["2026-10-30"].food.entries[0].id).not.toBe("e1");
    expect(data.days[TODAY].food.entries).toHaveLength(2);
    expect(screen.getByTestId("meal-notice")).toHaveTextContent("Copied 1 food to Lunch, Tomorrow.");

    await fireEvent.press(screen.getByRole("button", { name: "Select foods" }));
    await fireEvent.press(screen.getByRole("button", { name: "Select all" }));
    await fireEvent.press(screen.getByRole("button", { name: "Delete selected" }));
    data = await stored();
    expect(data.days[TODAY].food.entries).toEqual([]);
    alert.mockRestore();
  });

  it("changes and removes what was logged", async () => {
    await mount(FoodAdd, { params: { meal: "dinner" } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "salmon");
    await fireEvent.press(screen.getByRole("button", { name: "Add Salmon fillet, baked" }));
    await cleanup();

    await mount(FoodMeal, { params: { meal: "dinner" } });
    await fireEvent.press(screen.getByRole("button", { name: "Salmon fillet, baked, choose amount" }));
    await fireEvent.changeText(screen.getByLabelText("Amount"), "2");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect((await entries())[0].grams).toBe(240);
    await fireEvent.press(screen.getByRole("button", { name: "Salmon fillet, baked, choose amount" }));
    await fireEvent.press(screen.getByRole("button", { name: "Remove Salmon fillet, baked" }));
    expect(await entries()).toEqual([]);
  });
});

describe("moving between days", () => {
  const TOMORROW = "2026-10-30";
  const YESTERDAY = "2026-10-28";

  it("steps back and forward, and plans food for tomorrow", async () => {
    await showNumbers();
    await mount(Fuel);
    expect(screen.getByTestId("diary-day")).toHaveTextContent("Today");
    await fireEvent.press(screen.getByRole("button", { name: "Next day" }));
    expect(screen.getByTestId("diary-day")).toHaveTextContent("Tomorrow");
    // the Luteal Buffer belongs to today only
    expect(screen.queryByTestId("luteal-buffer")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Add food to Lunch" }));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/food/add", params: { meal: "lunch", date: TOMORROW } });
    await cleanup();

    await mount(FoodAdd, { params: { meal: "lunch", date: TOMORROW } });
    expect(screen.getByText("Tomorrow")).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "salmon");
    await fireEvent.press(screen.getByRole("button", { name: "Add Salmon fillet, baked" }));
    const data = await stored();
    expect(data.days[TOMORROW].food.entries).toEqual([expect.objectContaining({ name: "Salmon fillet, baked", meal: "lunch" })]);
    expect(data.days[TODAY]?.food?.entries ?? []).toEqual([]);
    await cleanup();

    await mount(Fuel);
    expect(screen.getByRole("button", { name: /^Lunch, 0 of/ })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Next day" }));
    expect(screen.getByRole("button", { name: /^Lunch, 252 of 648 kcal, 1 items$/ })).toHaveTextContent(/Salmon/);
    await fireEvent.press(screen.getByRole("button", { name: "Tomorrow, back to today" }));
    expect(screen.getByTestId("diary-day")).toHaveTextContent("Today");
  });

  it("checks a past day and changes what was logged there", async () => {
    await mount(FoodAdd, { params: { meal: "dinner", date: YESTERDAY } });
    await fireEvent.changeText(screen.getByLabelText("Search foods"), "pasta");
    await fireEvent.press(screen.getByRole("button", { name: "Add Pasta, boiled" }));
    await cleanup();

    await mount(Fuel);
    await fireEvent.press(screen.getByRole("button", { name: "Previous day" }));
    expect(screen.getByTestId("diary-day")).toHaveTextContent("Yesterday");
    expect(screen.getByRole("button", { name: /^Dinner/ })).toHaveTextContent(/Pasta, boiled/);
    await cleanup();

    await mount(FoodMeal, { params: { meal: "dinner", date: YESTERDAY } });
    await fireEvent.press(screen.getByRole("button", { name: "Pasta, boiled, choose amount" }));
    await fireEvent.press(screen.getByRole("button", { name: "Remove Pasta, boiled" }));
    expect((await stored()).days[YESTERDAY].food.entries).toEqual([]);
  });

  it("adds a recipe to the day it was opened for", async () => {
    await mount(RecipeDetail, { params: { id: "selena:hummus-plate", date: TOMORROW, meal: "snacks" } });
    expect(screen.getByText("Add to Tomorrow")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Add to Snacks" }));
    expect((await stored()).days[TOMORROW].food.entries[0]).toMatchObject({ name: "Hummus and crunchy veg", meal: "snacks" });
  });
});

describe("barcodes", () => {
  it("adds a scanned product", async () => {
    global.fetch.mockImplementation(() =>
      okJson({ status: 1, product: { code: "5000000000001", product_name: "Wheat biscuits", nutriments: { "energy-kcal_100g": 362 }, serving_quantity: 38, serving_size: "2 biscuits" } })
    );
    await mount(FoodScan, { params: { meal: "breakfast" } });
    expect(screen.getByTestId("camera")).toBeOnTheScreen();
    await fireEvent(screen.getByTestId("camera"), "barcodeScanned", { data: "5000000000001", type: "ean13" });
    await act(async () => {});
    await fireEvent.press(screen.getByRole("button", { name: "Add to Breakfast" }));
    expect(await entries()).toEqual([expect.objectContaining({ name: "Wheat biscuits", grams: 38 })]);
  });

  it("finds her own food by the barcode she added, without asking the database", async () => {
    const mine = { id: "mine:roll", name: "Bakery roll", source: "mine", barcode: "5012345678900", per100: { kcal: 250, protein: 8, carbs: 48, fat: 3 }, serving: { label: "1 roll", grams: 60 } };
    await mount(FoodScan, { params: { meal: "snacks" }, initial: { foodLibrary: { foods: [mine] } } });
    await fireEvent(screen.getByTestId("camera"), "barcodeScanned", { data: "5012345678900", type: "ean13" });
    await act(async () => {});
    expect(global.fetch).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Add to Snacks" }));
    expect(await entries()).toEqual([expect.objectContaining({ name: "Bakery roll", grams: 60 })]);
  });

  it("offers to create a product that isn't known yet", async () => {
    global.fetch.mockImplementation(() => okJson({ status: 0 }));
    await mount(FoodScan, { params: { meal: "snacks" } });
    await fireEvent.changeText(screen.getByLabelText("Barcode number"), "5012345678900");
    await fireEvent.press(screen.getByRole("button", { name: "Look up barcode" }));
    await act(async () => {});
    await fireEvent.press(screen.getByRole("button", { name: "Create this food" }));
    expect(router.replace).toHaveBeenCalledWith({ pathname: "/food/new", params: { kind: "food", meal: "snacks", barcode: "5012345678900", date: TODAY } });
  });
});

describe("goal and backup", () => {
  it("works out a goal from weight, height, age and activity", () => {
    const g = goalFromBody({ kg: 65, cm: 165, age: 30, activity: "light", aim: "maintain" });
    expect(g).toMatchObject({ resting: 1370, daily: 1884, kcal: 1880, protein: 104, fat: 63, carbs: 224, bodyFat: null });
    // carbs, protein and fat add back up to the energy goal
    expect(g.protein * 4 + g.carbs * 4 + g.fat * 9).toBeCloseTo(g.kcal, -1);
  });

  it("keeps a loss goal gentle and never below resting energy or 1,200 kcal", () => {
    expect(goalFromBody({ kg: 65, cm: 165, age: 30, activity: "light", aim: "lose" })).toMatchObject({ kcal: 1600, protein: 117 });
    const small = goalFromBody({ kg: 45, cm: 150, age: 60, activity: "rest", aim: "lose" });
    expect(small.kcal).toBeGreaterThanOrEqual(MIN_KCAL);
    expect(small.kcal).toBeGreaterThanOrEqual(small.resting - 5);
    expect(goalFromBody({ kg: 65, cm: 165, age: 30, aim: "gain" }).kcal).toBe(2070);
  });

  it("uses tape measurements, when given, to follow lean mass", () => {
    expect(navyBodyFat({ cm: 165, waist: 70, hip: 95, neck: 32 })).toBeCloseTo(24.9, 0);
    expect(navyBodyFat({ cm: 165, waist: 70, hip: 95 })).toBeNull();
    const g = goalFromBody({ kg: 65, cm: 165, age: 30, waist: 70, hip: 95, neck: 32 });
    expect(g.bodyFat).not.toBeNull();
    expect(g.resting).toBe(Math.round(370 + 21.6 * 65 * (1 - g.bodyFat / 100)));
  });

  it("converts stones and feet", () => {
    expect(kgFromStones(10, 3)).toBeCloseTo(64.86, 1);
    expect(cmFromFeet(5, 5)).toBeCloseTo(165.1, 1);
    expect(goalFromBody({ kg: 0, cm: 165, age: 30 })).toBeNull();
  });

  it("invites the user to set a goal, then works it out from her body", async () => {
    await mount(Fuel);
    await fireEvent.press(screen.getByRole("button", { name: "Set up your daily goal" }));
    expect(router.push).toHaveBeenCalledWith("/food/goal");
    await cleanup();

    await mount(FoodGoal);
    expect(screen.getByTestId("nhs-note")).toHaveTextContent(/about 2,000 kcal a day for an adult woman/);
    expect(screen.getByTestId("goal-result")).toHaveTextContent(/Add your weight, height and age/);
    await fireEvent.changeText(screen.getByLabelText("Weight in kilograms"), "65");
    await fireEvent.changeText(screen.getByLabelText("Height in centimetres"), "165");
    expect(screen.getByLabelText("Age in years").props.value).toBe("30");
    expect(screen.getByTestId("goal-result")).toHaveTextContent(/About 1,880 kcal a day/);
    await fireEvent.press(screen.getByRole("radio", { name: "Moderately active" }));
    expect(screen.getByTestId("goal-result")).toHaveTextContent(/About 2,120 kcal a day/);
    await fireEvent.press(screen.getByRole("button", { name: "Use this goal" }));
    const { profile } = await stored();
    expect(profile.nutritionGoal).toEqual({ kcal: 2120, protein: 104, carbs: 266, fat: 71 });
    expect(profile.body).toMatchObject({ kg: 65, cm: 165, age: 30, activity: "moderate", aim: "maintain" });
  });

  it("lets the user skip her body details and type her own goal", async () => {
    await mount(FoodGoal);
    await fireEvent.press(screen.getByRole("tab", { name: "I'll set my own" }));
    expect(screen.queryByLabelText("Weight in kilograms")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Energy goal"), "2000");
    await fireEvent.press(screen.getByRole("button", { name: "Save goal" }));
    const { profile } = await stored();
    expect(profile.nutritionGoal).toMatchObject({ kcal: 2000, protein: 110 });
    expect(profile.goalMode).toBe("own");
    expect(profile.body).toBeUndefined();
  });

  it("never backs up body measurements", () => {
    const data = { profile: { lastPeriod: "2026-10-09", body: { kg: 65, cm: 165 }, baselinePhoto: "file://x.jpg" }, days: {} };
    const payload = toBackup(data, "cycle");
    expect(payload.profile.body).toBeUndefined();
    expect(payload.profile.lastPeriod).toBe("2026-10-09");
    const back = mergeBackup({ profile: { body: { kg: 60 } }, days: {} }, "cycle", { profile: { body: { kg: 99 }, cycleLength: 30 } });
    expect(back.profile).toMatchObject({ body: { kg: 60 }, cycleLength: 30 });
  });

  it("backs up the food library with the diary, and merges it back", () => {
    const lib = { ...emptyLibrary(), foods: [{ id: "mine:a", name: "Roll" }] };
    const payload = toBackup({ profile: {}, days: {}, foodLibrary: lib }, "nutrition");
    expect(payload.foodLibrary.foods).toHaveLength(1);
    expect(toBackup({ profile: {}, days: {}, foodLibrary: lib }, "training").foodLibrary).toBeUndefined();
    const merged = mergeBackup({ days: {}, foodLibrary: { ...emptyLibrary(), foods: [{ id: "mine:b", name: "Soup" }] } }, "nutrition", payload);
    expect(merged.foodLibrary.foods.map((f) => f.id)).toEqual(["mine:b", "mine:a"]);
  });

  it.each([
    ["Fuel", Fuel, {}],
    ["FoodAdd", FoodAdd, { meal: "lunch" }],
    ["FoodCreate", FoodCreate, { kind: "food" }],
    ["FoodScan", FoodScan, { meal: "lunch" }],
    ["FoodMeal", FoodMeal, { meal: "lunch" }],
    ["RecipeDetail", RecipeDetail, { id: "selena:lentil-dal" }],
    ["FoodGoal", FoodGoal, {}],
  ])("%s shows no blocked phrase", async (_name, Screen, params) => {
    await mount(Screen, { params });
    expect(findBlocked(allText(screen.toJSON()))).toEqual([]);
  });
});
