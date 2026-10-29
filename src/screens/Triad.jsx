import React, { useState } from "react";
import {
  ChevronDown, Check, Heart, LifeBuoy, EyeOff, Salad, Sparkles,
  Droplet, Droplets, CloudDrizzle, CloudRain, Blend, Waves, Zap, PersonStanding, HeartCrack, Anchor, Hammer,
  Battery, Weight, Bone, AlarmClock, BatteryLow, Footprints, Activity, CircleDot, Hourglass, Wind, Frown, Flame,
  Thermometer, MoonStar, Snowflake, Brain, Target, CloudFog, Puzzle, Shuffle, Smile, Angry, TriangleAlert, Meh,
  TrendingUp, Pause, Minus, Users, User, UserMinus, Repeat, Scan, Candy, Soup, Sandwich, Beef, UtensilsCrossed,
  Equal, Utensils, Ban, Coffee, CupSoda, GlassWater,
} from "lucide-react";
import { T, tone } from "../theme/tokens.js";
import { triadTip, isHighSymptom } from "../engine/index.js";
import { Eyebrow, Button, Tile, SectionLabel } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   3. THE TRIAD TRACKER — Physical, Mental, Fuel on Aegean
   --------------------------------------------------------------- */

/** Each blob sits in its own margin of white, so `zoom` scales the pigment
 *  out to the edge of the circle — otherwise the orbs never visually touch. */
const ORB = {
  physical: { src: "/assets/icons/orb-body.jpg", zoom: 1.5 },
  mental: { src: "/assets/icons/orb-mind.jpg", zoom: 1.18 },
  fuel: { src: "/assets/icons/orb-fuel.jpg", zoom: 1.08 },
};

/** Multiply drops the paper white so overlaps deepen like real wash — but it
 *  only works over a light backdrop, so every use sits on an isolated cream
 *  plate rather than blending straight onto a dark screen. */
