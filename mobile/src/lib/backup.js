/* ---------------------------------------------------------------
   BACKUP CATEGORIES — what each ticked box sends, and how it comes back.
   Pure functions only; the network lives in useBackup.
   The baseline photo is never part of any category.
   --------------------------------------------------------------- */

import { CATEGORIES } from "../content/journal";

/** Journal categories that are private: they never leave the phone. */
export const PRIVATE_JOURNAL = CATEGORIES.filter((c) => c.private).map((c) => c.key);

export const BACKUP_CATEGORIES = [
  {
    key: "cycle",
    label: "Cycle details",
    sub: "Last period, cycle length, age group, birth control and what you track.",
  },
  {
    key: "logs",
    label: "Daily check-ins",
    sub: "Vibe Check, Tracker symptoms, moods and your streak. Sex, birth control, medication and health profile are never backed up.",
  },
  {
    key: "training",
    label: "Training",
    sub: "Movement minutes and cardio choices.",
  },
  {
    key: "nutrition",
    label: "Nutrition",
    sub: "Food log and Luteal Buffer choices.",
  },
];

/** Nothing is backed up until the user ticks it. */
export const DEFAULT_BACKUP = { cycle: false, logs: false, training: false, nutrition: false };

/** Day fields owned by each category. */
const DAY_FIELDS = {
  logs: ["vibe", "checkIn", "triad", "entry", "journal"],
  training: ["movement", "cardio"],
  nutrition: ["food", "bufferAccepted", "bufferDismissed"],
};

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

/** The payload one category sends. Never contains the photo. */
export const toBackup = (data, category) => {
  if (category === "cycle") {
    const { baselinePhoto, ...profile } = data.profile; // eslint-disable-line no-unused-vars
    return { profile, agreement: data.agreement, onboarded: data.onboarded };
  }
  const fields = DAY_FIELDS[category];
  const days = {};
  for (const [date, day] of Object.entries(data.days ?? {})) {
    const part = pick(day, fields);
    if (part.journal) {
      // private categories stay on this phone, always
      part.journal = Object.fromEntries(Object.entries(part.journal).filter(([k]) => !PRIVATE_JOURNAL.includes(k)));
    }
    if (Object.keys(part).length) days[date] = part;
  }
  return { days };
};

/** Fold one downloaded category into local data. On the same day, what is on
 *  this device wins; the photo always stays as it is here. */
export const mergeBackup = (data, category, payload) => {
  if (!payload) return data;
  if (category === "cycle") {
    return {
      ...data,
      onboarded: data.onboarded || !!payload.onboarded,
      agreement: data.agreement ?? payload.agreement ?? null,
      profile: { ...data.profile, ...payload.profile, baselinePhoto: data.profile.baselinePhoto },
    };
  }
  const days = { ...data.days };
  for (const [date, remote] of Object.entries(payload.days ?? {})) {
    days[date] = { ...remote, ...days[date] };
  }
  return { ...data, days };
};
