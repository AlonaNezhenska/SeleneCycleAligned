import "expo-sqlite/localStorage/install";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";

/* The Supabase client, or null when no project is configured. Without it
   Selena runs exactly as before: everything stays on the device.

   Both values are public by design (row-level security protects the data).
   Never put a database password or service-role key in the app. */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const backupAvailable = Boolean(url && key);

export const supabase = backupAvailable
  ? createClient(url, key, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // the emailed link comes back with a one-time code that only this
        // phone can exchange, because it holds the matching secret
        flowType: "pkce",
      },
    })
  : null;

if (supabase) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
