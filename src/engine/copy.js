/* ---------------------------------------------------------------
   COPY — every word the engine hands to the UI.
   Nothing here may shame, nag or count at the user.
   --------------------------------------------------------------- */

import { isLuteal } from "./phase.js";

export const BLOCKLIST = ["missed", "failed", "behind", "should have", "lazy", "don't forget"];

/** Words that may never reach the screen in any form. */
export const NEVER_SHOW = ["fail"];

const normalize = (s) => s.toLowerCase().replace(/[’‘]/g, "'");

/** Every blocked phrase found in `text`, empty when the copy is clean. */
export const findBlocked = (text) => {
  const t = normalize(text);
  return [...BLOCKLIST, ...NEVER_SHOW].filter((w) => t.includes(w));
};

/* ---- Imprint Zone — phase-keyed, never a digit ---- */

export const AFFIRMATIONS = {
  menstrual: [
    "Rest is the work today.",
    "You are allowed to move slowly.",
    "Softness is a strategy.",
  ],
  follicular: [
    "Your energy is rising. Let it.",
    "Try the new thing.",
    "Momentum is on your side.",
  ],
  ovulatory: [
    "You are magnetic today.",
    "Say the bold thing out loud.",
    "Strength feels easy here. Use it.",
  ],
  earlyLuteal: [
    "Steady is its own kind of strong.",
    "Keep the rhythm. Skip the sprint.",
    "Consistency, not intensity.",
  ],
  lateLuteal: [
    "The shift inward has started.",
    "Honor the deceleration.",
    "Quiet is not quitting.",
  ],
};

export const affirmationFor = (phase, seed = 0) => {
  const bank = AFFIRMATIONS[phase] ?? AFFIRMATIONS.earlyLuteal;
  return bank[Math.abs(Math.floor(seed)) % bank.length];
};

/* ---- Triad tips — one nudge per save ---- */

export const TRIAD_TIPS = {
  lutealSugar: {
    title: "Dark chocolate and pumpkin seeds.",
    body: "Sweet cravings in the luteal phase often track a dip in progesterone and magnesium. A square of dark chocolate with a handful of pumpkin seeds answers both.",
  },
  hermit: {
    title: "Solitude is allowed.",
    body: "Wanting to be alone right now is chemistry, not a character flaw. Cancel the optional plan without the guilt tax.",
  },
  brainFog: {
    title: "Lighten the load.",
    body: "Pick the one task that matters and let the rest wait. A short walk outside clears more fog than another coffee.",
  },
  sugar: {
    title: "Pair the sweet with protein.",
    body: "Have the treat alongside something with protein or fat so the energy lasts longer than the craving.",
  },
  salt: {
    title: "Salt is a signal.",
    body: "Salty cravings can mean you are low on fluids or electrolytes. Try water with a pinch of salt or a broth.",
  },
  heavyCarb: {
    title: "Choose slow carbs.",
    body: "Oats, potatoes or rice with some protein give the comfort you are after without the crash.",
  },
  calm: {
    title: "Logged. That is enough.",
    body: "Every entry teaches the plan a little more about your rhythm.",
  },
};

/** Exactly one tip for a saved Triad entry. Signals are ids, not labels. */
export const triadTip = ({ signals = [], phase }) => {
  const s = new Set(signals);
  if (s.has("sugar") && isLuteal(phase)) return TRIAD_TIPS.lutealSugar;
  if (s.has("hermit")) return TRIAD_TIPS.hermit;
  if (s.has("brain-fog")) return TRIAD_TIPS.brainFog;
  if (s.has("sugar")) return TRIAD_TIPS.sugar;
  if (s.has("salt")) return TRIAD_TIPS.salt;
  if (s.has("heavy-carb")) return TRIAD_TIPS.heavyCarb;
  return TRIAD_TIPS.calm;
};

/* ---- Progressive disclosure — instruction, rationale, sources ---- */

/** Sources are placeholders until each citation is checked by a human;
 *  the UI shows them as pending rather than inventing a reference. */
export const RATIONALE = {
  prescription: {
    instruction: "Your session follows today's energy, not a fixed calendar.",
    rationale:
      "Training load is matched to how you feel and where you are in your cycle. Inward days protect recovery, Steady days build the base, and Outward days are for the hardest efforts.",
    sources: [
      { kind: "PubMed", label: "Menstrual cycle phase and training response", ref: null },
      { kind: "YouTube", label: "Coach talk on cycle-aware training", ref: null },
    ],
  },
  lutealBuffer: {
    instruction: "An optional extra snack for days your body burns a little more.",
    rationale:
      "Resting energy use rises slightly after ovulation. The buffer gives you room to eat to that need. It is a range you can use or ignore, and it never changes your target on its own.",
    sources: [{ kind: "PubMed", label: "Resting metabolic rate across the menstrual cycle", ref: null }],
  },
  preFlight: {
    instruction: "A small protein snack before a morning session.",
    rationale:
      "Training fasted can raise stress hormones more for women than for men. A light protein snack beforehand helps you train and recover.",
    sources: [{ kind: "YouTube", label: "Fasted training and female physiology", ref: null }],
  },
  postWindow: {
    instruction: "Aim for a protein-rich meal in the next three quarters of an hour.",
    rationale:
      "Eating protein soon after training supports muscle repair. Nothing breaks if the window closes; it is a nudge, not a deadline.",
    sources: [{ kind: "PubMed", label: "Protein timing after resistance training in women", ref: null }],
  },
};

/* ---- Fixed UI copy the engine owns ---- */

export const UI_COPY = {
  pausedDay: "Paused. The streak waits for you.",
  doneDay: "Done.",
  bailoutPrompt: "Not feeling it? You can switch to ten quiet minutes. It still counts as done.",
  vibePrompt: "Tell us how today feels and the plan will follow you.",
  forkPrompt: "The last days before a period can go either way. How is today landing?",
  wipeout: "Low tide. Today is for rest and warmth.",
  surge: "A late surge. Use it, then rest.",
  cardioSwap: (from, to) => `${from} swaps to ${to} today so your hard days stay hard and easy days stay easy.`,
};
