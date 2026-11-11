import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Modal, Image, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";
import { ArrowLeft, Check, ChevronDown, LifeBuoy, EyeOff, Salad, Users, Lock, CalendarDays } from "lucide-react-native";
import { Calendar, shortDate } from "../ui/Calendar";
import { CategorySheet } from "./TrackCategory";
import { triadTip, isHighSymptom } from "../shared";
import { useApp, dateKey } from "../state/AppState";
import { useTracker } from "../state/TrackerSession";
import { BLOOM_SHEET } from "../content/bloom";
import { COLLECTIONS, inCollection, countIn, journalSignals } from "../content/journal";
import { T, F, tone, IMG } from "../ui/theme";
import { Screen, IconBtn, Serif, Body, SectionLabel, s } from "../ui/kit";

/* ---------------------------------------------------------------
   3. THE TRACKER — today's journal.

   The main page shows every category as glass bubbles on moss, one
   constellation per collection. A bubble opens its category as a pop-up
   over the blurred tracker. Nothing is written until the one
   "Save symptoms" button at the bottom saves the whole session.
   --------------------------------------------------------------- */

export const OLIVE = "#4A4A2B";
export const GLOW = "#F2E2A6";

/** Where each bubble sits, as fractions of the constellation's width,
 *  which lines join them, and where the points of light fall. */
const LAYOUTS = {
  body: {
    ratio: 0.98,
    nodes: {
      emotional: { x: 0.5, y: 0.17, r: 0.145 },
      energy: { x: 0.18, y: 0.41, r: 0.14 },
      flow: { x: 0.82, y: 0.43, r: 0.14 },
      physical: { x: 0.5, y: 0.56, r: 0.175 },
      skin: { x: 0.17, y: 0.8, r: 0.14 },
      digestion: { x: 0.83, y: 0.8, r: 0.14 },
    },
    links: [["emotional", "energy"], ["emotional", "flow"], ["energy", "physical"], ["flow", "physical"], ["energy", "skin"], ["flow", "digestion"], ["skin", "digestion"]],
  },
  lifestyle: {
    ratio: 0.9,
    nodes: {
      sleep: { x: 0.5, y: 0.2, r: 0.155 },
      cravings: { x: 0.19, y: 0.52, r: 0.15 },
      activities: { x: 0.81, y: 0.52, r: 0.15 },
      intimacy: { x: 0.5, y: 0.8, r: 0.155 },
    },
    links: [["sleep", "cravings"], ["sleep", "activities"], ["cravings", "intimacy"], ["activities", "intimacy"]],
  },
  health: {
    ratio: 0.9,
    nodes: {
      contraception: { x: 0.5, y: 0.2, r: 0.155 },
      medication: { x: 0.19, y: 0.52, r: 0.15 },
      supplements: { x: 0.81, y: 0.52, r: 0.15 },
      conditions: { x: 0.5, y: 0.8, r: 0.155 },
    },
    links: [["contraception", "medication"], ["contraception", "supplements"], ["medication", "conditions"], ["supplements", "conditions"]],
  },
};


/** What a saved journal reads back — offered, never auto-applied. */
const readSignals = (ids, app) => {
  const has = (k) => ids.includes(k);
  const out = [];
  if (isHighSymptom(ids))
    out.push({ key: "deload", icon: LifeBuoy, title: "Today asks for less.", body: "Your load is high enough that pushing costs more than it returns. Resting today earns the same check as a lift." });
  if (has("hermit"))
    out.push({ key: "hermit", icon: Users, title: "Your social battery is flat.", body: "Wanting to be alone is chemistry, not a character flaw. Protect the quiet." });
  if (has("bottomless") && app.ctx.buffer)
    out.push({
      key: "buffer",
      icon: Salad,
      title: "Your burn is genuinely higher.",
      body: "The luteal phase costs more energy. Eating to that is the plan working.",
      action: app.today.bufferAccepted ? "Buffer on" : "Use the Luteal Buffer",
      onAction: app.today.bufferAccepted ? null : () => app.setToday({ bufferAccepted: true }),
    });
  if (has("body-image"))
    out.push({ key: "hide", icon: EyeOff, title: "The mirror is unreliable today.", body: "You can hide the numbers and let the data keep working underneath." });
  return out;
};

