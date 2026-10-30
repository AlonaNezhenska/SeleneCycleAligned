import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deriveToday, sunset, resumeOnOpen, AGREEMENT_VERSION } from "../shared";
import { DEFAULT_BACKUP } from "../lib/backup";
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
    toggleSaved: (k) => setData((d) => ({ ...d, saved: { ...d.saved, [k]: !d.saved[k] } })),
    session,
    setSession,
  };

  return <AppState.Provider value={value}>{children}</AppState.Provider>;
};
