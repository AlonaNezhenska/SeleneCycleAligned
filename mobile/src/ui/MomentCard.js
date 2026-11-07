import React, { useEffect } from "react";
import { View, Text, Image, Modal, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useApp } from "../state/AppState";
import { MOMENT_IMAGE } from "../content/moments";
import { MOMENT_TEXT, upcomingMoments } from "../lib/moments";
import { askPermission, onNotificationTap, planNotifications } from "../lib/notifications";
import { T, F, TOILE } from "./theme";

/* ---------------------------------------------------------------
   THE MOMENT — a picture with a line of text underneath, shown over
   whatever is on screen. One at a time; a pair runs straight on.
   Calendar moments also wait here for the next time the app is opened,
   so one is never lost to a notification swiped away.
   --------------------------------------------------------------- */

export const MomentCard = () => {
  const { profile, setProfile, todayKey, ready, onboarded, moments, showMoments, closeMoment, seenMoments } = useApp();
  const key = moments[0];

  // the first time in, the phone asks once whether notifications are welcome
  useEffect(() => {
    if (!ready || !onboarded || profile.notificationsAsked) return;
    askPermission()
      .catch(() => false)
      .then((granted) => setProfile({ notificationsAsked: true, notifications: granted }));
  }, [ready, onboarded, profile.notificationsAsked]); // eslint-disable-line react-hooks/exhaustive-deps

  // a moment due today appears once, the first time the app opens that day
  useEffect(() => {
    if (!ready || !onboarded) return;
    const due = upcomingMoments(profile, todayKey)
      .filter((m) => m.date === todayKey && !seenMoments.includes(`${m.key}:${m.date}`))
      .map((m) => m.key);
    if (due.length) showMoments(due, todayKey);
  }, [ready, onboarded, profile.lastPeriod, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready) planNotifications(profile, todayKey).catch(() => {});
  }, [ready, profile.notifications, profile.lastPeriod, profile.cycleLength, profile.onBirthControl, todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onNotificationTap((k) => showMoments([k], todayKey)), [showMoments, todayKey]);

  if (!key) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeMoment}>
      <View style={styles.backdrop}>
        <View style={styles.card} testID="moment" accessibilityViewIsModal>
          <Image source={MOMENT_IMAGE[key]} style={styles.image} resizeMode="contain" accessibilityLabel="A funny picture" />
          <Text style={styles.text}>{MOMENT_TEXT[key]}</Text>
          <Button mode="contained" onPress={closeMoment} accessibilityLabel={moments.length > 1 ? "Next" : "Close"} buttonColor={TOILE.navy} textColor={T.canvas} labelStyle={styles.action}>
            {moments.length > 1 ? "Next" : "Close"}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(20,24,18,0.6)" },
  card: { width: "100%", maxWidth: 360, padding: 16, gap: 14, backgroundColor: T.canvas },
  image: { width: "100%", height: 280 },
  text: { fontFamily: F.serif, fontSize: 20, lineHeight: 27, color: T.ink, textAlign: "center" },
  action: { fontFamily: F.sansSemi, fontSize: 15, marginVertical: 13 },
});
