import { EVERYDAY } from "./foods";

/* ---------------------------------------------------------------
   SELENA RECIPES — simple everyday dishes, each tagged with the
   phases it suits. Ingredients are everyday foods, so the values per
   serving are worked out the same way as anything else in the diary.

   menstruation  warmth, iron and comfort
   follicular    fresh, light, plenty of protein
   ovulation     fibre, colour and lighter plates
   luteal        steady complex carbs and magnesium
   --------------------------------------------------------------- */

const ing = (key, grams) => ({ food: EVERYDAY[key], grams });

export const RECIPE_CATEGORIES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

export const SELENA_RECIPES = [
  {
    id: "selena:overnight-oats",
    name: "Berry overnight oats",
    category: "breakfast",
    phases: ["follicular", "ovulation"],
    vegetarian: true,
    minutes: 5,
    servings: 1,
    items: [ing("oats", 50), ing("milk-semi", 150), ing("greek-yoghurt-0", 75), ing("blueberries", 80)],
    steps: [
      "Stir the oats, milk and yoghurt together in a jar.",
      "Cover and leave in the fridge overnight.",
      "Top with the blueberries in the morning.",
    ],
  },
  {
    id: "selena:choc-porridge",
    name: "Dark chocolate and almond porridge",
    category: "breakfast",
    phases: ["luteal", "menstruation"],
    vegetarian: true,
    minutes: 10,
    servings: 1,
    items: [ing("oats", 50), ing("milk-semi", 250), ing("banana", 100), ing("dark-chocolate", 10), ing("almonds", 15)],
    steps: [
      "Simmer the oats in the milk for 4–5 minutes, stirring.",
      "Slice in half the banana and stir until creamy.",
      "Top with the rest of the banana, the chopped chocolate and almonds.",
    ],
  },
  {
    id: "selena:avocado-eggs",
    name: "Eggs and avocado on sourdough",
    category: "breakfast",
    phases: ["follicular", "menstruation"],
    vegetarian: true,
    minutes: 10,
    servings: 1,
    items: [ing("sourdough", 50), ing("egg", 116), ing("avocado", 75), ing("spinach", 30)],
    steps: ["Toast the sourdough.", "Poach or scramble the eggs.", "Mash the avocado onto the toast, add the spinach and eggs on top."],
  },
  {
    id: "selena:salmon-quinoa",
    name: "Salmon, quinoa and greens bowl",
    category: "lunch",
    phases: ["follicular", "ovulation"],
    vegetarian: false,
    minutes: 20,
    servings: 1,
    items: [ing("salmon", 120), ing("quinoa", 150), ing("spinach", 30), ing("avocado", 75), ing("cucumber", 80)],
    steps: [
      "Bake the salmon at 200°C for 12–15 minutes.",
      "Warm the cooked quinoa and fold through the spinach.",
      "Top with the salmon, sliced avocado and cucumber.",
    ],
  },
  {
    id: "selena:chickpea-salad",
    name: "Chickpea, feta and tomato salad",
    category: "lunch",
    phases: ["ovulation"],
    vegetarian: true,
    minutes: 10,
    servings: 1,
    items: [ing("chickpeas", 120), ing("feta", 30), ing("tomato", 80), ing("cucumber", 80), ing("salad-leaves", 30), ing("olive-oil", 7)],
    steps: ["Chop the tomato and cucumber.", "Toss with the chickpeas, leaves and olive oil.", "Crumble the feta over the top."],
  },
  {
    id: "selena:lentil-dal",
    name: "Red lentil and spinach dal",
    category: "dinner",
    phases: ["menstruation", "luteal"],
    vegetarian: true,
    minutes: 30,
    servings: 2,
    items: [ing("lentils", 300), ing("onion", 80), ing("chopped-tomatoes", 200), ing("spinach", 60), ing("olive-oil", 14), ing("rice", 360)],
    steps: [
      "Soften the chopped onion in the oil.",
      "Add the lentils and tomatoes with a splash of water and simmer for 15 minutes.",
      "Stir in the spinach until it wilts, and serve with the rice.",
    ],
  },
  {
    id: "selena:turkey-chilli",
    name: "Turkey and bean chilli",
    category: "dinner",
    phases: ["luteal"],
    vegetarian: false,
    minutes: 35,
    servings: 2,
    items: [ing("turkey-mince", 250), ing("kidney-beans", 240), ing("chopped-tomatoes", 400), ing("onion", 80), ing("pepper", 160), ing("rice", 360)],
    steps: [
      "Brown the mince with the onion and pepper.",
      "Add the tomatoes and beans with chilli and cumin to taste.",
      "Simmer for 20 minutes and serve with the rice.",
    ],
  },
  {
    id: "selena:chicken-sweet-potato",
    name: "Chicken, sweet potato and broccoli",
    category: "dinner",
    phases: ["luteal", "follicular"],
    vegetarian: false,
    minutes: 30,
    servings: 1,
    items: [ing("chicken-breast", 120), ing("sweet-potato", 150), ing("broccoli", 80), ing("olive-oil", 7)],
    steps: [
      "Roast the sweet potato in wedges with the oil at 200°C for 25 minutes.",
      "Cook the chicken alongside for the last 18–20 minutes.",
      "Steam the broccoli and serve together.",
    ],
  },
  {
    id: "selena:yoghurt-walnuts",
    name: "Yoghurt, raspberries and walnuts",
    category: "snack",
    phases: ["luteal"],
    vegetarian: true,
    minutes: 3,
    servings: 1,
    items: [ing("greek-yoghurt", 150), ing("raspberries", 80), ing("walnuts", 15), ing("honey", 7)],
    steps: ["Spoon the yoghurt into a bowl.", "Top with the raspberries, broken walnuts and a drizzle of honey."],
  },
  {
    id: "selena:hummus-plate",
    name: "Hummus and crunchy veg",
    category: "snack",
    phases: ["ovulation", "follicular"],
    vegetarian: true,
    minutes: 5,
    servings: 1,
    items: [ing("hummus", 60), ing("carrots", 80), ing("cucumber", 80), ing("pitta", 60)],
    steps: ["Cut the carrot, cucumber and warm pitta into strips.", "Dip into the hummus."],
  },
];
