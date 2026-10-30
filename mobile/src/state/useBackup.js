import { useCallback, useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { supabase, backupAvailable } from "../lib/supabase";
import { BACKUP_CATEGORIES, DEFAULT_BACKUP, toBackup, mergeBackup } from "../lib/backup";

/* ---------------------------------------------------------------
   OPTIONAL ONLINE BACKUP
   Signing in is never required. When signed in, only the categories the
   user has ticked are sent, a moment after each change. Unticking one
   deletes it from the server straight away.
   --------------------------------------------------------------- */

const PUSH_DELAY_MS = 1500;

export const useBackup = ({ data, setData, ready }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const prefs = data.backup ?? DEFAULT_BACKUP;
  const latest = useRef(data);
  latest.current = data;

  const push = useCallback(async (snapshot, userId) => {
    const ticked = BACKUP_CATEGORIES.map((c) => c.key).filter((k) => (snapshot.backup ?? DEFAULT_BACKUP)[k]);
    if (!ticked.length) return;
    setStatus("saving");
    const rows = ticked.map((category) => ({
      user_id: userId,
      category,
      data: toBackup(snapshot, category),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("backups").upsert(rows);
    setStatus(error ? "error" : "saved");
  }, []);

  // Send ticked categories shortly after any change.
  useEffect(() => {
    if (!supabase || !user || !ready) return;
    const t = setTimeout(() => push(latest.current, user.id), PUSH_DELAY_MS);
    return () => clearTimeout(t);
  }, [data, user, ready, push]);

  /** Bring down whatever this account backed up before, and keep those boxes ticked. */
  const pull = useCallback(async () => {
    const { data: rows, error } = await supabase.from("backups").select("category, data");
    if (error || !rows) return;
    setData((d) =>
      rows.reduce((acc, r) => mergeBackup(acc, r.category, r.data), {
        ...d,
        backup: { ...(d.backup ?? DEFAULT_BACKUP), ...Object.fromEntries(rows.map((r) => [r.category, true])) },
      })
    );
  }, [setData]);

  // Track who is signed in. A fresh sign-in brings earlier backups down.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: d }) => setUser(d.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") pull();
    });
    return () => sub.subscription.unsubscribe();
  }, [pull]);

  /** Email a one-time sign-in link that opens Selena on this phone. */
  const sendLink = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: Linking.createURL("/auth-callback") },
    });
    return error ? error.message : null;
  }, []);

  /** The link lands here with a one-time code; trade it for a session. */
  const finishSignIn = useCallback(async (code) => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? error.message : null;
  }, []);

  /** Signing out stops backups. Everything on this device stays. */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStatus("idle");
  }, []);

  const setPrefs = useCallback(
    async (next) => {
      const turnedOff = Object.keys(next).filter((k) => prefs[k] && !next[k]);
      setData((d) => ({ ...d, backup: next }));
      if (supabase && user && turnedOff.length) {
        await supabase.from("backups").delete().in("category", turnedOff);
      }
    },
    [prefs, user, setData]
  );

  /** Remove the account and, through the database cascade, every backup row. */
  const deleteRemote = useCallback(async () => {
    if (!supabase || !user) return;
    await supabase.rpc("delete_my_account");
    await supabase.auth.signOut();
  }, [user]);

  return { available: backupAvailable, user, prefs, status, sendLink, finishSignIn, signOut, setPrefs, deleteRemote };
};
