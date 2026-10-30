import React, { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import {
  ChevronDown, Check, LifeBuoy, EyeOff, Salad, Users,
  Droplet, Droplets, CloudDrizzle, CloudRain, Blend, Waves, Zap, PersonStanding, HeartCrack, Anchor, Hammer,
  Battery, Weight, Bone, AlarmClock, BatteryLow, Footprints, Activity, CircleDot, Hourglass, Wind, Frown, Flame,
  Thermometer, Sparkles, MoonStar, Snowflake, Brain, Target, CloudFog, Puzzle, Shuffle, Smile, Angry, TriangleAlert,
  Meh, Heart, TrendingUp, Pause, Minus, User, UserMinus, Repeat, Scan, Candy, Soup, Sandwich, Beef, UtensilsCrossed,
  Equal, Utensils, Ban, Coffee, CupSoda, GlassWater,
} from "lucide-react-native";
import { triadTip, isHighSymptom } from "../shared";
import { useApp } from "../state/AppState";
import { T, F, tone, IMG } from "../ui/theme";
import { Screen, Eyebrow, Button, Tile, Serif, Body, SectionLabel, s } from "../ui/kit";

/* ---------------------------------------------------------------
   3. THE TRIAD TRACKER — Physical, Mental, Fuel on Aegean
   --------------------------------------------------------------- */

const ORB = { physical: IMG.orbBody, mental: IMG.orbMind, fuel: IMG.orbFuel };

/** Three pillars. `single` groups are genuine scales — picking one replaces
 *  the last. `id` marks the options the engine reads. */
export const PILLARS = [
  {
    key: "physical",
    title: "Physical",
    caption: "Flow, cramps, bloating, fatigue",
    purpose: "Inflammation, fluid shifts and systemic stress. This is what calls a deload or the Bailout.",
    accent: T.terracotta,
    groups: [
      {
        key: "flow",
        label: "Flow",
        icon: Droplet,
        options: [
          { k: "Spotting", icon: Droplet },
          { k: "Light", icon: Droplets },
          { k: "Medium", icon: CloudDrizzle },
          { k: "Heavy", icon: CloudRain, id: "flow-heavy" },
          { k: "Clots", icon: Blend, id: "clots" },
        ],
      },
      {
        key: "pain",
        label: "Cramps & pain",
        icon: Waves,
        options: [
          { k: "Uterine cramps", short: "Cramps", icon: Zap, id: "cramps" },
          { k: "Lower back ache", short: "Back ache", icon: PersonStanding },
          { k: "Breast tenderness", short: "Breast", icon: HeartCrack },
          { k: "Pelvic heaviness", short: "Pelvic", icon: Anchor },
          { k: "Hormonal headache", short: "Headache", icon: Hammer },
        ],
      },
      {
        key: "digestion",
        label: "Bloating & digestion",
        icon: Activity,
        options: [
          { k: "Bloating / water retention", short: "Bloating", icon: CircleDot, id: "bloating" },
          { k: "Constipation", short: "Constipated", icon: Hourglass },
          { k: "Diarrhea", short: "Diarrhea", icon: Wind },
          { k: "Nausea", short: "Nausea", icon: Frown },
          { k: "IBS flare-up", short: "IBS flare", icon: Flame },
        ],
      },
      {
        key: "fatigue",
        label: "Fatigue",
        icon: Battery,
        options: [
          { k: "Heavy limbs", short: "Heavy limbs", icon: Weight, id: "fatigue" },
          { k: "Joint stiffness", short: "Joints", icon: Bone },
          { k: "Waking up wired", short: "Wired", icon: AlarmClock, note: "Insomnia that runs hot. A cortisol signature, not a willpower problem." },
          { k: "Bone-deep exhaustion", short: "Exhausted", icon: BatteryLow, id: "exhaustion" },
          { k: "Restless legs", short: "Restless", icon: Footprints },
        ],
      },
      {
        key: "skin",
        label: "Skin & temperature",
        icon: Thermometer,
        options: [
          { k: "Hormonal breakouts", short: "Breakouts", icon: Sparkles },
          { k: "Night sweats", short: "Night sweats", icon: MoonStar },
          { k: "Hot flashes", short: "Hot flashes", icon: Thermometer, note: "Tracked closely on the 40+ track." },
          { k: "Freezing cold", short: "Freezing", icon: Snowflake, note: "Often low metabolic output. Worth fuelling, not pushing through." },
        ],
      },
    ],
  },
  {
    key: "mental",
    title: "Mental",
    caption: "Brain fog, anxiety, social battery",
    purpose: "Serotonin and dopamine shifts. Catches late-luteal withdrawal before it feels personal.",
    accent: T.mental,
    groups: [
      {
        key: "cognition",
        label: "Focus",
        icon: Brain,
        options: [
          { k: "Sharp / high focus", short: "Sharp", icon: Target },
          { k: "Brain fog", short: "Brain fog", icon: CloudFog, id: "brain-fog" },
          { k: "Forgetfulness", short: "Forgetful", icon: Puzzle },
          { k: "Scatterbrained", short: "Scattered", icon: Shuffle },
        ],
      },
      {
        key: "emotion",
        label: "Mood",
        icon: Heart,
        options: [
          { k: "Calm / grounded", short: "Calm", icon: Smile },
          { k: "Irritable / snappy", short: "Irritable", icon: Angry },
          { k: "Anxious / overwhelmed", short: "Anxious", icon: TriangleAlert, id: "anxiety" },
          { k: "Low mood", short: "Low mood", icon: CloudDrizzle },
          { k: "Highly sensitive / tearful", short: "Tearful", icon: Frown },
          { k: "Apathetic", short: "Apathetic", icon: Meh },
        ],
      },
      {
        key: "social",
        label: "Social battery",
        icon: Users,
        single: true,
        options: [
          { k: "Social butterfly", short: "Butterfly", icon: Users, note: "Outward energy, high desire to connect." },
          { k: "Socially neutral", short: "Neutral", icon: User, note: "Baseline." },
          { k: "The Hermit", short: "Hermit", icon: UserMinus, id: "hermit", note: "Inward energy. Late-luteal withdrawal is a phase, not a personality flaw." },
        ],
      },
      {
        key: "drive",
        label: "Drive",
        icon: Zap,
        options: [
          { k: "Ambitious / ready to push", short: "Ambitious", icon: TrendingUp },
          { k: "Zero motivation", short: "Zero drive", icon: Pause },
          { k: "Indifferent", short: "Indifferent", icon: Minus },
        ],
      },
      {
        key: "intrusive",
        label: "Intrusive thoughts",
        icon: CloudFog,
        options: [
          { k: "Rumination", short: "Rumination", icon: Repeat },
          { k: "Body-image distortion", short: "Body image", icon: Scan, id: "body-image" },
        ],
      },
    ],
  },
  {
    key: "fuel",
    title: "Fuel",
    caption: "Cravings & appetite",
    purpose: "Metabolic shifts and blood sugar dips, read as signals, never as a lack of discipline.",
    accent: T.sage,
    groups: [
      {
        key: "cravings",
        label: "Cravings",
        icon: Candy,
        options: [
          { k: "Sweet / sugar", short: "Sugar", icon: Candy, id: "sugar" },
          { k: "Salty / savory", short: "Salt", icon: Soup, id: "salt" },
          { k: "Heavy carbs / comfort", short: "Heavy carbs", icon: Sandwich, id: "heavy-carb" },
          { k: "High fat / rich", short: "Rich / fat", icon: Beef },
        ],
      },
      {
        key: "appetite",
        label: "Appetite",
        icon: UtensilsCrossed,
        single: true,
        options: [
          { k: "Normal baseline", short: "Baseline", icon: Equal },
          { k: "Bottomless pit", short: "Bottomless", icon: Utensils, id: "bottomless", note: "Your luteal burn is real. The Buffer exists for exactly this." },
          { k: "Loss of appetite / queasy", short: "No appetite", icon: Ban },
        ],
      },
      {
        key: "stimulant",
        label: "Caffeine & water",
        icon: Coffee,
        options: [
          { k: "Craving extra caffeine", short: "Caffeine", icon: CupSoda, note: "Usually masking fatigue rather than fixing it." },
          { k: "Thirsty / dehydrated", short: "Thirsty", icon: GlassWater, note: "Often an electrolyte signal." },
        ],
      },
    ],
  },
];

const ID_BY_LABEL = Object.fromEntries(
  PILLARS.flatMap((p) => p.groups.flatMap((g) => g.options.filter((o) => o.id).map((o) => [o.k, o.id])))
);

export const signalIds = (log) =>
  Object.values(log)
    .flat()
    .map((k) => ID_BY_LABEL[k])
    .filter(Boolean);

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

const Orb = ({ pillar, size }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: T.canvasWarm }}>
    <Image source={ORB[pillar]} style={{ width: size, height: size, transform: [{ scale: 1.3 }] }} />
  </View>
);

