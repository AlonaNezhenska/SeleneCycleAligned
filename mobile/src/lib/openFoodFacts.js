import { Platform } from "react-native";

/* ---------------------------------------------------------------
   OPEN FOOD FACTS — the free, open database of packaged foods.

   Only a barcode or the words typed into search are sent. What was
   eaten, and when, never leaves the phone. Search asks for the UK
   (cc=uk), so British products come first. The service asks apps to
   name themselves and to keep searches gentle, so search waits for a
   pause in typing.
   --------------------------------------------------------------- */

// Phones name the app as the service asks; a browser may not set this
// header, and trying would block the request.
const HEADERS = Platform.OS === "web" ? {} : { "User-Agent": "Selena/1.0 (cycle-aligned wellness app)" };
const FIELDS = "code,product_name,product_name_en,generic_name,brands,nutriments,serving_size,serving_quantity";
const TIMEOUT = 9000;

const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
  return Number.isFinite(n) ? n : null;
};

/** A product as a Selena food, or null when it has no usable energy value. */
export const fromOff = (p) => {
  if (!p) return null;
  const n = p.nutriments ?? {};
  const kcal = num(n["energy-kcal_100g"]) ?? (num(n.energy_100g) != null ? num(n.energy_100g) / 4.184 : null);
  const name = (p.product_name_en || p.product_name || p.generic_name || "").trim();
  if (kcal == null || !name) return null;
  const grams = num(p.serving_quantity);
  const more = Object.fromEntries(
    [
      ["fibre", n.fiber_100g],
      ["sugars", n.sugars_100g],
      ["saturates", n["saturated-fat_100g"]],
      ["salt", n.salt_100g],
    ]
      .map(([key, v]) => [key, num(v)])
      .filter(([, v]) => v != null)
  );
  return {
    id: `off:${p.code}`,
    barcode: p.code,
    name,
    brand: (p.brands ?? "").split(",")[0].trim() || null,
    source: "off",
    per100: {
      kcal: Math.round(kcal),
      protein: num(n.proteins_100g) ?? 0,
      carbs: num(n.carbohydrates_100g) ?? 0,
      fat: num(n.fat_100g) ?? 0,
    },
    serving: grams && grams > 0 ? { label: p.serving_size?.trim() || "1 serving", grams: Math.round(grams) } : null,
    ...(Object.keys(more).length ? { more } : {}),
  };
};

const get = async (url, fetchImpl) => {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT) : null;
  try {
    const res = await fetchImpl(url, { headers: HEADERS, signal: ctrl?.signal });
    if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/** The product behind a barcode, or null if it is not in the database. */
export const lookupBarcode = async (code, fetchImpl = fetch) => {
  const clean = String(code).replace(/\D/g, "");
  if (!clean) return null;
  const json = await get(`https://world.openfoodfacts.org/api/v2/product/${clean}?fields=${FIELDS}`, fetchImpl);
  return json?.status === 1 ? fromOff(json.product) : null;
};

/** Products matching the words, British first. */
export const searchProducts = async (query, fetchImpl = fetch) => {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_simple=1&page_size=24&cc=uk&lc=en" +
    `&fields=${FIELDS}&search_terms=${encodeURIComponent(q)}`;
  const json = await get(url, fetchImpl);
  return (json?.products ?? []).map(fromOff).filter(Boolean);
};
