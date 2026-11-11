import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp } from "./AppState";
import { daysBetween } from "../shared";
import { CONTRACEPTION_METHODS } from "../content/journal";
import { periodMoments } from "../lib/moments";

/* ---------------------------------------------------------------
   TRACKING SESSION — one journal entry in the making.

   Everything picked across the category pages lives here, in memory,
   until the single Save button writes it all at once. Moving between
   pages never saves. Closing the app without saving leaves today's
   saved journal exactly as it was.

   Profile changes (birth control, health profile) are held separately
   and only applied to the profile on Save.
   --------------------------------------------------------------- */

const Session = createContext(null);

export const useTracker = () => {
  const v = useContext(Session);
  if (!v) throw new Error("useTracker must be used inside <TrackerSessionProvider>");
  return v;
};

const clean = (journal) =>
  Object.fromEntries(
    Object.entries(journal).filter(([, e]) => {
      const items = Object.keys(e.items ?? {}).length;
      const choices = Object.values(e.choices ?? {}).filter(Boolean).length;
      return items || choices || (e.entries ?? []).length || e.note || e.profileChange;
    })
  );

/** Whether a period start logged on `day` moves the cycle: a newer period,
 *  or the current one really began a few days earlier. An old cycle stays history. */
export const movesStart = (lastPeriod, day) => !lastPeriod || day >= lastPeriod || daysBetween(day, lastPeriod) <= 10;

let nextId = 0;
const newId = () => `${Date.now().toString(36)}-${(nextId++).toString(36)}`;

export const TrackerSessionProvider = ({ children }) => {
  const { todayKey, dayAt, updateDay, profile, setProfile, showMoments } = useApp();
  // the day being logged: today, or an earlier day she forgot to log
  const [date, setDateState] = useState(todayKey);
  const day = date > todayKey ? todayKey : date;
  const saved = dayAt(day).journal ?? {};
  const savedKey = JSON.stringify(saved);

  const [draft, setDraft] = useState(saved);
  const [profileDraft, setProfileDraft] = useState({});
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Follow the saved journal (a new day, a restored backup) while nothing is being edited.
  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedKey));
  }, [savedKey, dirty]);

  const edit = useCallback((cat, fn) => {
    setDraft((d) => ({ ...d, [cat]: fn(d[cat] ?? {}) }));
    setDirty(true);
    setSavedAt(null);
  }, []);

  const toggleItem = useCallback(
    (cat, key, initial = {}) =>
      edit(cat, (e) => {
        const items = { ...e.items };
        if (items[key]) delete items[key];
        else items[key] = initial;
        return { ...e, items };
      }),
    [edit]
  );

  const setItem = useCallback(
    (cat, key, patch) => edit(cat, (e) => ({ ...e, items: { ...e.items, [key]: { ...e.items?.[key], ...patch } } })),
    [edit]
  );

  const setChoice = useCallback(
    (cat, group, value) =>
      edit(cat, (e) => ({ ...e, choices: { ...e.choices, [group]: e.choices?.[group] === value ? null : value } })),
    [edit]
  );

  const setNote = useCallback((cat, note) => edit(cat, (e) => ({ ...e, note })), [edit]);

  const addEntry = useCallback(
    (cat, entry) => edit(cat, (e) => ({ ...e, entries: [...(e.entries ?? []), { ...entry, id: newId() }] })),
    [edit]
  );

  const removeEntry = useCallback(
    (cat, id) => edit(cat, (e) => ({ ...e, entries: (e.entries ?? []).filter((x) => x.id !== id) })),
    [edit]
  );

  /** A change to the persistent profile, applied only when the session is saved. */
  const setProfileChange = useCallback(
    (cat, patch) => {
      setProfileDraft((p) => ({ ...p, [cat]: { ...p[cat], ...patch } }));
      edit(cat, (e) => ({ ...e, profileChange: true }));
    },
    [edit]
  );

  const discard = useCallback(() => {
    setDraft(JSON.parse(savedKey));
    setProfileDraft({});
    setDirty(false);
  }, [savedKey]);

  /** Switch to another day; whatever was not saved is dropped. */
  const setDate = useCallback(
    (key) => {
      setDateState(key > todayKey ? todayKey : key);
      setProfileDraft({});
      setDirty(false);
      setSavedAt(null);
    },
    [todayKey]
  );

  /** The one save: the whole session, for its day, in a single write. */
  const save = useCallback(() => {
    const journal = clean(draft);
    updateDay(day, (d) => ({ ...d, journal }));

    const patch = {};
    if (profileDraft.contraception) {
      const next = { ...profile.contraception, ...profileDraft.contraception };
      patch.contraception = next;
      const method = CONTRACEPTION_METHODS.find((m) => m.key === next.method);
      if (method) patch.onBirthControl = method.hormonal;
    }
    if (profileDraft.conditions) patch.health = { ...profile.health, ...profileDraft.conditions };
    // logging the first or last day of a period moves the cycle itself
    const flow = journal.flow?.items ?? {};
    // a start logged late counts from the day it really began
    const last = profile.lastPeriod;
    let start = last;
    if (flow.started && movesStart(last, day)) {
      // read before the cycle moves: was this one late? (only for a new period, not a corrected date)
      if (!last || day > last) showMoments(periodMoments(profile, day), day);
      start = day;
      const endsLater = profile.lastPeriodEnd && profile.lastPeriodEnd > day && last && day <= last;
      Object.assign(patch, { lastPeriod: day, lastPeriodUnknown: false, ...(endsLater ? {} : { lastPeriodEnd: null, periodOngoing: true }) });
    }
    if (flow.ended && (!start || day >= start)) Object.assign(patch, { lastPeriodEnd: day, periodOngoing: false });
    if (Object.keys(patch).length) setProfile(patch);

    setProfileDraft({});
    setDirty(false);
    setSavedAt(Date.now());
    return journal;
  }, [draft, profileDraft, profile, day, updateDay, setProfile, showMoments]);

  const value = useMemo(
    () => ({
      date: day,
      isToday: day === todayKey,
      setDate,
      draft,
      saved,
      profileDraft,
      dirty,
      savedAt,
      toggleItem,
      setItem,
      setChoice,
      setNote,
      addEntry,
      removeEntry,
      setProfileChange,
      discard,
      save,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, todayKey, setDate, draft, savedKey, profileDraft, dirty, savedAt, toggleItem, setItem, setChoice, setNote, addEntry, removeEntry, setProfileChange, discard, save]
  );

  return <Session.Provider value={value}>{children}</Session.Provider>;
};
