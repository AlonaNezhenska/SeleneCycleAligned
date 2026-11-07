import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deriveToday, sunset, resumeOnOpen, AGREEMENT_VERSION } from "../shared";
import { DEFAULT_BACKUP } from "../lib/backup";
import { emptyLibrary, remember, rememberSearch, toggleFavorite as flipFavorite, newId } from "../lib/food";
import { forgetPhoto } from "../lib/photos";
import { useBackup } from "./useBackup";

/* ---------------------------------------------------------------
   APP STATE — everything the user tells Selena, kept on the device.
   Nothing leaves the phone: no account, no network.
   --------------------------------------------------------------- */

export const STATE_KEY = "selena.state.v1";
export const HIDE_KEY = "selena.hideNumbers";
export const ACTIVE_KEY = "selena.lastActive";

/** Local calendar date, so "today" follows the user's own midnight. */
export const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const daysAgo = (n, from) => {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
};

// eslint-disable-next-line no-unused-vars
export const defaultProfile = (now) => ({
  goal: null,
  ageGroup: "20s/30s",
  onBirthControl: false,
  hurdles: [],
  trackingStyle: "Protein & Calories only",
  baselinePhoto: null,
  // the cycle is always tracked; these two are the user's choice
  tracking: { training: true, nutrition: true },
  // nothing about the cycle is assumed until the user says so
  lastPeriod: null,
  lastPeriodEnd: null,
  periodOngoing: false,
  lastPeriodUnknown: false,
  previousPeriod: null,
  previousPeriodUnknown: false,
  cycleMode: "exact",
  cycleLength: 28,
  cycleVaries: false,
  cycleLengthMin: 26,
  cycleLengthMax: 32,
  periodMode: "exact",
  periodLength: 5,
  periodVaries: false,
  periodLengthMin: 3,
  periodLengthMax: 7,
});

export const emptyDay = () => ({
  vibe: null,
  checkIn: { social: null, drive: null },
  cardio: null,
  triad: {},
  entry: null,
  bufferAccepted: false,
  bufferDismissed: false,
  journal: {},
});

const AppState = createContext(null);

export const useApp = () => {
  const v = useContext(AppState);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
};

/**
 * `now` and `initial` exist for tests and previews; the app passes neither.
 * `initial` is merged over what is stored, so a test can start mid-cycle.
 */
