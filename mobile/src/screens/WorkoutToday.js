import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Check, Egg } from "lucide-react-native";
import { preFlightNudge, normalizeCardio, UI_COPY, getPhase, groupForPhase } from "../shared";
import { TodayActivity } from "../ui/activity";
import { useApp } from "../state/AppState";
import { T, F } from "../ui/theme";
import { Screen, Card, Button, Serif, Body, SectionLabel, Instruction, IconBtn, s } from "../ui/kit";
import { MODE_STYLE } from "./Home";

/* ---------------------------------------------------------------
   TODAY — the details behind the Workouts tab: the plan from the
   engine, steps and activity, cardio and the Pre-Flight nudge.
   --------------------------------------------------------------- */

const CARDIO_CHOICES = [
  { key: "zone2", label: "Zone 2" },
  { key: "sit", label: "SIT" },
  { key: "spin", label: "Spin class" },
];
const CARDIO_NAME = { zone2: "Zone 2", sit: "SIT", spin: "Spin class" };

const IconDisc = ({ icon: Icon, bg }) => (
  <View style={[styles.disc, { backgroundColor: bg }]}>
    <Icon size={17} color={T.canvas} strokeWidth={1.7} />
  </View>
);

export function WorkoutToday() {
  const { ctx, now: appNow, today, setToday, markDone, session, profile, hideNumbers, todayKey, removeActivity, setSteps } = useApp();
  const p = ctx.prescription;
  const preFlight = preFlightNudge(session.startedAt ?? appNow);
  const cardio = normalizeCardio(today.cardio ?? p.cardio.cardio, p.mode);
  const done = today.entry?.completed === true;
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

  return (
    <Screen>
      <View style={[s.row, { gap: 12, marginBottom: 16 }]}>
        <IconBtn label="Back" onPress={close}>
          <ArrowLeft size={20} color={T.ink} />
        </IconBtn>
        <View style={{ flex: 1 }}>
          <Serif size={24} accessibilityRole="header">
            Today
          </Serif>
          <Body size={12.5}>
            {"Based on your energy: "}
            <Text style={{ fontFamily: F.sansBold, color: MODE_STYLE[p.mode].ring }}>{`${p.mode.toUpperCase()} (${MODE_STYLE[p.mode].caption})`}</Text>
          </Body>
        </View>
      </View>

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
        <Instruction topic="prescription" />
      </Card>


      <TodayActivity day={today} profile={profile} hidden={hideNumbers} date={todayKey} onSteps={(n) => setSteps(n)} onRemove={(id) => removeActivity(id)} />

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

      {preFlight && !session.endedAt && (
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
  disc: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  doneMark: { width: 44, height: 44, backgroundColor: T.sage, alignItems: "center", justifyContent: "center" },
  choice: { flex: 1, minHeight: 44, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