const OrbImg = ({ pillar, size, children }) => (
  <span className="relative inline-block overflow-hidden align-top" style={{ width: size, height: size, borderRadius: 999 }}>
    <img
      src={ORB[pillar].src}
      alt=""
      aria-hidden="true"
      style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${ORB[pillar].zoom})`, mixBlendMode: "multiply" }}
    />
    {children}
  </span>
);

const Orb = ({ pillar, size }) => (
  <span className="inline-block" style={{ borderRadius: 999, background: T.canvasWarm, isolation: "isolate", lineHeight: 0 }}>
    <OrbImg pillar={pillar} size={size} />
  </span>
);

/** Three pillars. `single` groups are genuine scales — the states are
 *  mutually exclusive, so picking one replaces the last. `id` marks the
 *  options the engine reads; the rest are context for the user. */
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
          {
            k: "Waking up wired",
            short: "Wired",
            icon: AlarmClock,
            note: "Insomnia that runs hot. A cortisol signature, not a willpower problem.",
          },
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
          {
            k: "The Hermit",
            short: "Hermit",
            icon: UserMinus,
            id: "hermit",
            note: "Inward energy. Late-luteal withdrawal is a phase, not a personality flaw.",
          },
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

/** The engine-readable ids in a log of display labels. */
export const signalIds = (log) =>
  Object.values(log)
    .flat()
    .map((k) => ID_BY_LABEL[k])
    .filter(Boolean);

/** Watercolor orbs overlapped into the triad mark on one cream plate. */
const TriadVenn = () => (
  <div
    className="mx-auto rounded-[24px] flex items-center justify-center"
    style={{ width: 248, height: 200, background: T.canvasWarm, border: `1px solid ${T.hair}`, isolation: "isolate" }}
    aria-hidden="true"
  >
    <div className="relative" style={{ width: 176, height: 168 }}>
      {[
        { pillar: "physical", label: "Body", left: 40, top: 0 },
        { pillar: "mental", label: "Mind", left: 0, top: 70 },
        { pillar: "fuel", label: "Fuel", left: 80, top: 70 },
      ].map(({ pillar, label, left, top }) => (
        <span key={label} className="absolute" style={{ left, top }}>
          <OrbImg pillar={pillar} size={96}>
            <span
              className="sel-sans absolute inset-0 flex items-center justify-center text-[11px] font-semibold"
              style={{ color: T.ink, letterSpacing: "0.04em" }}
            >
              {label}
            </span>
          </OrbImg>
        </span>
      ))}
    </div>
  </div>
);

/** What the log reads back. Each signal is a consequence the user opted
 *  into by logging honestly — offered, never auto-applied. */
const readSignals = (ids, ctx, fuel, setFuel) => {
  const has = (k) => ids.includes(k);
  const out = [];

  if (isHighSymptom(ids))
    out.push({
      key: "deload",
      icon: LifeBuoy,
      title: "Today asks for less.",
      body: "Your load is high enough that pushing costs more than it returns. Resting today earns the same check as a lift.",
    });

  if (has("hermit"))
    out.push({
      key: "hermit",
      icon: Users,
      title: "Your social battery is flat.",
      body: "Late-luteal withdrawal is chemistry, not a character flaw. Protect the quiet.",
    });

  if (has("body-image"))
    out.push({
      key: "hide",
      icon: EyeOff,
      title: "The mirror is unreliable today.",
      body: "Distortion peaks with hormonal shifts. You can put the numbers away and let the data keep working underneath.",
      action: fuel.hideNumbers ? "Numbers are hidden" : "Hide numbers for now",
      onAction: fuel.hideNumbers ? null : () => setFuel({ hideNumbers: true }),
    });

  if (has("bottomless") && ctx.buffer)
    out.push({
      key: "buffer",
      icon: Salad,
      title: "Your burn is genuinely higher.",
      body: "The luteal phase costs more energy. Eating to that is the plan working.",
      action: fuel.bufferAccepted ? "Buffer on" : "Use the Luteal Buffer",
      onAction: fuel.bufferAccepted ? null : () => setFuel({ bufferAccepted: true }),
    });

  return out;
};

const PillarSection = ({ pillar, log, open, onToggleOpen, onPick }) => {
  const c = tone(true);
  const selectedCount = pillar.groups.reduce((n, g) => n + (log[g.key] || []).length, 0);
  const panelId = `pillar-${pillar.key}`;

  return (
    <div className="rounded-[22px] mb-3 overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.hair}` }}>
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full px-4 py-3.5 flex items-center gap-3.5 text-left sel-press"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="flex-shrink-0">
          <Orb pillar={pillar.key} size={44} />
        </span>
        <span className="flex-1">
          <span className="sel-serif block" style={{ fontSize: 17, color: c.text }}>
            {pillar.title}
          </span>
          <span className="sel-sans block text-[11.5px] mt-0.5" style={{ color: c.textSoft }}>
            {pillar.caption}
          </span>
        </span>
        {selectedCount > 0 && (
          <span
            className="sel-sans rounded-full px-2 py-[3px] text-[11px] font-semibold flex-shrink-0"
            style={{ background: pillar.accent, color: T.canvas }}
            aria-label={`${selectedCount} selected`}
          >
            {selectedCount}
          </span>
        )}
        <ChevronDown
          size={17}
          color={c.textSoft}
          strokeWidth={1.7}
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        />
      </button>

      {open && (
        <div id={panelId} className="px-4 pb-5 sel-rise">
          <p className="sel-sans text-[12px] mb-5" style={{ color: c.textSoft, lineHeight: 1.5 }}>
            {pillar.purpose}
          </p>

          {pillar.groups.map((g) => {
            const picked = log[g.key] || [];
            const notes = g.options.filter((o) => o.note && picked.includes(o.k));
            return (
              <div key={g.key} className="mb-5" role="group" aria-label={g.label}>
                <div className="flex items-center gap-2 mb-2.5">
                  <g.icon size={15} color={c.text} strokeWidth={1.6} aria-hidden="true" />
                  <span className="sel-eyebrow sel-sans" style={{ color: c.textSoft }}>
                    {g.label}
                  </span>
                  {g.single && (
                    <span className="sel-sans text-[10.5px]" style={{ color: c.textFaint }}>
                      pick one
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {g.options.map((o) => (
                    <Tile
                      key={o.k}
                      icon={o.icon}
                      label={o.short || o.k}
                      full={o.k}
                      dark
                      filled
                      accent={pillar.accent}
                      selected={picked.includes(o.k)}
                      onClick={() => onPick(g, o.k)}
                    />
                  ))}
                </div>
                {notes.map((o) => (
                  <p
                    key={o.k}
                    className="sel-sans text-[11.5px] mt-2.5 pl-3"
                    style={{ color: c.textSoft, lineHeight: 1.5, borderLeft: `2px solid ${pillar.accent}` }}
                  >
                    {o.note}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Triad = ({ ctx, log, setLog, fuel, setFuel }) => {
  const [open, setOpen] = useState("physical");
  const [tip, setTip] = useState(null);
  const c = tone(true);

  const pick = (group, key) => {
    const cur = log[group.key] || [];
    const nextForGroup = group.single
      ? cur.includes(key) ? [] : [key]
      : cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key];
    setLog({ ...log, [group.key]: nextForGroup });
    setTip(null);
  };

  const ids = signalIds(log);
  const save = () => setTip(triadTip({ signals: ids, phase: ctx.phase }));
  const signals = readSignals(ids, ctx, fuel, setFuel);
  const total = Object.values(log).reduce((n, v) => n + v.length, 0);

  return (
    <div className="sel-rise">
      <div className="flex items-center justify-between mb-7">
        <Eyebrow dark>Triad Tracker</Eyebrow>
        <button type="button" onClick={save} className="sel-sans text-[13px] font-medium sel-press px-2" style={{ color: c.text }}>
          Save
        </button>
      </div>

      <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: c.text }}>
        How's your
        <br />
        reality today?
      </h1>
      <p className="sel-sans text-[13.5px] mb-7" style={{ color: c.textSoft, lineHeight: 1.55, maxWidth: 265 }}>
        Log what's true. The plan adapts around it. Nothing here is scored.
      </p>

      <div className="mb-7">
        <TriadVenn />
      </div>

      {PILLARS.map((p) => (
        <PillarSection
          key={p.key}
          pillar={p}
          log={log}
          open={open === p.key}
          onToggleOpen={() => setOpen(open === p.key ? null : p.key)}
          onPick={pick}
        />
      ))}

      {signals.length > 0 && (
        <div className="mt-7">
          <SectionLabel dark>What this means today</SectionLabel>
          <div className="flex flex-col gap-3">
            {signals.map(({ key, icon: Icon, title, body, action, onAction }) => (
              <div key={key} className="rounded-[18px] px-5 py-4" style={{ background: "rgba(0,0,0,0.18)", border: `1px solid ${c.hair}` }}>
                <div className="flex items-start gap-3.5">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: c.surfaceDeep }}>
                    <Icon size={15} color={T.canvas} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <p className="sel-sans text-[13px] font-semibold mb-1" style={{ color: c.text }}>
                      {title}
                    </p>
                    <p className="sel-sans text-[12px]" style={{ color: c.textSoft, lineHeight: 1.5 }}>
                      {body}
                    </p>
                    {action && (
                      <button
                        type="button"
                        onClick={() => onAction && onAction()}
                        disabled={!onAction}
                        className="sel-sans rounded-full px-4 text-[12px] font-medium mt-3 sel-press flex items-center gap-1.5"
                        style={{ background: onAction ? c.surfaceDeep : "transparent", border: `1px solid ${c.hair}`, color: c.text }}
                      >
                        {!onAction && <Check size={13} aria-hidden="true" />}
                        {action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tip && (
        <div role="status" aria-label="Tip" className="mt-7 rounded-[20px] px-5 py-5 sel-rise" style={{ background: T.canvas }}>
          <p className="sel-eyebrow sel-sans mb-2">Saved · one nudge</p>
          <p className="sel-serif mb-1.5" style={{ fontSize: 18, color: T.ink, lineHeight: 1.3 }}>
            {tip.title}
          </p>
          <p className="sel-sans text-[13px]" style={{ color: T.inkSoft, lineHeight: 1.55 }}>
            {tip.body}
          </p>
        </div>
      )}

      <div className="mt-7">
        <Button onClick={save}>Save entry</Button>
        <p className="sel-sans text-[12px] text-center mt-3" style={{ color: c.textFaint }}>
          {total === 0 ? "Nothing logged yet. Even that is data." : `${total} signal${total === 1 ? "" : "s"} logged today.`}
        </p>
      </div>
    </div>
  );
};
