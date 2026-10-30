import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../state/AppState";
import { T } from "../ui/theme";
import { Screen, Serif, Body, Button } from "../ui/kit";

/* Where the emailed sign-in link lands. It carries a one-time code that this
   phone exchanges for a session, then the user goes back to their settings. */
export function AuthCallback() {
  const { code, error_description: linkError } = useLocalSearchParams();
  const { backup } = useApp();
  const [error, setError] = useState(linkError ?? null);

  useEffect(() => {
    if (!code || linkError || !backup.available) return;
    let alive = true;
    backup.finishSignIn(String(code)).then((err) => {
      if (!alive) return;
      if (err) setError(err);
      else router.replace("/privacy");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const problem = error ?? (!code ? "This sign-in link is missing its code. Ask for a new one." : null);

  return (
    <Screen>
      <View style={{ paddingTop: 80, alignItems: "center", gap: 16 }}>
        {problem ? (
          <>
            <Serif size={24} style={{ textAlign: "center" }}>
              That link did not work
            </Serif>
            <Body style={{ textAlign: "center" }}>{`${problem} Links work once and expire after a while.`}</Body>
            <Button label="Back to my data" onPress={() => router.replace("/privacy")} />
          </>
        ) : (
          <>
            <ActivityIndicator color={T.sage} />
            <Body>Signing you in…</Body>
          </>
        )}
      </View>
    </Screen>
  );
}
