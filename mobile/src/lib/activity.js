/* ---------------------------------------------------------------
   ACTIVITY — movement, yoga, meditation and steps, and roughly what
   they burn. Pure functions only.

   Energy uses MET values from the Compendium of Physical Activities:
   kcal = MET × body weight in kg × hours. Steps use about 0.04 kcal a
   step for a 70 kg body, scaled to the user's weight. Without a weight
   in the profile an everyday 65 kg is assumed, and the screen says so.
   Meditation is logged for its own sake; it burns nothing worth a
   number, so it adds minutes, not calories.
   --------------------------------------------------------------- */

export const DEFAULT_KG = 65;
export const DEFAULT_STEP_GOAL = 8000;

/** group: what the journey counts it as. */
export const ACTIVITY_KINDS = [
  { key: "walk", label: "Walk", met: 3.5, group: "exercise" },
  { key: "run", label: "Run", met: 8, group: "exercise" },
  { key: "strength", label: "Strength", met: 5, group: "exercise" },
  { key: "hiit", label: "HIIT", met: 8, group: "exercise" },
  { key: "cycling", label: "Cycling", met: 7, group: "exercise" },
  { key: "swim", label: "Swimming", met: 6, group: "exercise" },
  { key: "dance", label: "Dance", met: 5, group: "exercise" },
  { key: "pilates", label: "Pilates", met: 3, group: "exercise" },
  { key: "yoga", label: "Yoga", met: 2.5, group: "yoga" },
  { key: "stretch", label: "Stretching", met: 2.3, group: "yoga" },
  { key: "meditation", label: "Meditation", met: 0, group: "meditation" },
  { key: "other", label: "Something else", met: 4, group: "exercise" },
];
export const KIND = Object.fromEntries(ACTIVITY_KINDS.map((k) => [k.key, k]));

/** The tracker's Activities category, read as activity kinds. */
const FROM_JOURNAL = { strength: "strength", running: "run", walking: "walk", yoga: "yoga", pilates: "pilates", swimming: "swim", cycling: "cycling", other: "other" };

export const weightOf = (profile) => (profile?.body?.kg > 0 ? profile.body.kg : DEFAULT_KG);

export const caloriesFor = ({ kind, minutes }, kg = DEFAULT_KG) => Math.round((KIND[kind]?.met ?? 4) * kg * ((Number(minutes) || 0) / 60));

export const stepCalories = (steps, kg = DEFAULT_KG) => Math.round((Number(steps) || 0) * 0.04 * (kg / 70));

/** Every activity of a day: logged here, and from the tracker's Activities. */
export const activitiesOf = (day) => {
  const own = (day?.activities ?? []).map((a) => ({ ...a, source: "activity" }));
  const items = day?.journal?.activities?.items ?? {};
  const tracked = Object.entries(items)
    .filter(([k, v]) => FROM_JOURNAL[k] && v.duration)
    .map(([k, v]) => ({ id: `tracker-${k}`, kind: FROM_JOURNAL[k], minutes: v.duration, title: v.name || null, source: "tracker" }));
  return [...own, ...tracked];
};

/** One day's movement: calories, minutes by group, and steps. */
export const dayMovement = (day, kg = DEFAULT_KG) => {
  const list = activitiesOf(day);
  const minutes = { exercise: 0, yoga: 0, meditation: 0 };
  let kcal = 0;
  for (const a of list) {
    minutes[KIND[a.kind]?.group ?? "exercise"] += Number(a.minutes) || 0;
    kcal += caloriesFor(a, kg);
  }
  const steps = Number(day?.steps) || 0;
  const fromSteps = stepCalories(steps, kg);
  return { list, minutes, steps, activityKcal: kcal, stepKcal: fromSteps, kcal: kcal + fromSteps, moved: list.some((a) => KIND[a.kind]?.group !== "meditation") };
};

/* ---- YouTube ---- */

/** The video id in a YouTube link, or null. */
export const youTubeId = (url = "") => {
  const m = String(url)
    .trim()
    .match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
};

/** A video's title from YouTube's public oEmbed, without any account or key. */
export const fetchVideoTitle = async (url, fetchImpl = fetch) => {
  const id = youTubeId(url);
  if (!id) return null;
  const res = await fetchImpl(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.title ?? null;
};

/** A YouTube search, so suggestions never point at a video that has gone. */
export const youTubeSearch = (words) => `https://www.youtube.com/results?search_query=${encodeURIComponent(words)}`;

/** Gentle practice for each phase, opened as YouTube searches. */
export const PHASE_PRACTICE = {
  menstruation: {
    yoga: { title: "Restorative yoga for your period", sub: "Slow, supported shapes. 15–20 minutes.", search: "restorative yoga for period cramps 20 minutes" },
    meditation: { title: "Body scan to soften", sub: "Lie down and let the day go quiet.", search: "body scan meditation 10 minutes" },
  },
  follicular: {
    yoga: { title: "Energising vinyasa flow", sub: "Rising energy, a little more flow. 20–30 minutes.", search: "energising vinyasa yoga flow 25 minutes" },
    meditation: { title: "Morning focus", sub: "Set an intention for the days ahead.", search: "morning focus meditation 10 minutes" },
  },
  ovulation: {
    yoga: { title: "Strong, open flow", sub: "Your strongest days. Hips, heart and balance.", search: "power yoga flow 30 minutes" },
    meditation: { title: "Loving-kindness", sub: "Connection comes easily now.", search: "loving kindness meditation 10 minutes" },
  },
  luteal: {
    yoga: { title: "Yin yoga to slow down", sub: "Long, quiet holds for a busier mind. 20 minutes.", search: "yin yoga for luteal phase pms 20 minutes" },
    meditation: { title: "Calm for a busy mind", sub: "Breathing to settle cravings and mood.", search: "calming breathing meditation anxiety 10 minutes" },
  },
};
