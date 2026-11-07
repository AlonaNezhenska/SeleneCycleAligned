import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button as PaperButton } from "react-native-paper";
import { router } from "expo-router";
import { Check, LifeBuoy, Timer } from "lucide-react-native";
import { shouldOfferBailout, postWorkoutWindow, windowRemaining, UI_COPY, getPhase, groupForPhase } from "../shared";
import { journalSignals } from "../content/journal";
import { dayMovement, weightOf } from "../lib/activity";
import { encouragement } from "../lib/encourage";
import { Encouragement, PhotoNudge } from "../ui/activity";
import { ActiveBanner, useWorkoutActions, useNow } from "../ui/workout";
import { useApp } from "../state/AppState";
import { T, F, TOILE } from "../ui/theme";
import { Screen, Card, Button, Serif, Body, Instruction, s } from "../ui/kit";

/* ---------------------------------------------------------------
   5. WORKOUT — one button.

   Start workout asks what she wants to do, and nothing else is here
   until it matters: the workout in progress, the Bailout at ten minutes,
   and the protein window and a kind word afterwards. The session the
   engine watches starts with the workout.
   --------------------------------------------------------------- */

const mmss = (ms) => {
  const sec = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

const IconDisc = ({ icon: Icon, bg }) => (
  <View style={[styles.disc, { backgroundColor: bg }]}>
    <Icon size={17} color={T.canvas} strokeWidth={1.7} />
  </View>
);

const ProteinWindow = ({ win, now }) => {
  const left = windowRemaining(win, now);
  const pct = (left / (win.minutes * 60 * 1000)) * 100;
  return (
    <Card accessibilityLabel="Protein window" testID="protein-window" style={{ marginBottom: 14 }}>
      <View style={[s.row, { alignItems: "flex-start", gap: 14 }]}>
        <IconDisc icon={Timer} bg={T.terracotta} />
        <View style={{ flex: 1 }}>
          <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
            <Body size={13.5} weight="medium" color={T.ink}>
              {left > 0 ? "Protein window open" : "Window closed. All good."}
            </Body>
            <Text style={{ fontFamily: F.sansSemi, fontSize: 13, color: T.terracotta, fontVariant: ["tabular-nums"] }}>{mmss(left)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: T.terracotta }]} />
          </View>
          <Body size={12.5} style={{ marginBottom: 6 }}>
            {`Aim for ${win.proteinGrams}g+ protein in the next ${win.minutes} minutes. Nothing breaks if you don't.`}
          </Body>
          <Instruction topic="postWindow" />
        </View>
      </View>
    </Card>
  );
};

export function Training() {
  const { ctx, today, setToday, session, setSession, profile, todayKey, photos } = useApp();
  const { finish, active } = useWorkoutActions();
  const phase = ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null;
  const movement = dayMovement(today, weightOf(profile));
  const message = movement.moved ? encouragement({ phase, moved: true, meditated: movement.minutes.meditation > 0, signals: journalSignals(today.journal) }) : null;
  const offerPhoto = profile.photoReminder && movement.moved && !photos.some((ph) => ph.date === todayKey) && !today.photoNudgeDismissed;

  const running = session.startedAt != null && session.endedAt == null;
  const windowOpen = session.endedAt != null;
  const now = useNow(running || windowOpen);
  const elapsed = running ? now - session.startedAt : 0;

  useEffect(() => {
    if (running && shouldOfferBailout(elapsed, session.bailoutOffered)) {
      setSession({ bailoutOffered: true, bailoutVisible: true });
    }
  }, [running, elapsed, session.bailoutOffered, setSession]);

  const win = windowOpen ? postWorkoutWindow(session.endedAt) : null;
  const done = today.entry?.completed === true;

  return (
    <Screen>
      <Serif size={28} accessibilityRole="header" style={{ marginBottom: 18 }}>
        Workout
      </Serif>

      <ActiveBanner onFinish={() => finish()} />

      {session.bailoutVisible && (
        <Card style={{ marginBottom: 14, backgroundColor: T.canvasDeep }} accessibilityLabel="Bailout" accessibilityLiveRegion="assertive" testID="bailout">
          <View style={[s.row, { alignItems: "flex-start", gap: 14 }]}>
            <IconDisc icon={LifeBuoy} bg={T.aegean} />
            <View style={{ flex: 1 }}>
              <Body size={13.5} weight="medium" color={T.ink}>
                Ten minutes in. How's it landing?
              </Body>
              <Body size={12.5} style={{ marginBottom: 10 }}>
                {UI_COPY.bailoutPrompt}
              </Body>
              <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
                <Button tone="dark" size="sm" full={false} label="Switch to recovery" onPress={() => finish("", "rest")} />
                <Button tone="outline" size="sm" full={false} label="Keep going" onPress={() => setSession({ bailoutVisible: false })} />
              </View>
            </View>
          </View>
        </Card>
      )}

      {win && <ProteinWindow win={win} now={now} />}
      {message && <Encouragement message={message} />}
      {offerPhoto && <PhotoNudge onTake={() => router.push({ pathname: "/photos", params: { take: "1" } })} onDismiss={() => setToday({ photoNudgeDismissed: true })} />}

      {!active && (
        <PaperButton mode="contained" onPress={() => router.push("/workout/start")} accessibilityLabel="Start workout" buttonColor={TOILE.navy} textColor={T.canvas} labelStyle={styles.startText}>
          Start workout
        </PaperButton>
      )}

      {done && (
        <View accessible accessibilityLabel="Done today" style={[s.row, styles.done]}>
          <Check size={16} color={T.inkSoft} />
          <Text style={styles.doneText}>Done for today</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  disc: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  track: { height: 6, overflow: "hidden", backgroundColor: "rgba(42,38,34,0.1)", marginBottom: 8 },
  fill: { height: "100%" },
  startText: { fontFamily: F.sansSemi, fontSize: 18, marginVertical: 20 },
  done: { gap: 6, justifyContent: "center", marginTop: 14 },
  doneText: { fontFamily: F.sans, fontSize: 13, color: T.inkSoft },
});
