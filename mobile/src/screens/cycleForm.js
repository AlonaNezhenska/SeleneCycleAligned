import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  Minus, Plus, CloudRain, Brain, Sparkles, AlertTriangle, BatteryLow, Zap, Moon, Briefcase,
  Weight, Shuffle, Bone, Soup, Droplets, Timer, Candy, Check,
} from "lucide-react-native";
import {
  MIN_LENGTH, MAX_LENGTH, MIN_PERIOD, MAX_PERIOD,
  addDays, estimateCycleLength, periodLengthFromDates,
} from "../shared";
import { T, F, tone } from "../ui/theme";
import { IconBtn, Body, Chip, SectionLabel, s } from "../ui/kit";
import { Calendar, shortDate } from "../ui/Calendar";

/* ---------------------------------------------------------------
   CYCLE FORM — the questions about dates and lengths, shared by
   onboarding and the Profile edit screens. Every question has a
   "not sure" way out: Selena would rather know less than guess wrong.
   --------------------------------------------------------------- */

/** − value + control. Real buttons, so it works with a screen reader. */
export const Stepper = ({ label, valueText, onLess, onMore, lessLabel, moreLabel, dark = false }) => {
  const c = tone(dark);
  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Body size={13} weight="medium" color={c.text} style={{ marginBottom: 6 }}>
          {label}
        </Body>
      )}
      <View style={[s.row, styles.stepper, { borderColor: c.hair, backgroundColor: dark ? c.surface : T.canvas }]}>
        <IconBtn label={lessLabel} onPress={onLess} dark={dark} style={{ borderWidth: 0 }}>
          <Minus size={16} color={c.text} />
        </IconBtn>
        <Text accessibilityLiveRegion="polite" style={{ flex: 1, textAlign: "center", fontFamily: F.sansMed, fontSize: 15, color: c.text }}>
          {valueText}
        </Text>
        <IconBtn label={moreLabel} onPress={onMore} dark={dark} style={{ borderWidth: 0 }}>
          <Plus size={16} color={c.text} />
        </IconBtn>
      </View>
    </View>
  );
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const days = (n) => `${n} day${n === 1 ? "" : "s"}`;

/** Three ways to answer "how long": a number, a range, or "I don't know". */
const ModeChips = ({ value, onChange, labels }) => (
  <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 14 }]} accessibilityRole="radiogroup">
    {[
      ["exact", labels.exact],
      ["varies", "It varies"],
      ["unknown", "I don't know"],
    ].map(([key, text]) => (
      <Chip key={key} label={text} selected={value === key} onPress={() => onChange(key)} />
    ))}
  </View>
);

/* ---- Last period: calendar with first and last day ---- */

export const LastPeriodSection = ({ data, set, today }) => {
  const length = periodLengthFromDates(data.lastPeriod, data.lastPeriodEnd);

  if (data.lastPeriodUnknown) {
    return (
      <View testID="last-period-unknown">
        <Body size={14} color={T.ink} style={{ marginBottom: 8 }}>
          No problem. Until you log your next period, Selena follows how you feel each day instead of the calendar.
        </Body>
        <Chip label="Actually, I remember" onPress={() => set({ lastPeriodUnknown: false })} />
      </View>
    );
  }

  const summary = !data.lastPeriod
    ? "Tap the first day of your last period, then the last day."
    : data.periodOngoing
    ? `Started ${shortDate(data.lastPeriod)} and still going.`
    : data.lastPeriodEnd
    ? `${shortDate(data.lastPeriod)} to ${shortDate(data.lastPeriodEnd)} · ${days(length)}`
    : `Started ${shortDate(data.lastPeriod)}. Now tap the last day, or choose Still on it.`;

  return (
    <View>
      <Calendar
        mode="range"
        start={data.lastPeriod}
        end={data.lastPeriodEnd}
        maxDate={today}
        testID="last-period-calendar"
        onChange={({ start, end }) => {
          const len = periodLengthFromDates(start, end);
          set({
            lastPeriod: start,
            lastPeriodEnd: end,
            periodOngoing: false,
            // a logged period is the best answer to "how long"
            ...(len ? { periodMode: "exact", periodLength: len, periodVaries: false } : {}),
          });
        }}
      />
      <Body size={13.5} color={T.ink} style={{ marginTop: 10, marginBottom: 10 }} accessibilityLiveRegion="polite" testID="last-period-summary">
        {summary}
      </Body>
      <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
        {data.lastPeriod && !data.lastPeriodEnd && (
          <Chip label="Still on it" selected={data.periodOngoing} onPress={() => set({ periodOngoing: !data.periodOngoing })} />
        )}
        <Chip label="I don't remember" onPress={() => set({ lastPeriod: null, lastPeriodEnd: null, periodOngoing: false, lastPeriodUnknown: true })} />
      </View>
    </View>
  );
};