/* ---- a constellation of category bubbles ---- */

const Constellation = ({ collection, draft, onOpen }) => {
  const layout = LAYOUTS[collection];
  const [w, setW] = useState(0);
  const h = w * layout.ratio;
  const pos = (k) => ({ x: layout.nodes[k].x * w, y: layout.nodes[k].y * h, r: layout.nodes[k].r * w });

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: "100%", height: h || 300 }} testID={`constellation-${collection}`}>
      {w > 0 && (
        <>
          <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {layout.links.map(([a, b]) => {
              const A = pos(a);
              const B = pos(b);
              // a soft bow from rim to rim, so no line crosses the glass
              const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
              const ux = (B.x - A.x) / len;
              const uy = (B.y - A.y) / len;
              const x1 = A.x + ux * A.r;
              const y1 = A.y + uy * A.r;
              const x2 = B.x - ux * B.r;
              const y2 = B.y - uy * B.r;
              const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18;
              const my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
              return <Path key={a + b} d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke={GLOW} strokeOpacity={0.5} strokeWidth={1} fill="none" />;
            })}
          </Svg>

          {inCollection(collection).map((cat) => {
            const { x, y, r } = pos(cat.key);
            const count = countIn(draft, cat.key);
            const Icon = cat.icon;
            const name = cat.label;
            return (
              <Pressable
                key={cat.key}
                onPress={() => onOpen(cat.key)}
                accessibilityRole="button"
                accessibilityLabel={count ? `${name}, ${count} selected` : name}
                style={[
                  styles.bubble,
                  { left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r },
                  count ? styles.bubbleOn : styles.bubbleOff,
                ]}
              >
                <Icon size={r * 0.38} color={T.canvas} strokeWidth={1.3} />
                <Text numberOfLines={2} style={{ fontFamily: F.serif, fontSize: name.length > 10 ? 13 : r > 60 ? 17 : 15, color: T.canvas, marginTop: 4, textAlign: "center", paddingHorizontal: 6 }}>
                  {name}
                </Text>
                {cat.private && <Lock size={11} color={GLOW} style={{ marginTop: 2 }} />}
                {count > 0 && (
                  <View style={styles.badge}>
                    <Text style={{ fontFamily: F.sansSemi, fontSize: 10.5, color: OLIVE }}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
};

const Collection = ({ collection, open, onToggle, draft, children }) => {
  const c = tone(true);
  const total = inCollection(collection.key).reduce((n, cat) => n + countIn(draft, cat.key), 0);
  return (
    <View style={{ marginTop: 18 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={collection.label}
        style={[s.row, { justifyContent: "space-between", minHeight: 44 }]}
      >
        <Text style={[s.eyebrow, { color: c.text }]}>{collection.label}</Text>
        <View style={[s.row, { gap: 8 }]}>
          {total > 0 && <Body size={12} color={c.textSoft}>{`${total} selected`}</Body>}
          <ChevronDown size={18} color={c.textSoft} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
        </View>
      </Pressable>
      {open && <View style={{ marginTop: 8 }}>{children}</View>}
    </View>
  );
};

/* ---- which day is being logged: the last week, or any earlier day ---- */

const back7 = (todayKey) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${todayKey}T12:00:00`);
    d.setDate(d.getDate() - i);
    return dateKey(d);
  });

const dayName = (key, todayKey, i) =>
  i === 0 ? "Today" : i === 1 ? "Yesterday" : new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });

const DayPicker = ({ date, todayKey, onPick }) => {
  const [calendar, setCalendar] = useState(false);
  const week = back7(todayKey);
  const earlier = !week.includes(date);
  return (
    <View style={{ marginBottom: 14 }} testID="day-picker">
      <View style={[s.row, { gap: 6 }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
        {week.map((key, i) => {
          const on = key === date;
          return (
            <Pressable
              key={key}
              onPress={() => onPick(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={i < 2 ? dayName(key, todayKey, i) : shortDate(key)}
              style={[styles.day, on && styles.dayOn]}
            >
              <Text style={[styles.dayName, on && { color: OLIVE }]}>{dayName(key, todayKey, i)}</Text>
              <Text style={[styles.dayNum, on && { color: OLIVE }]}>{Number(key.slice(8))}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
        {/* always in reach, however far the week scrolls */}
        <Pressable
          onPress={() => setCalendar((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ selected: earlier, expanded: calendar }}
          accessibilityLabel="An earlier day"
          style={[styles.day, earlier && styles.dayOn]}
        >
          <CalendarDays size={16} color={earlier ? OLIVE : T.canvas} />
          <Text style={[styles.dayName, earlier && { color: OLIVE }]}>{earlier ? shortDate(date).split(" ").slice(1).join(" ") : "Earlier"}</Text>
        </Pressable>
      </View>
      {calendar && (
        <View style={{ marginTop: 10, backgroundColor: T.canvas }}>
          <Calendar
            mode="single"
            value={date}
            maxDate={todayKey}
            onChange={(d) => {
              setCalendar(false);
              onPick(d);
            }}
          />
        </View>
      )}
    </View>
  );
};

/* ---- the screen ---- */

export function Triad() {
  const app = useApp();
  const { ctx } = app;
  const t = useTracker();
  const [open, setOpen] = useState({ body: true, lifestyle: true, health: true });
  const [sheet, setSheet] = useState(null);
  const blurTarget = useRef(null);
  const [tip, setTip] = useState(null);

  // fetch the peony sheet while the bubbles are on screen, so it is ready
  // before the first intensity window opens
  useEffect(() => {
    const uri = Image.resolveAssetSource?.(BLOOM_SHEET)?.uri;
    if (uri && Image.prefetch) Image.prefetch(uri).catch(() => {});
  }, []);
  const [leaving, setLeaving] = useState(false);
  // a day picked while choices are unsaved waits for "discard" first
  const [switchTo, setSwitchTo] = useState(null);
  const c = tone(true);
  const { date: dateParam } = useLocalSearchParams();

  // opening the log starts on today (or the day a link asks for), unless a session is still being edited
  useEffect(() => {
    if (!t.dirty) t.setDate(typeof dateParam === "string" ? dateParam : app.todayKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam, app.todayKey]);

  const pickDay = (key) => {
    if (key === t.date) return;
    if (t.dirty) setSwitchTo(key);
    else {
      setTip(null);
      t.setDate(key);
    }
  };

  // what a saved journal means is about today, not a day gone by
  const signals = t.isToday ? readSignals(journalSignals(t.saved), app) : [];

  const save = () => {
    const journal = t.save();
    if (t.isToday) setTip(triadTip({ signals: journalSignals(journal), phase: ctx.phase }));
  };
  const leave = () => (router.canGoBack?.() ? router.back() : router.navigate("/cycle"));
  const back = () => (t.dirty ? setLeaving(true) : leave());

  const footer = (
    <View style={styles.footer}>
      {t.savedAt && !t.dirty ? (
        <View style={[styles.saveBtn, styles.saved]} accessibilityLiveRegion="polite" testID="saved-confirmation">
          <Check size={18} color={OLIVE} strokeWidth={2.4} />
          <Text style={{ fontFamily: F.serif, fontSize: 18, color: OLIVE }}>{t.isToday ? "Saved for today" : `Saved for ${shortDate(t.date)}`}</Text>
        </View>
      ) : (
        <Pressable
          onPress={t.dirty ? save : undefined}
          disabled={!t.dirty}
          accessibilityRole="button"
          accessibilityState={{ disabled: !t.dirty }}
          accessibilityLabel="Save symptoms"
          style={[styles.saveBtn, !t.dirty && { opacity: 0.55 }]}
        >
          <Text style={{ fontFamily: F.serif, fontSize: 18, color: OLIVE }}>Save symptoms</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Screen
      bg="forest"
      image={IMG.backgrounds.tracker}
      blur={14}
      scrim="rgba(10,18,12,0.55)"
      footer={footer}
      blurTarget={blurTarget}
      overlay={
        sheet && (
          <View style={StyleSheet.absoluteFill} testID="category-popup">
            <BlurView intensity={45} tint="dark" blurMethod="dimezisBlurView" blurTarget={blurTarget} style={StyleSheet.absoluteFill} />
            <View style={styles.popup} accessibilityViewIsModal>
              <CategorySheet categoryKey={sheet} onClose={() => setSheet(null)} />
            </View>
          </View>
        )
      }
    >
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 10 }]}>
        <IconBtn label="Back" onPress={back} dark>
          <ArrowLeft size={18} color={T.canvas} />
        </IconBtn>
        <View style={{ width: 44 }} />
      </View>

      <DayPicker date={t.date} todayKey={app.todayKey} onPick={pickDay} />

      <Body size={13} color={c.textSoft} weight="medium" style={{ textAlign: "center" }}>
        {!t.isToday ? shortDate(t.date) : ctx.calendarKnown ? `Cycle Day ${ctx.day} · ${ctx.phaseLabel} phase` : "Today"}
      </Body>
      <Serif size={27} color={T.canvas} accessibilityRole="header" style={{ textAlign: "center", marginBottom: 4 }}>
        {t.isToday ? "How are you feeling today?" : "How were you feeling that day?"}
      </Serif>
      <Body size={13} color={c.textSoft} style={{ textAlign: "center" }}>
        Tap a category. Everything saves together at the end.
      </Body>

      {COLLECTIONS.map((col) => (
        <Collection key={col.key} collection={col} open={open[col.key]} onToggle={() => setOpen((o) => ({ ...o, [col.key]: !o[col.key] }))} draft={t.draft}>
          <Constellation collection={col.key} draft={t.draft} onOpen={setSheet} />
        </Collection>
      ))}

      {t.dirty && (
        <View style={[styles.notice]} accessibilityLiveRegion="polite" testID="unsaved">
          <Body size={13} color={T.canvas} style={{ flex: 1 }}>
            Not saved yet. Your choices are kept while you move between categories.
          </Body>
          <Pressable onPress={t.discard} accessibilityRole="button" style={styles.discard}>
            <Body size={12.5} weight="medium" color={T.canvas}>
              Discard
            </Body>
          </Pressable>
        </View>
      )}

      {tip && !t.dirty && (
        <View style={styles.tip} accessibilityLiveRegion="polite" accessibilityLabel="Tip" testID="tip">
          <SectionLabel>Saved · one nudge</SectionLabel>
          <Serif size={18}>{tip.title}</Serif>
          <Body size={13} style={{ marginTop: 6 }}>
            {tip.body}
          </Body>
        </View>
      )}

      {signals.length > 0 && (
        <View style={{ marginTop: 18 }}>
          <SectionLabel dark>What this means today</SectionLabel>
          <View style={{ gap: 12 }}>
            {signals.map(({ key, icon: Icon, title, body, action, onAction }) => (
              <View key={key} style={[styles.signal, { borderColor: c.hair }]}>
                <View style={[styles.signalIcon, { backgroundColor: c.surfaceDeep }]}>
                  <Icon size={15} color={T.canvas} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body size={13} weight="semi" color={c.text}>
                    {title}
                  </Body>
                  <Body size={12} color={c.textSoft}>
                    {body}
                  </Body>
                  {action && (
                    <Pressable
                      onPress={onAction ?? undefined}
                      disabled={!onAction}
                      accessibilityRole="button"
                      style={[styles.signalBtn, { borderColor: c.hair, backgroundColor: onAction ? c.surfaceDeep : "transparent" }]}
                    >
                      {!onAction && <Check size={13} color={c.text} />}
                      <Body size={12} weight="medium" color={c.text}>
                        {action}
                      </Body>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Modal visible={!!switchTo} transparent animationType="fade" onRequestClose={() => setSwitchTo(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal} accessibilityViewIsModal testID="switch-confirm">
            <Serif size={21}>Switch day without saving?</Serif>
            <Body size={13.5} style={{ marginTop: 6, marginBottom: 16 }}>
              {`What you picked for ${t.isToday ? "today" : shortDate(t.date)} has not been saved yet.`}
            </Body>
            <Pressable
              onPress={() => {
                t.save();
                const key = switchTo;
                setSwitchTo(null);
                setTip(null);
                t.setDate(key);
              }}
              accessibilityRole="button"
              style={[styles.modalBtn, { backgroundColor: OLIVE }]}
            >
              <Text style={{ fontFamily: F.serif, fontSize: 16, color: T.canvas }}>Save, then switch</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const key = switchTo;
                setSwitchTo(null);
                setTip(null);
                t.setDate(key);
              }}
              accessibilityRole="button"
              style={[styles.modalBtn, { borderWidth: 1, borderColor: T.hair, marginTop: 8 }]}
            >
              <Text style={{ fontFamily: F.serif, fontSize: 16, color: T.ink }}>Discard and switch</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={leaving} transparent animationType="fade" onRequestClose={() => setLeaving(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal} accessibilityViewIsModal testID="leave-confirm">
            <Serif size={21}>Leave without saving?</Serif>
            <Body size={13.5} style={{ marginTop: 6, marginBottom: 16 }}>
              The entries from this session have not been saved yet.
            </Body>
            <Pressable onPress={() => setLeaving(false)} accessibilityRole="button" style={[styles.modalBtn, { backgroundColor: OLIVE }]}>
              <Text style={{ fontFamily: F.serif, fontSize: 16, color: T.canvas }}>Keep editing</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                t.discard();
                setLeaving(false);
                leave();
              }}
              accessibilityRole="button"
              style={[styles.modalBtn, { borderWidth: 1, borderColor: T.hair, marginTop: 8 }]}
            >
              <Text style={{ fontFamily: F.serif, fontSize: 16, color: T.ink }}>Discard and leave</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  bubbleOff: { backgroundColor: "rgba(242,239,230,0.13)", borderColor: "rgba(242,226,166,0.35)" },
  bubbleOn: {
    backgroundColor: "rgba(242,239,230,0.24)",
    borderColor: GLOW,
    borderWidth: 2.5,
    shadowColor: GLOW,
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  badge: { position: "absolute", top: 4, right: 6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: GLOW, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  popup: { position: "absolute", top: 8, bottom: 8, left: 8, right: 8, borderRadius: 34, overflow: "hidden", borderWidth: 1, borderColor: "rgba(242,239,230,0.5)" },
  notice: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, padding: 14, backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 1, borderColor: "rgba(242,226,166,0.3)" },
  discard: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: "rgba(242,239,230,0.5)" },
  tip: { marginTop: 16, padding: 20, backgroundColor: T.canvas },
  signal: { flexDirection: "row", gap: 14, borderWidth: 1, padding: 16, backgroundColor: "rgba(0,0,0,0.25)" },
  signalIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  signalBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderWidth: 1, marginTop: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12, backgroundColor: "rgba(10,18,12,0.6)" },
  saveBtn: { minHeight: 54, backgroundColor: "rgba(242,239,230,0.92)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  saved: { backgroundColor: GLOW },
  day: { width: 56, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: 28, borderWidth: 1, borderColor: "rgba(242,226,166,0.35)", backgroundColor: "rgba(242,239,230,0.1)" },
  dayOn: { backgroundColor: GLOW, borderColor: GLOW },
  dayName: { fontFamily: F.sansMed, fontSize: 10.5, color: T.canvas },
  dayNum: { fontFamily: F.serif, fontSize: 17, color: T.canvas },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(10,18,12,0.6)", justifyContent: "center", padding: 24 },
  modal: { padding: 22, backgroundColor: T.canvas },
  modalBtn: { minHeight: 50, alignItems: "center", justifyContent: "center" },
});
