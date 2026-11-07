import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Divider, IconButton } from "react-native-paper";
import { router } from "expo-router";
import { ArrowLeft, CalendarCheck, Dumbbell, Flower2, Pencil, Plus, Search, Sparkles, Footprints } from "lucide-react-native";
import { getPhase, groupForPhase } from "../shared";
import { useApp } from "../state/AppState";
import { useWorkoutActions, suggestedRoutine } from "../ui/workout";
import { T, F, TOILE } from "../ui/theme";
import { Screen, IconBtn, MenuRow } from "../ui/kit";

/* ---------------------------------------------------------------
   START A WORKOUT — one question: what do you want to do?

   Today's suggestion comes first and is one tap away. Everything else
   is one line each, so there is never a page to work out.
   --------------------------------------------------------------- */

export function WorkoutStart() {
  const { ctx, routines } = useApp();
  const { begin } = useWorkoutActions();
  const p = ctx.prescription;
  const phase = ctx.calendarKnown ? groupForPhase(getPhase(ctx.day, ctx.length)).key : null;
  const { routine } = suggestedRoutine({ kind: p.kind, mode: p.mode, phase });
  const close = () => (router.canGoBack?.() ? router.back() : router.replace("/workouts"));

  return (
    <Screen>
      <IconBtn label="Back" onPress={close}>
        <ArrowLeft size={20} color={T.ink} />
      </IconBtn>
      <Text accessibilityRole="header" style={styles.question}>
        What do you want to do?
      </Text>

      <MenuRow strong icon={Sparkles} title={routine.name} description={`Suggested for today: ${p.title}`} onPress={() => begin({ name: routine.name, items: routine.exercises, replace: true })} />
      <View style={{ height: 18 }} />
      <MenuRow icon={Plus} title="Empty workout" description="Add exercises as you go" onPress={() => begin({ name: "Workout", replace: true })} />
      <Divider />

      {routines.length > 0 && (
        <>
          <Text style={styles.group}>My routines</Text>
          <View testID="my-routines">
            {routines.map((r) => (
              <View key={r.id}>
                <MenuRow
                  icon={Dumbbell}
                  title={r.name}
                  description={`${r.exercises.length} exercises`}
                  onPress={() => begin({ name: r.name, routineId: r.id, items: r.exercises, replace: true })}
                  right={() => (
                    <IconButton
                      icon={() => <Pencil size={17} color={T.inkSoft} />}
                      onPress={() => router.push({ pathname: "/workout/routine", params: { id: r.id } })}
                      accessibilityLabel={`Edit ${r.name}`}
                      style={{ margin: 0, borderRadius: 0, alignSelf: "center" }}
                    />
                  )}
                />
                <Divider />
              </View>
            ))}
          </View>
          <Text style={styles.group}>Something else</Text>
        </>
      )}

      <MenuRow icon={Search} title="Find a routine" description="Programs for home, gym and travel" onPress={() => router.push("/workout/explore")} />
      <Divider />
      <MenuRow icon={CalendarCheck} title="Make my own routine" description="Save it to use again" onPress={() => router.push("/workout/routine")} />
      <Divider />
      <MenuRow icon={Flower2} title="Yoga or meditation" description="A gentle session" onPress={() => router.push("/workout/place/yoga")} />
      <Divider />
      <MenuRow icon={Footprints} title="Steps, cardio and today's plan" description="Log what you did and see the details" onPress={() => router.push("/workout/today")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: { fontFamily: F.serif, fontSize: 28, lineHeight: 35, color: T.ink, marginTop: 18, marginBottom: 20 },
  group: { fontFamily: F.sansSemi, fontSize: 13, color: T.inkSoft, marginTop: 20, marginBottom: 2 },
});
