import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Check, LifeBuoy, Timer, Egg, Plus, ClipboardList, Search } from "lucide-react-native";
import { preFlightNudge, shouldOfferBailout, postWorkoutWindow, windowRemaining, normalizeCardio, UI_COPY, getPhase, groupForPhase } from "../shared";
import { journalSignals } from "../content/journal";
import { dayMovement, weightOf } from "../lib/activity";
import { encouragement } from "../lib/encourage";
import { TodayActivity, YogaMeditation, Encouragement, PhotoNudge } from "../ui/activity";
import { ActiveBanner, RoutineCard, useWorkoutActions, useNow, suggestedRoutine } from "../ui/workout";
import { useApp } from "../state/AppState";
import { T, F } from "../ui/theme";
import { Screen, Card, Button, Serif, Body, SectionLabel, Instruction, s } from "../ui/kit";
import { MODE_STYLE } from "./Home";

/* ---------------------------------------------------------------
   5. WORKOUT — training that follows the cycle.

   A warm word for the day, the workout in progress, an empty workout
   or a routine to start, today's plan from the engine with a routine
   to match, her own routines, today's activity, yoga and meditation,
   and cardio. Starting a workout starts the session the engine
   watches: the Bailout at ten minutes and the protein window after.
   --------------------------------------------------------------- */

const CARDIO_CHOICES = [
  { key: "zone2", label: "Zone 2" },
  { key: "sit", label: "SIT" },
  { key: "spin", label: "Spin class" },
];
const CARDIO_NAME = { zone2: "Zone 2", sit: "SIT", spin: "Spin class" };

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

const Tile = ({ icon: Icon, label, onPress }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.tile}>
    <Icon size={22} color={T.ink} strokeWidth={1.6} />
    <Text style={styles.tileText}>{label}</Text>
  </Pressable>
);

