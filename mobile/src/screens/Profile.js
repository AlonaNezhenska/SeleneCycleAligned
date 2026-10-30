import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Pencil, ChevronRight, ShieldCheck, Moon, User, Activity } from "lucide-react-native";
import { resolveCycleLength, resolvePeriodLength, nextPeriodStart, MIN_LENGTH, MAX_LENGTH } from "../shared";
import { useApp } from "../state/AppState";
import { T } from "../ui/theme";
import { Screen, Card, Serif, Body, SectionLabel, s } from "../ui/kit";
import { shortDate } from "../ui/Calendar";
import { DEFAULT_TRACKING } from "../ui/TrackChoices";

/* ---------------------------------------------------------------
   PROFILE — everything the user has told Selena, in one place,
   with a way to change each part.
   --------------------------------------------------------------- */

const NOT_SURE = "Not sure yet";
const days = (n) => `${n} day${n === 1 ? "" : "s"}`;

const Row = ({ label, value, testID }) => (
  <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`} testID={testID}>
    <Body size={13} style={{ flex: 1 }}>
      {label}
    </Body>
    <Body size={13.5} color={T.ink} weight="medium" style={{ flex: 1.4, textAlign: "right" }}>
      {value}
    </Body>
  </View>
);

const Section = ({ title, icon: Icon, onEdit, editLabel, children }) => (
  <View style={{ marginBottom: 20 }}>
    <View style={[s.row, { justifyContent: "space-between", marginBottom: 2 }]}>
      <View style={[s.row, { gap: 8 }]}>
        <Icon size={15} color={T.inkSoft} strokeWidth={1.7} />
        <SectionLabel>{title}</SectionLabel>
      </View>
      {onEdit && (
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={editLabel} style={styles.edit}>
          <Pencil size={13} color={T.sage} />
          <Body size={12.5} weight="medium" color={T.sage}>
            Edit
          </Body>
        </Pressable>
      )}
    </View>
    <Card style={{ paddingVertical: 6 }}>{children}</Card>
  </View>
);

/** Plain-language summaries of what the engine is working with. */
export const describeCycle = (p) => {
  const cycle = resolveCycleLength(p);
  const period = resolvePeriodLength(p);
  const lastPeriod = !p.lastPeriod
    ? NOT_SURE
    : p.lastPeriodEnd
    ? `${shortDate(p.lastPeriod)} to ${shortDate(p.lastPeriodEnd)}`
    : p.periodOngoing
    ? `Since ${shortDate(p.lastPeriod)}, still going`
    : `Started ${shortDate(p.lastPeriod)}`;
  const periodLength =
    period.source === "unknown"
      ? NOT_SURE
      : period.source === "range"
      ? `${p.periodLengthMin}–${p.periodLengthMax} days (varies)`
      : days(period.length);
  const cycleLength = {
    range: `${p.cycleLengthMin}–${p.cycleLengthMax} days (varies)`,
    entered: days(cycle.length),
    estimated: `About ${days(cycle.length)}, from your last two periods`,
    default: `${NOT_SURE} · using 28 days for now`,
  }[cycle.source];
  return { lastPeriod, periodLength, cycleLength };
};

export function Profile() {
  const { profile: p, ctx, backup, agreement } = useApp();
  const { lastPeriod, periodLength, cycleLength } = describeCycle(p);
  const next = nextPeriodStart(p);
  const tracking = p.tracking ?? DEFAULT_TRACKING;

  return (
    <Screen>
      <Serif size={28} accessibilityRole="header" style={{ marginBottom: 4 }}>
        Your profile
      </Serif>
      <Body style={{ marginBottom: 22 }}>Everything you have told Selena. Change anything, any time.</Body>

      <Section title="Your cycle" icon={Moon} onEdit={() => router.push("/edit-cycle")} editLabel="Edit cycle details">
        <Row label="Last period" value={lastPeriod} testID="profile-last-period" />
        <Row label="Period length" value={periodLength} testID="profile-period-length" />
        <Row label="Cycle length" value={cycleLength} testID="profile-cycle-length" />
        <Row
          label="Today"
          value={p.onBirthControl ? "Following your Vibe Check" : ctx.calendarKnown ? `Day ${ctx.day} · ${ctx.phaseLabel}` : "Add your last period to see this"}
        />
        <Row
          label="Next period"
          value={p.onBirthControl ? "Not predicted on birth control" : next ? `Around ${shortDate(next)}` : NOT_SURE}
          testID="profile-next-period"
        />
      </Section>

      <Section title="About you" icon={User} onEdit={() => router.push("/edit-about")} editLabel="Edit about you">
        <Row label="Age group" value={p.ageGroup === "40+" ? "40+" : "20s / 30s"} />
        <Row label="Hormonal birth control" value={p.onBirthControl ? "Yes" : "No"} />
        <Row label="Intention" value={p.goal ?? "Not chosen"} />
        <Row label="Hardest hurdles" value={p.hurdles?.length ? p.hurdles.join(", ") : "None chosen"} testID="profile-hurdles" />
      </Section>

      <Section title="What Selena follows" icon={Activity} onEdit={() => router.push("/privacy")} editLabel="Edit what Selena follows">
        <Row label="Cycle" value="Always on" />
        <Row label="Training" value={tracking.training ? "On" : "Off"} />
        <Row label="Nutrition" value={tracking.nutrition ? `On · ${p.trackingStyle}` : "Off"} />
      </Section>

      <Pressable onPress={() => router.push("/privacy")} accessibilityRole="button" accessibilityLabel="You & your data" style={styles.link}>
        <ShieldCheck size={18} color={T.sage} strokeWidth={1.6} />
        <View style={{ flex: 1 }}>
          <Body size={14} weight="medium" color={T.ink}>
            You & your data
          </Body>
          <Body size={12}>
            {backup.user ? `Backed up as ${backup.user.email}` : "Stored only on this phone"}
            {agreement?.acceptedAt ? " · agreement accepted" : ""}
          </Body>
        </View>
        <ChevronRight size={18} color={T.inkSoft} />
      </Pressable>
      <Body size={11.5} style={{ textAlign: "center", marginTop: 14 }}>
        {`Cycles between ${MIN_LENGTH} and ${MAX_LENGTH} days are supported.`}
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.hair, paddingVertical: 8 },
  edit: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44, paddingHorizontal: 6 },
  link: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, borderRadius: 18, borderWidth: 1, borderColor: T.hair, backgroundColor: T.surface, paddingHorizontal: 16 },
});