export const AppProvider = ({ children, now: fixedNow, initial }) => {
  const now = useMemo(() => fixedNow ?? new Date(), [fixedNow]);
  const todayKey = dateKey(now);
  const [ready, setReady] = useState(false);
  const fresh = () => ({
    onboarded: false,
    agreement: null,
    backup: DEFAULT_BACKUP,
    profile: defaultProfile(now),
    days: {},
    saved: {},
    // the user's own foods, saved meals, recipes and recently eaten
    foodLibrary: emptyLibrary(),
    // pictures already shown, so each appears once
    seenMoments: [],
    // progress photos: on this phone only, never backed up
    photos: [],
    // strength training: her routines, finished workouts, the one in progress
    routines: [],
    workouts: [],
    activeWorkout: null,
    customExercises: [],
    // body measurements over time: on this phone only, never backed up
    measures: [],
  });
  const [data, setData] = useState(fresh);
  const [hideNumbers, setHideNumbersState] = useState(true);
  const [session, setSessionState] = useState({ startedAt: null, endedAt: null, bailoutOffered: false, bailoutVisible: false });
  const hydrated = useRef(false);

  // Load once. A failed read just means a fresh start.
  useEffect(() => {
    let alive = true;
    (async () => {
      let stored = null;
      let hide = null;
      try {
        [stored, hide] = await Promise.all([AsyncStorage.getItem(STATE_KEY), AsyncStorage.getItem(HIDE_KEY)]);
        // 72-Hour Sunset Protocol: after a long absence, resume without comment.
        const last = Number(await AsyncStorage.getItem(ACTIVE_KEY));
        const resumed = last && sunset(last, now.getTime()) ? resumeOnOpen(now.getTime()) : { lastActive: now.getTime() };
        await AsyncStorage.setItem(ACTIVE_KEY, String(resumed.lastActive));
      } catch {
        /* storage unavailable */
      }
      if (!alive) return;
      setData((d) => {
        const base = stored ? { ...d, ...JSON.parse(stored) } : d;
        if (!initial) return base;
        return { ...base, ...initial, profile: { ...base.profile, ...initial.profile } };
      });
      if (hide != null) setHideNumbersState(JSON.parse(hide));
      hydrated.current = true;
      setReady(true);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const setHideNumbers = useCallback((v) => {
    setHideNumbersState(v);
    AsyncStorage.setItem(HIDE_KEY, JSON.stringify(v)).catch(() => {});
  }, []);

  const today = { ...emptyDay(), ...data.days[todayKey] };

  const setProfile = useCallback((patch) => setData((d) => ({ ...d, profile: { ...d.profile, ...patch } })), []);
  const setToday = useCallback(
    (patch) =>
      setData((d) => ({
        ...d,
        days: { ...d.days, [todayKey]: { ...emptyDay(), ...d.days[todayKey], ...patch } },
      })),
    [todayKey]
  );
  /** Change one day from what it is now, so quick taps never overwrite each other. */
  const updateDay = useCallback(
    (key, fn) => setData((d) => ({ ...d, days: { ...d.days, [key]: fn({ ...emptyDay(), ...d.days[key] }) } })),
    []
  );
  const updateLibrary = useCallback((fn) => setData((d) => ({ ...d, foodLibrary: fn({ ...emptyLibrary(), ...d.foodLibrary }) })), []);
  const editEntries = useCallback(
    (key, fn) => updateDay(key, (day) => ({ ...day, food: { ...day.food, entries: fn(day.food?.entries ?? []) } })),
    [updateDay]
  );

  /** Add diary entries to a day (today unless given) and remember the foods for next time. */
  const addFoodEntries = useCallback(
    (entries, key = todayKey) => {
      editEntries(key, (list) => [...list, ...entries]);
      updateLibrary((lib) => entries.reduce((l, e) => (e.food ? { ...l, recent: remember(l.recent, e.food, e.grams) } : l), lib));
    },
    [editEntries, updateLibrary, todayKey]
  );
  const updateFoodEntry = useCallback(
    (id, patch, key = todayKey) => editEntries(key, (list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [editEntries, todayKey]
  );
  const removeFoodEntry = useCallback((id, key = todayKey) => editEntries(key, (list) => list.filter((e) => e.id !== id)), [editEntries, todayKey]);

  /** Save or replace one of the user's own foods, meals or recipes. */
  // pictures waiting to be shown: in memory only, one at a time
  const [moments, setMoments] = useState([]);
  const showMoments = useCallback((keys, date) => {
    setMoments((q) => [...q, ...keys.filter((k) => !q.includes(k))]);
    setData((d) => ({ ...d, seenMoments: [...keys.map((k) => `${k}:${date}`), ...(d.seenMoments ?? [])].slice(0, 60) }));
  }, []);
  const closeMoment = useCallback(() => setMoments((q) => q.slice(1)), []);

  const saveSearch = useCallback((query) => updateLibrary((lib) => ({ ...lib, searches: rememberSearch(lib.searches, query) })), [updateLibrary]);
  const toggleFavorite = useCallback((food) => updateLibrary((lib) => ({ ...lib, favorites: flipFavorite(lib.favorites, food) })), [updateLibrary]);

  const saveToLibrary = useCallback(
    (kind, item) => updateLibrary((lib) => ({ ...lib, [kind]: [item, ...lib[kind].filter((x) => x.id !== item.id)] })),
    [updateLibrary]
  );
  const removeFromLibrary = useCallback((kind, id) => updateLibrary((lib) => ({ ...lib, [kind]: lib[kind].filter((x) => x.id !== id) })), [updateLibrary]);

  /** Movement logged in Workouts: walks, sessions, yoga videos, meditation. */
  const addActivity = useCallback(
    (activity, key = todayKey) => updateDay(key, (day) => ({ ...day, activities: [...(day.activities ?? []), { id: newId(), ...activity }] })),
    [updateDay, todayKey]
  );
  const removeActivity = useCallback(
    (id, key = todayKey) => updateDay(key, (day) => ({ ...day, activities: (day.activities ?? []).filter((a) => a.id !== id) })),
    [updateDay, todayKey]
  );
  /* ---- workouts ---- */

  /** Begin a workout, empty or from a routine; it survives closing the app. */
  const startWorkout = useCallback(
    ({ name = "Workout", routineId = null, exercises = [] } = {}) =>
      setData((d) => ({ ...d, activeWorkout: { id: newId(), name, routineId, startedAt: Date.now(), exercises } })),
    []
  );
  const updateWorkout = useCallback((fn) => setData((d) => (d.activeWorkout ? { ...d, activeWorkout: fn(d.activeWorkout) } : d)), []);
  const discardWorkout = useCallback(() => setData((d) => ({ ...d, activeWorkout: null })), []);
  /** Keep the finished workout, and add it to today's activity so it counts everywhere. */
  const finishWorkout = useCallback(
    (note = "") =>
      setData((d) => {
        const w = d.activeWorkout;
        if (!w) return d;
        const endedAt = Date.now();
        const minutes = Math.max(1, Math.round((endedAt - w.startedAt) / 60000));
        const done = { ...w, endedAt, date: todayKey, note, exercises: w.exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })).filter((e) => e.sets.length) };
        const day = { ...emptyDay(), ...d.days[todayKey] };
        return {
          ...d,
          activeWorkout: null,
          workouts: [done, ...(d.workouts ?? [])],
          days: {
            ...d.days,
            [todayKey]: {
              ...day,
              movement: (day.movement ?? 0) + minutes,
              activities: [...(day.activities ?? []), { id: newId(), kind: "strength", minutes, title: w.name, workoutId: w.id }],
            },
          },
        };
      }),
    [todayKey]
  );
  const removeWorkout = useCallback((id) => setData((d) => ({ ...d, workouts: (d.workouts ?? []).filter((w) => w.id !== id) })), []);
  const saveRoutine = useCallback((r) => setData((d) => ({ ...d, routines: [r, ...(d.routines ?? []).filter((x) => x.id !== r.id)] })), []);
  const removeRoutine = useCallback((id) => setData((d) => ({ ...d, routines: (d.routines ?? []).filter((x) => x.id !== id) })), []);
  const addCustomExercise = useCallback((ex) => setData((d) => ({ ...d, customExercises: [ex, ...(d.customExercises ?? [])] })), []);
  const addMeasure = useCallback((m) => setData((d) => ({ ...d, measures: [{ id: newId(), date: todayKey, ...m }, ...(d.measures ?? [])] })), [todayKey]);
  const removeMeasure = useCallback((id) => setData((d) => ({ ...d, measures: (d.measures ?? []).filter((m) => m.id !== id) })), []);

  const setSteps = useCallback((steps, key = todayKey) => updateDay(key, (day) => ({ ...day, steps: Math.max(0, Math.round(steps) || 0) })), [updateDay, todayKey]);

  const addPhoto = useCallback(
    (photo) => setData((d) => ({ ...d, photos: [{ id: newId(), date: todayKey, note: "", ...photo }, ...(d.photos ?? [])] })),
    [todayKey]
  );
  const updatePhoto = useCallback((id, patch) => setData((d) => ({ ...d, photos: (d.photos ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)) })), []);
  const removePhoto = useCallback(
    (id) =>
      setData((d) => {
        forgetPhoto((d.photos ?? []).find((p) => p.id === id)?.uri);
        return { ...d, photos: (d.photos ?? []).filter((p) => p.id !== id) };
      }),
    []
  );

  const setSession = useCallback((patch) => setSessionState((p) => ({ ...p, ...patch })), []);

  const ctx = useMemo(() => deriveToday({ profile: data.profile, today, now }), [data.profile, data.days, todayKey, now]); // eslint-disable-line react-hooks/exhaustive-deps

  /** The last seven days, oldest first, as the Forgiveness Engine sees them. */
  const history = useMemo(
    () => Array.from({ length: 7 }, (_, i) => data.days[dateKey(daysAgo(6 - i, now))]?.entry ?? null),
    [data.days, now]
  );

  const backup = useBackup({ data, setData, ready });

  /** Wipe every key Selena has written, here and in the online backup. */
  const deleteAllData = useCallback(async () => {
    try {
      await backup.deleteRemote();
    } catch {
      /* offline — the local wipe still happens */
    }
    hydrated.current = false;
    try {
      await AsyncStorage.multiRemove([STATE_KEY, HIDE_KEY, ACTIVE_KEY]);
    } catch {
      /* storage unavailable — nothing to remove */
    }
    for (const ph of data.photos ?? []) forgetPhoto(ph.uri);
    setData(fresh());
    setHideNumbersState(true);
    setSessionState({ startedAt: null, endedAt: null, bailoutOffered: false, bailoutVisible: false });
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backup.deleteRemote]);

  const value = {
    backup,
    ready,
    now,
    // a newer agreement means asking again before anything else
    onboarded: data.onboarded && data.agreement?.version === AGREEMENT_VERSION,
    agreement: data.agreement,
    acceptAgreement: () =>
      setData((d) => ({ ...d, agreement: { version: AGREEMENT_VERSION, acceptedAt: new Date().toISOString() } })),
    deleteAllData,
    profile: data.profile,
    setProfile,
    completeOnboarding: () => setData((d) => ({ ...d, onboarded: true })),
    restartOnboarding: () => setData((d) => ({ ...d, onboarded: false })),
    today,
    setToday,
    days: data.days,
    ctx,
    history,
    markDone: (kind = ctx.prescription.kind) => setToday({ entry: { prescribed: kind, completed: true } }),
    hideNumbers,
    setHideNumbers,
    saved: data.saved,
    foodLibrary: { ...emptyLibrary(), ...data.foodLibrary },
    todayKey,
    /** Any day, filled in with the usual empty fields. */
    dayAt: (key) => (key === todayKey ? today : { ...emptyDay(), ...data.days[key] }),
    updateDay,
    addFoodEntries,
    updateFoodEntry,
    removeFoodEntry,
    saveToLibrary,
    moments,
    showMoments,
    closeMoment,
    seenMoments: data.seenMoments ?? [],
    saveSearch,
    toggleFavorite,
    removeFromLibrary,
    addActivity,
    removeActivity,
    setSteps,
    photos: data.photos ?? [],
    routines: data.routines ?? [],
    workouts: data.workouts ?? [],
    activeWorkout: data.activeWorkout ?? null,
    customExercises: data.customExercises ?? [],
    measures: data.measures ?? [],
    startWorkout,
    updateWorkout,
    discardWorkout,
    finishWorkout,
    removeWorkout,
    saveRoutine,
    removeRoutine,
    addCustomExercise,
    addMeasure,
    removeMeasure,
    addPhoto,
    updatePhoto,
    removePhoto,
    toggleSaved: (k) => setData((d) => ({ ...d, saved: { ...d.saved, [k]: !d.saved[k] } })),
    session,
    setSession,
  };

  return <AppState.Provider value={value}>{children}</AppState.Provider>;
};
