import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApp, dateKey } from "./AppState";
import { CONTRACEPTION_METHODS } from "../content/journal";

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

let nextId = 0;
const newId = () => `${Date.now().toString(36)}-${(nextId++).toString(36)}`;

export const TrackerSessionProvider = ({ children }) => {
  const { today, setToday, profile, setProfile, now } = useApp();
  const saved = today.journal ?? {};
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

  /** The one save: the whole session, for today, in a single write. */
  const save = useCallback(() => {
    const journal = clean(draft);
    setToday({ journal });

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
    if (flow.started) Object.assign(patch, { lastPeriod: dateKey(now), lastPeriodEnd: null, periodOngoing: true, lastPeriodUnknown: false });
    if (flow.ended) Object.assign(patch, { lastPeriodEnd: dateKey(now), periodOngoing: false });
    if (Object.keys(patch).length) setProfile(patch);

    setProfileDraft({});
    setDirty(false);
    setSavedAt(Date.now());
    return journal;
  }, [draft, profileDraft, profile.contraception, profile.health, setToday, setProfile, now]);

  const value = useMemo(
    () => ({
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
    [draft, savedKey, profileDraft, dirty, savedAt, toggleItem, setItem, setChoice, setNote, addEntry, removeEntry, setProfileChange, discard, save]
  );

  return <Session.Provider value={value}>{children}</Session.Provider>;
};