/* ---- Period length: number, range or unknown ---- */

export const PeriodLengthSection = ({ data, set }) => {
  const mode = data.periodMode ?? "exact";
  const choose = (m) =>
    set({ periodMode: m, periodVaries: m === "varies", periodLength: m === "exact" ? data.periodLength || 5 : m === "unknown" ? null : data.periodLength });
  const fromDates = periodLengthFromDates(data.lastPeriod, data.lastPeriodEnd);

  return (
    <View>
      <ModeChips value={mode} onChange={choose} labels={{ exact: "About the same" }} />
      {mode === "exact" && (
        <Stepper
          valueText={days(data.periodLength || 5)}
          lessLabel="Shorter period"
          moreLabel="Longer period"
          onLess={() => set({ periodLength: clamp((data.periodLength || 5) - 1, MIN_PERIOD, MAX_PERIOD) })}
          onMore={() => set({ periodLength: clamp((data.periodLength || 5) + 1, MIN_PERIOD, MAX_PERIOD) })}
        />
      )}
      {mode === "varies" && (
        <>
          <Stepper
            label="Shortest"
            valueText={days(data.periodLengthMin)}
            lessLabel="Shortest period, fewer days"
            moreLabel="Shortest period, more days"
            onLess={() => set({ periodLengthMin: clamp(data.periodLengthMin - 1, MIN_PERIOD, data.periodLengthMax) })}
            onMore={() => set({ periodLengthMin: clamp(data.periodLengthMin + 1, MIN_PERIOD, data.periodLengthMax) })}
          />
          <Stepper
            label="Longest"
            valueText={days(data.periodLengthMax)}
            lessLabel="Longest period, fewer days"
            moreLabel="Longest period, more days"
            onLess={() => set({ periodLengthMax: clamp(data.periodLengthMax - 1, data.periodLengthMin, MAX_PERIOD) })}
            onMore={() => set({ periodLengthMax: clamp(data.periodLengthMax + 1, data.periodLengthMin, MAX_PERIOD) })}
          />
        </>
      )}
      {mode === "unknown" && <Body size={13}>That's fine. Selena will learn it from the periods you log.</Body>}
      {fromDates && mode === "exact" && data.periodLength !== fromDates && (
        <Body size={12} style={{ marginTop: 2 }}>{`Your last period lasted ${days(fromDates)}.`}</Body>
      )}
    </View>
  );
};

/* ---- Cycle length: number, range, or worked out from two start dates ---- */

export const CycleLengthSection = ({ data, set, today }) => {
  const mode = data.cycleMode ?? "exact";
  const choose = (m) =>
    set({ cycleMode: m, cycleVaries: m === "varies", cycleLength: m === "exact" ? data.cycleLength || 28 : m === "unknown" ? null : data.cycleLength });
  const estimate = estimateCycleLength(data.previousPeriod, data.lastPeriod);
  const latest = data.lastPeriod ? addDays(data.lastPeriod, -1) : today;

  return (
    <View>
      <ModeChips value={mode} onChange={choose} labels={{ exact: "I know it" }} />
      {mode === "exact" && (
        <Stepper
          valueText={days(data.cycleLength || 28)}
          lessLabel="Shorter cycle"
          moreLabel="Longer cycle"
          onLess={() => set({ cycleLength: clamp((data.cycleLength || 28) - 1, MIN_LENGTH, MAX_LENGTH) })}
          onMore={() => set({ cycleLength: clamp((data.cycleLength || 28) + 1, MIN_LENGTH, MAX_LENGTH) })}
        />
      )}
      {mode === "varies" && (
        <>
          <Stepper
            label="Shortest"
            valueText={days(data.cycleLengthMin)}
            lessLabel="Shortest cycle, fewer days"
            moreLabel="Shortest cycle, more days"
            onLess={() => set({ cycleLengthMin: clamp(data.cycleLengthMin - 1, MIN_LENGTH, data.cycleLengthMax) })}
            onMore={() => set({ cycleLengthMin: clamp(data.cycleLengthMin + 1, MIN_LENGTH, data.cycleLengthMax) })}
          />
          <Stepper
            label="Longest"
            valueText={days(data.cycleLengthMax)}
            lessLabel="Longest cycle, fewer days"
            moreLabel="Longest cycle, more days"
            onLess={() => set({ cycleLengthMax: clamp(data.cycleLengthMax - 1, data.cycleLengthMin, MAX_LENGTH) })}
            onMore={() => set({ cycleLengthMax: clamp(data.cycleLengthMax + 1, data.cycleLengthMin, MAX_LENGTH) })}
          />
        </>
      )}
      {mode === "unknown" && (
        <View>
          {data.previousPeriodUnknown ? (
            <>
              <Body size={13} style={{ marginBottom: 8 }}>
                Selena will use 28 days for now and work out your own length from the periods you log.
              </Body>
              <Chip label="Actually, I remember" onPress={() => set({ previousPeriodUnknown: false })} />
            </>
          ) : (
            <>
              <Body size={13.5} weight="medium" color={T.ink} style={{ marginBottom: 8 }}>
                Do you remember when the period before your last one started?
              </Body>
              <Calendar mode="single" value={data.previousPeriod} maxDate={latest} onChange={(d) => set({ previousPeriod: d })} testID="previous-period-calendar" />
              <Body size={13.5} color={T.ink} style={{ marginVertical: 10 }} accessibilityLiveRegion="polite" testID="cycle-estimate">
                {!data.previousPeriod
                  ? "Tap the day it started, if you remember."
                  : !data.lastPeriod
                  ? "Add your last period too, and Selena will work out your cycle length."
                  : estimate
                  ? `That makes your cycle about ${days(estimate)}.`
                  : "Those dates are too close together or too far apart to estimate. Selena will use 28 days for now."}
              </Body>
              <Chip label="I don't remember either" onPress={() => set({ previousPeriod: null, previousPeriodUnknown: true })} />
            </>
          )}
        </View>
      )}
    </View>
  );
};

/* ---- Hardest hurdles ---- */

export const HURDLE_GROUPS = [
  {
    title: "Before your period",
    items: [
      { key: "Mood swings & anxiety", icon: CloudRain, sub: "Irritability, overthinking, tearfulness" },
      { key: "Brain fog", icon: Brain, sub: "Hard to focus, forgetful" },
      { key: "Bloating & breakouts", icon: Sparkles, sub: "Skin, bloating, tender breasts" },
      { key: "Cravings", icon: Candy, sub: "Sugar, salt, comfort food" },
      { key: "PMDD", icon: AlertTriangle, sub: "Severe, disabling premenstrual symptoms" },
    ],
  },
  {
    title: "During your period",
    items: [
      { key: "Period fatigue", icon: BatteryLow, sub: "Everyday tasks feel heavy" },
      { key: "Cramps & pain", icon: Zap, sub: "Belly or back pain" },
      { key: "Poor sleep", icon: Moon, sub: "Hard to fall or stay asleep" },
      { key: "Work & social strain", icon: Briefcase, sub: "Keeping up while it's brushed off as normal" },
    ],
  },
  {
    title: "When you train",
    items: [
      { key: "Luteal drag", icon: Weight, sub: "Usual weights and paces feel much heavier" },
      { key: "Clumsy days", icon: Shuffle, sub: "Timing and coordination feel off" },
      { key: "Injury worries", icon: Bone, sub: "Looser joints around phase changes" },
      { key: "Gut trouble mid-workout", icon: Soup, sub: "Nausea, bloating, cramping" },
      { key: "Fear of leaking", icon: Droplets, sub: "Flooding during lifts, sprints or team sport" },
      { key: "Soreness that won't quit", icon: Timer, sub: "Slow recovery before your period" },
    ],
  },
];

export const HurdlesSection = ({ value = [], onChange }) => {
  const toggle = (k) => onChange(value.includes(k) ? value.filter((h) => h !== k) : [...value, k]);
  return (
    <View style={{ gap: 18 }}>
      {HURDLE_GROUPS.map((g) => (
        <View key={g.title} accessibilityLabel={g.title}>
          <SectionLabel>{g.title}</SectionLabel>
          <View style={{ gap: 8 }}>
            {g.items.map(({ key, icon: Icon, sub }) => {
              const on = value.includes(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => toggle(key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={key}
                  style={[styles.hurdle, { borderColor: on ? T.terracotta : T.hair, backgroundColor: on ? "rgba(164,74,51,0.08)" : T.canvas }]}
                >
                  <Icon size={18} color={on ? T.terracotta : T.ink} strokeWidth={1.6} />
                  <View style={{ flex: 1 }}>
                    <Body size={14} weight="medium" color={T.ink}>
                      {key}
                    </Body>
                    <Body size={12}>{sub}</Body>
                  </View>
                  <View style={[styles.box, on && { backgroundColor: T.terracotta, borderColor: T.terracotta }]}>
                    {on && <Check size={14} color={T.canvas} strokeWidth={2.6} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepper: { borderWidth: 1, paddingHorizontal: 4 },
  hurdle: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  box: { width: 24, height: 24, borderWidth: 1.5, borderColor: T.inkSoft, alignItems: "center", justifyContent: "center" },
});
