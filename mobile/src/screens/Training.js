import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Check, LifeBuoy, Timer, Play, Square, Egg } from "lucide-react-native";
import { preFlightNudge, shouldOfferBailout, postWorkoutWindow, windowRemaining, normalizeCardio, UI_COPY } from "../shared";
import { useApp } from "../state/AppState";
import { T, F, IMG } from "../ui/theme";
import { Screen, Card, Button, Serif, Body, SectionLabel, Plate, Instruction, s } from "../ui/kit";
import { MODE_STYLE } from "./Home";

/* ---------------------------------------------------------------
   5. THE TRAINING PROTOCOL
   --------------------------------------------------------------- */

const CARDIO_CHOICES = [
  { key: "zone2", label: "Zone 2" },
  { key: "sit", label: "SIT" },
  { key: "spin", label: "Spin class" },
];
const CARDIO_NAME = { zone2: "Zone 2", sit: "SIT", spin: "Spin class" };

const clock = (ms) => {
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

/** Re-render once a second while something is timing. */
const useNow = (active) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
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
    <Card accessibilityLabel="Protein window" testID="protein-window">
      <View style={[s.row, { alignItems: "flex-start", gap: 14 }]}>
        <IconDisc icon={Timer} bg={T.terracotta} />
        <View style={{ flex: 1 }}>
          <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
            <Body size={13.5} weight="medium" color={T.ink}>
              {left > 0 ? "Protein window open" : "Window closed. All good."}
            </Body>
            <Text style={{ fontFamily: F.sansSemi, fontSize: 13, color: T.terracotta, fontVariant: ["tabular-nums"] }}>{clock(left)}</Text>
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
  const { ctx, now: appNow, today, setToday, markDone, session, setSession } = useApp();
  const p = ctx.prescription;
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

  const start = () => setSession({ startedAt: Date.now(), endedAt: null, bailoutOffered: false, bailoutVisible: false });
  /** Finishing — or bailing out — logs the minutes and earns the check. */
  const finish = (kind) => {
    const endedAt = Date.now();
    setSession({ endedAt, bailoutVisible: false });
    setToday({ movement: (today.movement ?? 0) + Math.round((endedAt - session.startedAt) / 60000) });
    markDone(kind);
  };
  const end = () => finish();
  const bailout = () => finish("rest");

  return (
    <Screen>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Serif size={24} accessibilityRole="header">
          Today's movement plan
        </Serif>
        <Body size={12} style={{ marginTop: 4 }}>
          {"Based on your energy: "}
          <Text style={{ fontFamily: F.sansBold, color: MODE_STYLE[p.mode].ring }}>{`${p.mode.toUpperCase()} (${MODE_STYLE[p.mode].caption})`}</Text>
        </Body>
      </View>

      <Plate source={IMG.forest} height={180} radius={24} alt="Movement and recovery" style={{ marginBottom: 20 }} />

      {/* Forgiveness Engine — rest earns the same completion mark as a heavy lift */}
      <Card style={[s.row, { gap: 14, backgroundColor: T.canvasDeep, marginBottom: 14 }]}>
        <View style={{ flex: 1 }}>
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
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Today's focus</SectionLabel>
        <View style={{ gap: 8, marginBottom: 12 }}>
          {p.options.map((item) => (
            <View key={item} style={[s.row, { gap: 12 }]}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.sage }} />
              <Body size={13} color={T.ink}>
                {item}
              </Body>
            </View>
          ))}
          {p.strength && (
            <Body size={12.5} style={{ paddingLeft: 17 }}>
              {p.strength.toFailure
                ? "Take each working set until you cannot complete another clean rep."
                : `Stop each set with ${p.strength.rir.min}–${p.strength.rir.max} reps in reserve.`}
            </Body>
          )}
          {p.plyometrics && (
            <Body size={12.5} style={{ paddingLeft: 17 }}>
              Plyometrics are part of today: a few sets of jumps or bounds.
            </Body>
          )}
        </View>
        <Instruction topic="prescription" />
      </Card>

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

      {p.kind === "strength" && !windowOpen && (
        <Card style={{ marginBottom: 14 }}>
          {running ? (
            <View style={[s.row, { gap: 14 }]}>
              <View style={{ flex: 1 }}>
                <Body size={12}>Session time</Body>
                <Text accessibilityLabel={`Elapsed ${clock(elapsed)}`} style={{ fontFamily: F.sansSemi, fontSize: 22, color: T.ink, fontVariant: ["tabular-nums"] }}>
                  {clock(elapsed)}
                </Text>
              </View>
              <Button tone="dark" size="sm" full={false} label="End session" icon={Square} onPress={end} />
            </View>
          ) : (
            <Button label="Start session" icon={Play} onPress={start} />
          )}
        </Card>
      )}

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
                <Button tone="dark" size="sm" full={false} label="Switch to recovery" onPress={bailout} />
                <Button tone="outline" size="sm" full={false} label="Keep going" onPress={() => setSession({ bailoutVisible: false })} />
              </View>
            </View>
          </View>
        </Card>
      )}

      {win && <ProteinWindow win={win} now={now} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  disc: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  doneMark: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.sage, alignItems: "center", justifyContent: "center" },
  choice: { flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  track: { height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(42,38,34,0.1)", marginBottom: 8 },
  fill: { height: "100%", borderRadius: 3 },
});