export function Training() {
  const { ctx, now: appNow, today, setToday, markDone, session, setSession, profile, hideNumbers, todayKey, removeActivity, setSteps, photos, routines, customExercises } =
    useApp();
  const { begin, finish, active } = useWorkoutActions();
  const p = ctx.prescription;
  const phase = ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null;
  const movement = dayMovement(today, weightOf(profile));
  const message = encouragement({ phase, moved: movement.moved, meditated: movement.minutes.meditation > 0, signals: journalSignals(today.journal) });
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

  const preFlight = preFlightNudge(session.startedAt ?? appNow);
  const cardio = normalizeCardio(today.cardio ?? p.cardio.cardio, p.mode);
  const win = windowOpen ? postWorkoutWindow(session.endedAt) : null;
  const done = today.entry?.completed === true;
  const suggestion = suggestedRoutine({ kind: p.kind, mode: p.mode, phase });

  return (
    <Screen>
      <View style={{ marginBottom: 16 }}>
        <Serif size={28} accessibilityRole="header">
          Workout
        </Serif>
        <Body size={12.5} style={{ marginTop: 2 }}>
          {"Based on your energy: "}
          <Text style={{ fontFamily: F.sansBold, color: MODE_STYLE[p.mode].ring }}>{`${p.mode.toUpperCase()} (${MODE_STYLE[p.mode].caption})`}</Text>
        </Body>
      </View>

      <Encouragement message={message} />
      {offerPhoto && (
        <PhotoNudge onTake={() => router.push({ pathname: "/photos", params: { take: "1" } })} onDismiss={() => setToday({ photoNudgeDismissed: true })} />
      )}

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

      {!active && (
        <Pressable onPress={() => begin({ name: "Workout" })} accessibilityRole="button" accessibilityLabel="Start empty workout" style={[s.row, styles.empty]}>
          <Plus size={20} color={T.ink} />
          <Text style={styles.emptyText}>Start empty workout</Text>
        </Pressable>
      )}

      {/* the engine's plan for today, with a routine that fits it */}
      <Card style={{ marginBottom: 14, gap: 10 }} testID="today-plan">
        <View style={[s.row, { gap: 14 }]}>
          <View style={{ flex: 1 }}>
            <SectionLabel>Today's plan</SectionLabel>
            <Body size={15} weight="semi" color={T.ink}>
              {p.title}
            </Body>
            <Body size={12.5}>{p.summary}</Body>
          </View>
          {done ? (
            <View accessible accessibilityLabel="Done today" style={styles.doneMark}>
              <Check size={22} color={T.canvas} strokeWidth={2.4} />
            </View>
          ) : (
            p.kind === "rest" && <Button size="sm" full={false} label="Rest taken" onPress={() => markDone("rest")} />
          )}
        </View>
        <View style={{ gap: 6 }}>
          {p.options.map((item) => (
            <View key={item} style={[s.row, { gap: 10 }]}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.sage }} />
              <Body size={13} color={T.ink}>
                {item}
              </Body>
            </View>
          ))}
          {p.strength && (
            <Body size={12.5} style={{ paddingLeft: 15 }}>
              {p.strength.toFailure
                ? "Take each working set until you cannot complete another clean rep."
                : `Stop each set with ${p.strength.rir.min}–${p.strength.rir.max} reps in reserve.`}
            </Body>
          )}
          {p.plyometrics && (
            <Body size={12.5} style={{ paddingLeft: 15 }}>
              Plyometrics are part of today: a few sets of jumps or bounds.
            </Body>
          )}
        </View>
        {!active && (
          <RoutineCard
            routine={suggestion.routine}
            custom={customExercises}
            onStart={() => begin({ name: suggestion.routine.name, items: suggestion.routine.exercises })}
          />
        )}
        <Instruction topic="prescription" />
      </Card>

      <SectionLabel>Routines</SectionLabel>
      <View style={[s.row, { gap: 10, marginTop: 6, marginBottom: 12 }]}>
        <Tile icon={ClipboardList} label="New routine" onPress={() => router.push("/workout/routine")} />
        <Tile icon={Search} label="Explore routines" onPress={() => router.push("/workout/explore")} />
      </View>
      <View style={{ gap: 10, marginBottom: 18 }} testID="my-routines">
        {routines.map((r) => (
          <RoutineCard
            key={r.id}
            routine={r}
            custom={customExercises}
            onEdit={() => router.push({ pathname: "/workout/routine", params: { id: r.id } })}
            onStart={active ? undefined : () => begin({ name: r.name, routineId: r.id, items: r.exercises })}
          />
        ))}
      </View>

      <TodayActivity day={today} profile={profile} hidden={hideNumbers} date={todayKey} onSteps={(n) => setSteps(n)} onRemove={(id) => removeActivity(id)} />

      <YogaMeditation phase={phase} />

      {/* Polarized cardio — easy or hard, never the grey middle */}
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Cardio</SectionLabel>
        <View style={[s.row, { gap: 8, marginBottom: 10 }]}>
          {CARDIO_CHOICES.map(({ key, label }) => {
            const on = (today.cardio ?? p.cardio.cardio) === key;
            return (
              <Pressable
                key={key}
                onPress={() => setToday({ cardio: key })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.choice, { backgroundColor: on ? T.aegean : T.canvas, borderColor: on ? T.aegean : T.hair }]}
              >
                <Text style={{ fontFamily: F.sansMed, fontSize: 12.5, color: on ? T.canvas : T.ink }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Body size={12.5} accessibilityLiveRegion="polite">
          {cardio.replaced ? UI_COPY.cardioSwap(CARDIO_NAME[cardio.requested], CARDIO_NAME[cardio.cardio]) : `${CARDIO_NAME[cardio.cardio]} it is.`}
        </Body>
      </Card>

      {preFlight && !windowOpen && (
        <Card style={{ marginBottom: 14 }} accessibilityLabel="Pre-Flight" testID="preflight">
          <View style={[s.row, { alignItems: "flex-start", gap: 14 }]}>
            <IconDisc icon={Egg} bg={T.sage} />
            <View style={{ flex: 1 }}>
              <Body size={13.5} weight="medium" color={T.ink}>
                {`Pre-Flight: ${preFlight.proteinGrams}g protein first`}
              </Body>
              <Instruction topic="preFlight" />
            </View>
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  disc: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  doneMark: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.sage, alignItems: "center", justifyContent: "center" },
  choice: { flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  track: { height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(42,38,34,0.1)", marginBottom: 8 },
  fill: { height: "100%", borderRadius: 3 },
  empty: { gap: 12, minHeight: 56, paddingHorizontal: 18, borderRadius: 18, backgroundColor: T.canvasDeep, marginBottom: 14 },
  emptyText: { fontFamily: F.sansMed, fontSize: 16, color: T.ink },
  tile: { flex: 1, minHeight: 96, gap: 8, borderRadius: 18, backgroundColor: T.canvasDeep, alignItems: "center", justifyContent: "center" },
  tileText: { fontFamily: F.sansMed, fontSize: 14, color: T.ink },
});