const PillarSection = ({ pillar, log, open, onToggle, onPick }) => {
  const c = tone(true);
  const count = pillar.groups.reduce((n, g) => n + (log[g.key] || []).length, 0);
  return (
    <View style={[styles.pillar, { borderColor: c.hair, backgroundColor: c.surface }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${pillar.title}: ${pillar.caption}`}
        accessibilityState={{ expanded: open }}
        style={[s.row, { gap: 14, paddingHorizontal: 16, paddingVertical: 12, minHeight: 64 }]}
      >
        <Orb pillar={pillar.key} size={44} />
        <View style={{ flex: 1 }}>
          <Serif size={17} color={c.text}>
            {pillar.title}
          </Serif>
          <Body size={11.5} color={c.textSoft}>
            {pillar.caption}
          </Body>
        </View>
        {count > 0 && (
          <View style={[styles.badge, { backgroundColor: pillar.accent }]}>
            <Text style={{ fontFamily: F.sansSemi, fontSize: 11, color: T.canvas }}>{count}</Text>
          </View>
        )}
        <ChevronDown size={17} color={c.textSoft} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
      </Pressable>

      {open && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
          <Body size={12} color={c.textSoft} style={{ marginBottom: 16 }}>
            {pillar.purpose}
          </Body>
          {pillar.groups.map((g) => {
            const picked = log[g.key] || [];
            const notes = g.options.filter((o) => o.note && picked.includes(o.k));
            return (
              <View key={g.key} style={{ marginBottom: 18 }} accessibilityLabel={g.label}>
                <View style={[s.row, { gap: 8, marginBottom: 10 }]}>
                  <g.icon size={15} color={c.text} strokeWidth={1.6} />
                  <Text style={[s.eyebrow, { color: c.textSoft }]}>{g.label}</Text>
                  {g.single && <Body size={10.5} color={c.textFaint}>pick one</Body>}
                </View>
                <View style={{ gap: 10 }}>
                  {chunk(g.options, 3).map((row, i) => (
                    <View key={i} style={[s.row, { gap: 10, alignItems: "stretch" }]}>
                      {row.map((o) => (
                        <Tile
                          key={o.k}
                          icon={o.icon}
                          label={o.short || o.k}
                          full={o.k}
                          dark
                          filled
                          accent={pillar.accent}
                          selected={picked.includes(o.k)}
                          onPress={() => onPick(g, o.k)}
                        />
                      ))}
                      {Array.from({ length: 3 - row.length }).map((_, j) => (
                        <View key={`pad${j}`} style={{ flex: 1 }} />
                      ))}
                    </View>
                  ))}
                </View>
                {notes.map((o) => (
                  <Body key={o.k} size={11.5} color={c.textSoft} style={[styles.note, { borderLeftColor: pillar.accent }]}>
                    {o.note}
                  </Body>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

/** What the log reads back — offered, never auto-applied. */
const readSignals = (ids, app) => {
  const has = (k) => ids.includes(k);
  const out = [];
  if (isHighSymptom(ids))
    out.push({ key: "deload", icon: LifeBuoy, title: "Today asks for less.", body: "Your load is high enough that pushing costs more than it returns. Resting today earns the same check as a lift." });
  if (has("hermit"))
    out.push({ key: "hermit", icon: Users, title: "Your social battery is flat.", body: "Late-luteal withdrawal is chemistry, not a character flaw. Protect the quiet." });
  if (has("body-image"))
    out.push({
      key: "hide",
      icon: EyeOff,
      title: "The mirror is unreliable today.",
      body: "Distortion peaks with hormonal shifts. You can put the numbers away and let the data keep working underneath.",
      action: app.hideNumbers ? "Numbers are hidden" : "Hide numbers for now",
      onAction: app.hideNumbers ? null : () => app.setHideNumbers(true),
    });
  if (has("bottomless") && app.ctx.buffer)
    out.push({
      key: "buffer",
      icon: Salad,
      title: "Your burn is genuinely higher.",
      body: "The luteal phase costs more energy. Eating to that is the plan working.",
      action: app.today.bufferAccepted ? "Buffer on" : "Use the Luteal Buffer",
      onAction: app.today.bufferAccepted ? null : () => app.setToday({ bufferAccepted: true }),
    });
  return out;
};

export function Triad() {
  const app = useApp();
  const { ctx, today, setToday } = app;
  const [open, setOpen] = useState("physical");
  const [tip, setTip] = useState(null);
  const c = tone(true);
  const log = today.triad;

  const pick = (group, key) => {
    const cur = log[group.key] || [];
    const next = group.single
      ? cur.includes(key) ? [] : [key]
      : cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key];
    setToday({ triad: { ...log, [group.key]: next } });
    setTip(null);
  };

  const ids = signalIds(log);
  const save = () => setTip(triadTip({ signals: ids, phase: ctx.phase }));
  const signals = readSignals(ids, app);
  const total = Object.values(log).reduce((n, v) => n + v.length, 0);

  return (
    <Screen bg="aegean">
      <View style={[s.row, { justifyContent: "space-between", marginBottom: 22 }]}>
        <Eyebrow dark>Triad Tracker</Eyebrow>
        <Pressable onPress={save} accessibilityRole="button" accessibilityLabel="Save" style={{ minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "flex-end" }}>
          <Body size={13} weight="medium" color={c.text}>
            Save
          </Body>
        </Pressable>
      </View>

      <Serif size={28} color={c.text} accessibilityRole="header">
        {"How's your\nreality today?"}
      </Serif>
      <Body color={c.textSoft} style={{ marginTop: 10, marginBottom: 24, maxWidth: 280 }}>
        Log what's true. The plan adapts around it. Nothing here is scored.
      </Body>

      {PILLARS.map((p) => (
        <PillarSection key={p.key} pillar={p} log={log} open={open === p.key} onToggle={() => setOpen(open === p.key ? null : p.key)} onPick={pick} />
      ))}

      {signals.length > 0 && (
        <View style={{ marginTop: 20 }}>
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

      {tip && (
        <View style={styles.tip} accessibilityLiveRegion="polite" accessibilityLabel="Tip" testID="tip">
          <SectionLabel>Saved · one nudge</SectionLabel>
          <Serif size={18}>{tip.title}</Serif>
          <Body size={13} style={{ marginTop: 6 }}>
            {tip.body}
          </Body>
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <Button label="Save entry" onPress={save} />
        <Body size={12} color={c.textFaint} style={{ textAlign: "center", marginTop: 10 }}>
          {total === 0 ? "Nothing logged yet. Even that is data." : `${total} signal${total === 1 ? "" : "s"} logged today.`}
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillar: { borderRadius: 22, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  note: { marginTop: 10, paddingLeft: 12, borderLeftWidth: 2 },
  signal: { flexDirection: "row", gap: 14, borderRadius: 18, borderWidth: 1, padding: 16, backgroundColor: "rgba(0,0,0,0.18)" },
  signalIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  signalBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, marginTop: 10 },
  tip: { marginTop: 24, borderRadius: 20, padding: 20, backgroundColor: T.canvas },
});
