/* ---------------------------------------------------------------
   EVERYDAY FOODS — plain foods without a barcode, so the most common
   things can be found instantly and offline.

   Typical UK values per 100 g (or 100 ml), cooked where that is how it
   is eaten. Carbohydrate is "available" carbohydrate, as on UK labels.
   Each food has one everyday portion so a single tap adds something
   sensible. These are estimates; packaged products come from Open Food
   Facts by barcode or search.
   --------------------------------------------------------------- */

// key, name, kcal, protein, carbs, fat (per 100 g), portion label, portion grams
const ROWS = [
  // grains, bread, potatoes
  ["oats", "Porridge oats", 375, 11, 60, 8, "40 g", 40],
  ["weetabix", "Wholegrain wheat biscuits", 362, 12, 69, 2, "2 biscuits", 38],
  ["cornflakes", "Cornflakes", 378, 7, 84, 0.9, "1 bowl", 30],
  ["granola", "Granola", 450, 9, 60, 18, "1 bowl", 45],
  ["muesli", "Muesli", 360, 10, 62, 6, "1 bowl", 45],
  ["white-bread", "White bread", 235, 8, 46, 2, "1 slice", 36],
  ["wholemeal-bread", "Wholemeal bread", 220, 10, 40, 2.5, "1 slice", 36],
  ["sourdough", "Sourdough bread", 240, 9, 47, 1.5, "1 slice", 50],
  ["bagel", "Bagel, plain", 260, 10, 50, 1.5, "1 bagel", 85],
  ["crumpet", "Crumpet", 190, 6, 38, 0.9, "1 crumpet", 55],
  ["croissant", "Croissant", 410, 8, 45, 22, "1 croissant", 60],
  ["pitta", "Pitta bread", 255, 9, 52, 1.2, "1 pitta", 60],
  ["wrap", "Tortilla wrap", 300, 8, 50, 7, "1 wrap", 62],
  ["rice", "White rice, boiled", 140, 2.8, 31, 0.4, "1 portion", 180],
  ["brown-rice", "Brown rice, boiled", 135, 3, 28, 1, "1 portion", 180],
  ["pasta", "Pasta, boiled", 155, 5.5, 31, 0.9, "1 portion", 180],
  ["wholewheat-pasta", "Wholewheat pasta, boiled", 150, 6, 28, 1.3, "1 portion", 180],
  ["couscous", "Couscous, cooked", 112, 3.8, 23, 0.2, "1 portion", 150],
  ["quinoa", "Quinoa, cooked", 120, 4.4, 21, 1.9, "1 portion", 150],
  ["potato", "Potatoes, boiled", 77, 1.8, 17, 0.1, "1 portion", 175],
  ["jacket-potato", "Jacket potato", 100, 2.5, 21, 0.1, "1 potato", 220],
  ["sweet-potato", "Sweet potato, baked", 90, 2, 21, 0.2, "1 portion", 150],
  ["oven-chips", "Oven chips", 160, 3, 26, 4.5, "1 portion", 150],

  // protein
  ["egg", "Egg", 143, 12.6, 0.7, 9.9, "1 egg", 58],
  ["chicken-breast", "Chicken breast, cooked", 165, 31, 0, 3.6, "1 breast", 120],
  ["chicken-thigh", "Chicken thigh, cooked, skinless", 205, 26, 0, 11, "2 thighs", 100],
  ["turkey-mince", "Turkey mince, cooked", 190, 27, 0, 9, "1 portion", 125],
  ["beef-mince", "Beef mince 5% fat, cooked", 175, 27, 0, 7.5, "1 portion", 125],
  ["steak", "Sirloin steak, grilled", 205, 29, 0, 10, "1 steak", 170],
  ["pork-chop", "Pork chop, grilled", 230, 30, 0, 12, "1 chop", 150],
  ["bacon", "Back bacon, grilled", 290, 24, 0, 21, "1 rasher", 25],
  ["ham", "Ham, sliced", 110, 18, 1.5, 3.5, "2 slices", 40],
  ["salmon", "Salmon fillet, baked", 210, 23, 0, 13, "1 fillet", 120],
  ["cod", "Cod fillet, baked", 100, 22, 0, 1, "1 fillet", 140],
  ["tuna", "Tuna in spring water, drained", 110, 25, 0, 1, "1 can", 112],
  ["prawns", "Prawns, cooked", 70, 16, 0, 0.9, "1 portion", 100],
  ["tofu", "Tofu, firm", 125, 13, 1.5, 7.5, "1 portion", 100],
  ["lentils", "Red lentils, boiled", 100, 7.6, 17.5, 0.4, "1 portion", 150],
  ["chickpeas", "Chickpeas, canned, drained", 115, 7.2, 16, 2.9, "half a can", 120],
  ["baked-beans", "Baked beans in tomato sauce", 78, 4.7, 12.5, 0.2, "half a can", 207],
  ["kidney-beans", "Kidney beans, canned, drained", 100, 7, 15, 0.5, "half a can", 120],
  ["hummus", "Hummus", 300, 7, 12, 25, "2 tbsp", 30],

  // dairy and alternatives
  ["milk-semi", "Semi-skimmed milk", 47, 3.5, 4.8, 1.7, "1 glass", 200],
  ["milk-whole", "Whole milk", 64, 3.3, 4.7, 3.6, "1 glass", 200],
  ["milk-skimmed", "Skimmed milk", 35, 3.5, 5, 0.1, "1 glass", 200],
  ["oat-drink", "Oat drink", 45, 1, 6.5, 1.5, "1 glass", 200],
  ["greek-yoghurt", "Greek-style yoghurt", 130, 6, 4, 10, "1 pot", 150],
  ["greek-yoghurt-0", "Greek yoghurt, 0% fat", 57, 10, 3.6, 0.2, "1 pot", 150],
  ["natural-yoghurt", "Natural yoghurt", 75, 5, 7, 3, "1 pot", 125],
  ["cheddar", "Cheddar", 415, 25, 0.1, 35, "1 slice", 30],
  ["mozzarella", "Mozzarella", 255, 18, 1, 20, "half a ball", 60],
  ["feta", "Feta", 265, 15, 1.5, 21.5, "1 portion", 30],
  ["cottage-cheese", "Cottage cheese", 100, 11, 3, 4.3, "1 portion", 100],
  ["butter", "Butter", 740, 0.6, 0.6, 82, "1 portion", 10],

  // fats, nuts, seeds
  ["olive-oil", "Olive oil", 899, 0, 0, 100, "1 tbsp", 14],
  ["peanut-butter", "Peanut butter", 600, 25, 13, 50, "1 tbsp", 15],
  ["avocado", "Avocado", 190, 1.9, 1.9, 19.5, "half", 75],
  ["almonds", "Almonds", 610, 21, 7, 55, "1 handful", 30],
  ["walnuts", "Walnuts", 690, 15, 3, 69, "1 handful", 30],
  ["pumpkin-seeds", "Pumpkin seeds", 570, 24, 15, 46, "1 tbsp", 15],
  ["dark-chocolate", "Dark chocolate, 70%", 580, 8, 35, 43, "2 squares", 20],
  ["milk-chocolate", "Milk chocolate", 530, 7.5, 57, 30, "1 bar", 45],

  // fruit
  ["apple", "Apple", 52, 0.4, 12, 0.1, "1 apple", 130],
  ["banana", "Banana", 95, 1.2, 23, 0.3, "1 banana", 100],
  ["orange", "Orange", 40, 1.1, 8.5, 0.1, "1 orange", 160],
  ["strawberries", "Strawberries", 30, 0.6, 6, 0.5, "1 handful", 80],
  ["blueberries", "Blueberries", 57, 0.7, 14, 0.3, "1 handful", 80],
  ["raspberries", "Raspberries", 30, 1.4, 4.6, 0.3, "1 handful", 80],
  ["grapes", "Grapes", 65, 0.4, 15, 0.1, "1 handful", 80],
  ["pear", "Pear", 40, 0.3, 10, 0.1, "1 pear", 160],
  ["mango", "Mango", 60, 0.7, 14, 0.2, "1 slice", 80],
  ["dates", "Medjool dates", 280, 1.8, 66, 0.2, "1 date", 24],
  ["raisins", "Raisins", 290, 2.1, 69, 0.4, "1 small box", 30],

  // vegetables
  ["broccoli", "Broccoli, boiled", 24, 3.1, 1.1, 0.8, "1 portion", 80],
  ["spinach", "Spinach", 25, 2.8, 1.6, 0.8, "1 handful", 30],
  ["carrots", "Carrots", 34, 0.6, 7.9, 0.3, "1 carrot", 80],
  ["tomato", "Tomato", 17, 0.7, 3.1, 0.3, "1 tomato", 80],
  ["chopped-tomatoes", "Chopped tomatoes, canned", 22, 1.1, 3.8, 0.2, "half a can", 200],
  ["cucumber", "Cucumber", 10, 0.7, 1.5, 0.1, "1 portion", 80],
  ["pepper", "Red pepper", 32, 1, 6.4, 0.4, "half a pepper", 80],
  ["onion", "Onion", 36, 1.2, 7.9, 0.2, "1 small onion", 80],
  ["mushrooms", "Mushrooms", 13, 1.8, 0.4, 0.5, "1 portion", 80],
  ["peas", "Peas, boiled", 70, 6, 9.7, 0.9, "1 portion", 80],
  ["sweetcorn", "Sweetcorn, canned", 95, 3, 17, 1.4, "1 portion", 80],
  ["green-beans", "Green beans, boiled", 25, 1.7, 3.5, 0.1, "1 portion", 80],
  ["salad-leaves", "Mixed salad leaves", 15, 1, 1.7, 0.3, "1 handful", 30],
  ["kale", "Kale", 33, 3, 1.5, 1.5, "1 handful", 30],

  // snacks, sweet things, drinks
  ["crisps", "Crisps, ready salted", 530, 6, 52, 33, "1 bag", 25],
  ["digestive", "Digestive biscuit", 485, 7, 62, 21, "1 biscuit", 15],
  ["rice-cake", "Rice cake", 385, 8, 80, 3, "1 cake", 8],
  ["honey", "Honey", 304, 0.3, 82, 0, "1 tsp", 7],
  ["jam", "Jam", 250, 0.4, 60, 0.1, "1 tbsp", 15],
  ["sugar", "Sugar", 400, 0, 100, 0, "1 tsp", 4],
  ["latte", "Latte, semi-skimmed", 50, 3.3, 4.8, 1.8, "1 medium", 350],
  ["cappuccino", "Cappuccino, semi-skimmed", 40, 2.7, 3.9, 1.5, "1 medium", 250],
  ["coffee", "Black coffee", 2, 0.3, 0, 0, "1 mug", 250],
  ["tea-milk", "Tea with milk", 7, 0.4, 0.6, 0.3, "1 mug", 250],
  ["orange-juice", "Orange juice", 45, 0.7, 10, 0.1, "1 glass", 200],
  ["red-wine", "Red wine", 85, 0.1, 2.6, 0, "1 glass", 175],
  ["lager", "Lager", 43, 0.3, 3.6, 0, "1 pint", 568],
  ["whey", "Whey protein powder", 390, 78, 7, 6, "1 scoop", 30],
];

/** Everyday words people search with, so "weetabix" finds the wheat biscuits. */
const ALSO = {
  weetabix: "weetabix",
  oats: "porridge",
  "milk-semi": "semi skimmed",
  "oat-drink": "oat milk",
  "greek-yoghurt": "greek yogurt",
  "greek-yoghurt-0": "greek yogurt fat free",
  "natural-yoghurt": "plain yogurt",
  "jacket-potato": "baked potato",
  "oven-chips": "fries",
  crisps: "chips",
  prawns: "shrimp",
  "chopped-tomatoes": "tinned tomatoes",
  "tea-milk": "cuppa",
  whey: "protein shake",
  pepper: "bell pepper",
};

export const EVERYDAY_FOODS = ROWS.map(([key, name, kcal, protein, carbs, fat, label, grams]) => ({
  id: `uk:${key}`,
  name,
  aka: ALSO[key] ?? null,
  source: "uk",
  per100: { kcal, protein, carbs, fat },
  serving: { label, grams },
}));

export const EVERYDAY = Object.fromEntries(EVERYDAY_FOODS.map((f) => [f.id.slice(3), f]));
