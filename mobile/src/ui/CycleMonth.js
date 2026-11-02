import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight, Droplet } from "lucide-react-native";
import { PHASE_TINT, isoOf, monthDays, describeJournal, loggedFlow, samePhase, phaseSpan, DEEP_PHASES } from "../lib/cycleMonth";
import { CAL_GROUPS } from "../shared";
import { T, F } from "./theme";
import { IconBtn, Body, s } from "./kit";

/* ---------------------------------------------------------------
   CYCLE MONTH — the cycle as a calendar on softly washed water.

   Each date sits on a wash of its phase colour; period days are
   filled, the likely next period is outlined, and the sun marks the
   approximate ovulation day. A small dot means something was logged
   in the tracker. Tap a date and its whole phase lights up, with the
   phase named and the day read back below the grid.
   --------------------------------------------------------------- */

const SUN = require("../../assets/images/sun.png");
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const FLOW_WORD = {
  spotting: "Spotting",
  light: "Light flow",
  medium: "Medium flow",
  heavy: "Heavy flow",
  "very-heavy": "Very heavy flow",
};

const longDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const groupLabel = (key) => CAL_GROUPS.find((g) => g.key === key)?.label;

/** Hex colour with an alpha, for the gentle phase washes. */
const wash = (hex, a) =>
  `${hex}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

const DayCell = ({ n, info, selected, lit, isToday, onPress }) => {
  const tint = info.group ? PHASE_TINT[info.group] : null;
  const words = [
    longDate(info.iso),
    info.period && "period",
    info.expectedPeriod && "period likely",
    info.ovulation && "approximate ovulation",
    info.logged && "symptoms logged",
  ].filter(Boolean);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={words.join(", ")}
      accessibilityState={{ selected }}
      testID={`day-${info.iso}`}
      style={styles.cell}
    >
      <View
        testID={lit ? `lit-${info.iso}` : undefined}
        style={[
          styles.disc,
          tint && { backgroundColor: wash(tint, 0.3) },
          // the tapped phase, lit as one stretch
          tint && lit && { backgroundColor: wash(tint, 0.78), borderWidth: 1.5, borderColor: tint },
          info.period && {
            backgroundColor: wash(PHASE_TINT.menstruation, 0.85),
          },
          info.expectedPeriod && {
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: PHASE_TINT.menstruation,
          },
          isToday && {
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: T.ink,
          },
          selected && styles.discSelected,
        ]}
      >
        {info.ovulation ? (
          <Image source={SUN} style={styles.sun} testID="ovulation-sun" accessibilityElementsHidden importantForAccessibility="no" />
        ) : null}
        {/* the sun stands in for the date on ovulation day */}
        {!info.ovulation && (
          <Text style={[styles.num, (selected || info.period || (lit && DEEP_PHASES.has(info.group))) && { color: T.canvas }]}>{n}</Text>
        )}
      </View>
      <View style={[styles.dot, { opacity: info.logged ? 1 : 0 }]} />
    </Pressable>
  );
};

const Legend = () => (
  <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <View style={[s.row, { gap: 6 }]}>
      <View style={[styles.swatch, { backgroundColor: wash(PHASE_TINT.menstruation, 0.85) }]} />
      <Text style={styles.legendText}>Period</Text>
    </View>
    <View style={[s.row, { gap: 6 }]}>
      <View
        style={[
          styles.swatch,
          {
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: PHASE_TINT.menstruation,
          },
        ]}
      />
      <Text style={styles.legendText}>Period likely</Text>
    </View>
    <View style={[s.row, { gap: 4 }]}>
      <Image source={SUN} style={{ width: 16, height: 18 }} />
      <Text style={styles.legendText}>Ovulation, approx.</Text>
    </View>
    <View style={[s.row, { gap: 6 }]}>
      <View style={[styles.dot, { marginTop: 0 }]} />
      <Text style={styles.legendText}>Logged</Text>
    </View>
  </View>
);

const shortDay = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** The phase a tapped date belongs to, in its own colour, with the dates it spans. */
const PhaseBanner = ({ info, span }) => {
  const ink = DEEP_PHASES.has(info.group) ? T.canvas : T.ink;
  return (
    <View style={[styles.banner, { backgroundColor: wash(PHASE_TINT[info.group], 0.9) }]} testID="phase-banner">
      <Text style={[styles.bannerName, { color: ink }]}>{`${groupLabel(info.group)} phase`}</Text>
      {span && (
        <Text style={[styles.bannerDates, { color: ink }]}>
          {span.start === span.end ? shortDay(span.start) : `${shortDay(span.start)} – ${shortDay(span.end)}`}
        </Text>
      )}
    </View>
  );
};

const DayDetail = ({ info, day, span }) => {
  const logged = describeJournal(day?.journal);
  const flow = loggedFlow(day);
  return (
    <View style={styles.detail} testID="day-detail" accessibilityLiveRegion="polite">
      {info.group && <PhaseBanner info={info} span={span} />}
      <Text style={styles.detailDate}>{longDate(info.iso)}</Text>
      {info.cycleDay && (
        <Body size={13} color={T.inkSoft}>
          {`Cycle day ${info.cycleDay}${info.ovulation ? " · around ovulation" : ""}`}
        </Body>
      )}
      {(info.period || info.expectedPeriod) && (
        <View style={[s.row, { gap: 6, marginTop: 8 }]}>
          <Droplet size={14} color={PHASE_TINT.menstruation} />
          <Body size={13.5} color={T.ink}>
            {info.period ? (flow ? `Period · ${FLOW_WORD[flow]}` : "Period") : "Your period is likely around now"}
          </Body>
        </View>
      )}
      {logged.length > 0 ? (
        logged.map((c) => (
          <View key={c.key} style={{ marginTop: 12 }}>
            <Text style={styles.detailCat}>{c.title.toUpperCase()}</Text>
            {c.lines.map((l, i) => (
              <Body key={i} size={13.5} color={T.ink} style={{ marginTop: 3 }}>
                {l}
              </Body>
            ))}
          </View>
        ))
      ) : (
        <Body size={13} color={T.inkSoft} style={{ marginTop: 10, fontStyle: "italic" }}>
          Nothing logged on this day.
        </Body>
      )}
    </View>
  );
};

export const CycleMonth = ({ profile, days, todayIso, length }) => {
  const [ty, tm] = todayIso.split("-").map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [selected, setSelected] = useState(todayIso);
  const info = useMemo(
    () =>
      monthDays({
        year: view.y,
        month: view.m,
        profile,
        days,
        todayIso,
        length,
      }),
    [view.y, view.m, profile, days, todayIso, length],
  );

  const shift = (n) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const count = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  // the selected date may be in another month; read it back all the same
  const [sy, sm] = selected.split("-").map(Number);
  const selectedInfo = info[selected] ?? monthDays({ year: sy, month: sm - 1, profile, days, todayIso, length })[selected];

  return (
    <View testID="cycle-month">
      <View style={styles.card}>
        <View style={[s.row, { justifyContent: "space-between", marginBottom: 6 }]}>
          <IconBtn label="Previous month" onPress={() => shift(-1)} style={{ borderWidth: 0 }}>
            <ChevronLeft size={18} color={T.ink} />
          </IconBtn>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.month}>
            {first.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <IconBtn label="Next month" onPress={() => shift(1)} style={{ borderWidth: 0 }}>
            <ChevronRight size={18} color={T.ink} />
          </IconBtn>
        </View>

        <View style={s.row}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={styles.weekday} accessibilityElementsHidden>
              {w}
            </Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={s.row}>
            {week.map((n, di) =>
              n ? (
                <DayCell
                  key={di}
                  n={n}
                  info={info[isoOf(view.y, view.m, n)]}
                  selected={selected === isoOf(view.y, view.m, n)}
                  lit={samePhase(info[isoOf(view.y, view.m, n)], selectedInfo)}
                  isToday={todayIso === isoOf(view.y, view.m, n)}
                  onPress={() => setSelected(isoOf(view.y, view.m, n))}
                />
              ) : (
                <View key={di} style={styles.cell} />
              ),
            )}
          </View>
        ))}

        <Legend />
      </View>

      {!profile.lastPeriod && (
        <Body size={12.5} color={T.inkSoft} style={{ marginTop: 10, textAlign: "center" }}>
          Add your last period to see your phases on the calendar.
        </Body>
      )}

      {selectedInfo && <DayDetail info={selectedInfo} day={days[selected]} span={phaseSpan(selectedInfo, profile, length)} />}
      <Body size={11.5} color={T.inkFaint} style={{ marginTop: 10, textAlign: "center" }}>
        Phases and ovulation are estimates from your usual cycle length.
      </Body>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 12,
    backgroundColor: "rgba(255,252,248,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,252,248,0.8)",
  },
  month: { fontFamily: F.serif, fontSize: 18, color: T.ink },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: F.sansMed,
    fontSize: 11.5,
    letterSpacing: 1,
    color: T.inkSoft,
    marginBottom: 4,
  },
  cell: { flex: 1, alignItems: "center", paddingVertical: 3, minHeight: 48 },
  disc: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  discSelected: { backgroundColor: T.ink },
  num: { fontFamily: F.sansMed, fontSize: 14, color: T.ink },
  sun: { width: 36, height: 42 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: T.ink,
    marginTop: 3,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    rowGap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: F.sans, fontSize: 11.5, color: T.inkSoft },
  detail: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,252,248,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,252,248,0.85)",
  },
  banner: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 10,
  },
  bannerName: { fontFamily: F.serif, fontSize: 16, color: T.ink },
  bannerDates: { fontFamily: F.sans, fontSize: 12.5, color: T.ink },
  detailDate: {
    fontFamily: F.serifItalic,
    fontSize: 21,
    color: T.ink,
    marginBottom: 2,
  },
  detailCat: {
    fontFamily: F.serif,
    fontSize: 12.5,
    letterSpacing: 2.4,
    color: T.inkSoft,
  },
});
