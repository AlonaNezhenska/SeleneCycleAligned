import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  ChevronLeft,
  ChevronDown,
  Calendar,
  Camera,
  Check,
  Eye,
  EyeOff,
  Heart,
  Home as HomeIcon,
  ClipboardList,
  Moon,
  Activity,
  UtensilsCrossed,
  Droplet,
  Waves,
  Sun,
  CloudFog,
  Brain,
  Candy,
  Salad,
  Timer,
  LifeBuoy,
} from "lucide-react";

/* ---------------------------------------------------------------
   GLOBAL DESIGN SYSTEM — "Selena"
   A calming, high-end digital journal. Organic, never clinical.
   --------------------------------------------------------------- */

const T = {
  // Backgrounds — raw canvas
  canvas: "#F7F4EE",
  canvasWarm: "#F4EFE6",
  canvasDeep: "#EAE3D4",
  // Primary accents
  aegean: "#1C2833", // privacy / rest / introspection
  terracotta: "#C86446", // high energy
  // Flow & success
  sage: "#3D4A3E",
  olive: "#556B2F",
  // Ink
  ink: "#241F1A",
  inkSoft: "rgba(36,31,26,0.58)",
  inkFaint: "rgba(36,31,26,0.34)",
  hair: "rgba(36,31,26,0.13)",
};

const IMG = "/selena-illustration.svg";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

    .sel-serif { font-family: 'Playfair Display', Georgia, serif; }
    .sel-sans  { font-family: 'Inter', system-ui, sans-serif; }

    /* Raw canvas grain — subtle paper tooth, never flat */
    .sel-canvas {
      background-color: ${T.canvas};
      background-image:
        radial-gradient(circle at 18% 12%, rgba(200,100,70,0.045), transparent 42%),
        radial-gradient(circle at 82% 88%, rgba(28,40,51,0.04), transparent 45%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E");
    }

    .sel-eyebrow {
      font-size: 10px; letter-spacing: 0.19em; text-transform: uppercase;
      font-weight: 600; color: ${T.inkSoft};
    }

    .sel-press { transition: transform .14s ease, background .18s ease, border-color .18s ease; }
    .sel-press:active { transform: scale(.985); }

    .sel-scroll::-webkit-scrollbar { width: 0; }
    .sel-scroll { scrollbar-width: none; }

    @keyframes sel-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    .sel-rise { animation: sel-rise .45s cubic-bezier(.22,.8,.3,1) both; }

    @media (prefers-reduced-motion: reduce) {
      .sel-rise { animation: none; }
      .sel-press { transition: none; }
    }

    :focus-visible { outline: 2px solid ${T.sage}; outline-offset: 3px; }
  `}</style>
);

/* ---------------------------------------------------------------
   SHARED PRIMITIVES
   --------------------------------------------------------------- */

const Eyebrow = ({ step, children }) => (
  <div className="flex items-center gap-2">
    {step != null && (
      <span
        className="w-[19px] h-[19px] rounded-full flex items-center justify-center sel-sans"
        style={{ background: T.ink, color: T.canvas, fontSize: 10, fontWeight: 600 }}
      >
        {step}
      </span>
    )}
    <span className="sel-eyebrow sel-sans">{children}</span>
  </div>
);

const IconBtn = ({ children, onClick, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="w-9 h-9 rounded-full flex items-center justify-center sel-press"
    style={{ border: `1px solid ${T.hair}` }}
  >
    {children}
  </button>
);

const Button = ({ children, onClick, tone = "primary", full = true, size = "lg" }) => {
  const tones = {
    primary: { background: T.sage, color: T.canvas, border: `1.5px solid ${T.sage}` },
    dark: { background: T.aegean, color: T.canvas, border: `1.5px solid ${T.aegean}` },
    outline: { background: "transparent", color: T.ink, border: `1.5px solid ${T.ink}` },
    quiet: { background: "transparent", color: T.inkSoft, border: "1.5px solid transparent" },
  };
  const sizes = { lg: "py-[15px] px-7 text-[15px]", sm: "py-[9px] px-4 text-[12px]" };
  return (
    <button
      onClick={onClick}
      className={`sel-sans font-medium rounded-full sel-press ${sizes[size]} ${full ? "w-full" : ""}`}
      style={tones[tone]}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", style = {}, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-[20px] ${className}`}
    style={{ background: "#FFFDF8", border: `1px solid ${T.hair}`, ...style }}
  >
    {children}
  </div>
);

/** Selection tile — the workhorse. Filled = chosen, never "correct". */
const Tile = ({ icon: Icon, label, selected, onClick, filled = false }) => (
  <button
    onClick={onClick}
    className="rounded-[16px] py-[18px] px-2 flex flex-col items-center gap-2 sel-press"
    style={{
      background: selected ? (filled ? T.sage : "rgba(61,74,62,0.07)") : "#FFFDF8",
      border: `1.5px solid ${selected ? T.sage : T.hair}`,
      color: selected && filled ? T.canvas : T.ink,
    }}
  >
    <Icon size={22} strokeWidth={1.5} color={selected && filled ? T.canvas : T.ink} />
    <span className="sel-sans text-[11.5px]" style={{ fontWeight: selected ? 600 : 400 }}>
      {label}
    </span>
  </button>
);

/** Aesthetic toggle — a hand-drawn feeling switch, not a system control. */
const Switch = ({ value, onChange, leftLabel, rightLabel }) => (
  <div
    className="flex rounded-full p-[3px] sel-sans"
    style={{ background: T.canvasDeep }}
    role="group"
  >
    {[
      { l: leftLabel, v: false },
      { l: rightLabel, v: true },
    ].map(({ l, v }) => (
      <button
        key={l}
        onClick={() => onChange(v)}
        className="flex-1 rounded-full py-[9px] text-[12px] font-medium sel-press"
        style={{
          background: value === v ? T.aegean : "transparent",
          color: value === v ? T.canvas : T.inkSoft,
        }}
      >
        {l}
      </button>
    ))}
  </div>
);

const ToggleRow = ({ label, sublabel, ...rest }) => (
  <Card className="px-5 py-4 mb-3">
    <p className="sel-sans text-[14px] font-medium mb-0.5" style={{ color: T.ink }}>
      {label}
    </p>
    {sublabel && (
      <p className="sel-sans text-[12px] mb-3" style={{ color: T.inkSoft }}>
        {sublabel}
      </p>
    )}
    <Switch {...rest} />
  </Card>
);

const Dots = ({ total, active }) => (
  <div className="flex justify-center gap-[7px]">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className="h-[5px] rounded-full transition-all duration-300"
        style={{ width: i === active ? 18 : 5, background: i === active ? T.ink : "rgba(36,31,26,0.2)" }}
      />
    ))}
  </div>
);

/** Illustration frame — all raster art routes through here. */
const Plate = ({ height = 200, radius = 20, className = "" }) => (
  <div
    className={`overflow-hidden ${className}`}
    style={{ height, borderRadius: radius, background: T.canvasDeep, border: `1px solid ${T.hair}` }}
  >
    <img
      src={IMG}
      alt="Selena illustration"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="sel-eyebrow sel-sans mb-2.5">{children}</p>
);

/* ---------------------------------------------------------------
   1. ONBOARDING FLOW — Screens 1.1 – 1.4
   --------------------------------------------------------------- */

const HURDLES = [
  { key: "Cramps", icon: Waves },
  { key: "Brain fog", icon: CloudFog },
  { key: "Cravings", icon: Candy },
];

const NUTRITION_PHILOSOPHIES = [
  { key: "Exact macros", sub: "Track every macro with precision" },
  { key: "Protein & Calories only", sub: "Keep it simple and high level" },
  { key: "Visual plates", sub: "Use portion-based visual guidance" },
];

/* ---- 1.1 The Vibe Check ---- */
const VibeCheck = ({ data, set, next }) => (
  <div className="flex flex-col h-full sel-rise">
    <div className="flex items-center justify-between mb-7">
      <div className="w-9" />
      <Eyebrow step={1}>Onboarding</Eyebrow>
      <div className="w-9" />
    </div>

    <Plate height={210} radius={24} className="mb-8" />

    <h1 className="sel-serif text-center mb-8" style={{ fontSize: 29, lineHeight: 1.22, color: T.ink }}>
      How do you want
      <br />
      to feel in 3 months?
    </h1>

    <div className="flex flex-col gap-3">
      {["Stronger", "Less exhausted", "In tune with my body"].map((v) => {
        const on = data.vibe === v;
        return (
          <button
            key={v}
            onClick={() => set({ vibe: v })}
            className="rounded-full py-[15px] px-6 flex items-center justify-between sel-press sel-sans text-[15px]"
            style={{
              background: on ? T.sage : "#FFFDF8",
              color: on ? T.canvas : T.ink,
              border: `1.5px solid ${on ? T.sage : T.hair}`,
              fontWeight: on ? 600 : 500,
            }}
          >
            <span>{v}</span>
            {on && <Check size={16} />}
          </button>
        );
      })}
    </div>

    <div className="mt-auto pt-8">
      <div className="mb-6">
        <Button onClick={next}>Next</Button>
      </div>
      <Dots total={4} active={0} />
    </div>
  </div>
);

/* ---- 1.2 Biological Baseline + Dr. Sims setup ---- */
const BiologicalBaseline = ({ data, set, next, back }) => {
  const toggleHurdle = (k) =>
    set({
      hurdles: data.hurdles.includes(k)
        ? data.hurdles.filter((h) => h !== k)
        : [...data.hurdles, k],
    });

  return (
    <div className="flex flex-col h-full sel-rise">
      <div className="flex items-center justify-between mb-7">
        <IconBtn onClick={back} label="Back">
          <ChevronLeft size={17} color={T.ink} />
        </IconBtn>
        <Eyebrow step={2}>Onboarding</Eyebrow>
        <div className="w-9" />
      </div>

      <h1 className="sel-serif mb-7" style={{ fontSize: 27, lineHeight: 1.22, color: T.ink }}>
        Let's get to know
        <br />
        your cycle.
      </h1>

      <label className="sel-sans text-[13px] font-medium mb-2 block" style={{ color: T.ink }}>
        When did your last period start?
      </label>
      <Card className="px-4 py-[13px] mb-5 flex items-center justify-between sel-press">
        <span className="sel-sans text-[15px]" style={{ color: T.ink }}>
          {data.lastPeriod}
        </span>
        <Calendar size={17} color={T.inkSoft} strokeWidth={1.6} />
      </Card>

      <label className="sel-sans text-[13px] font-medium mb-2 block" style={{ color: T.ink }}>
        How long does it usually last?
      </label>
      <Card className="px-4 py-[13px] mb-6 flex items-center justify-between sel-press">
        <span className="sel-sans text-[15px]" style={{ color: T.ink }}>
          {data.periodLength}
        </span>
        <ChevronDown size={17} color={T.inkSoft} strokeWidth={1.6} />
      </Card>

      <label className="sel-sans text-[13px] font-medium mb-1 block" style={{ color: T.ink }}>
        What is your hardest hurdle?
      </label>
      <p className="sel-sans text-[12px] mb-3" style={{ color: T.inkSoft }}>
        Choose as many as apply.
      </p>
      <div className="grid grid-cols-3 gap-2.5 mb-7">
        {HURDLES.map(({ key, icon }) => (
          <Tile
            key={key}
            icon={icon}
            label={key}
            selected={data.hurdles.includes(key)}
            onClick={() => toggleHurdle(key)}
          />
        ))}
      </div>

      <ToggleRow
        label="Which decade are you in?"
        sublabel="This sets your protein timing and recovery load."
        value={data.ageFork === "40+"}
        onChange={(v) => set({ ageFork: v ? "40+" : "20s/30s" })}
        leftLabel="20s / 30s"
        rightLabel="40+ (Perimenopause)"
      />

      <ToggleRow
        label="Hormonal birth control"
        sublabel="Are you currently taking oral contraceptives?"
        value={data.onOC}
        onChange={(v) => set({ onOC: v })}
        leftLabel="No"
        rightLabel="Yes"
      />

      <div className="mt-auto pt-6">
        <div className="flex gap-3 mb-6">
          <Button tone="outline" full={false} onClick={back}>
            Back
          </Button>
          <div className="flex-1">
            <Button onClick={next}>Next</Button>
          </div>
        </div>
        <Dots total={4} active={1} />
      </div>
    </div>
  );
};

/* ---- 1.3 Nutrition Philosophy ---- */
const NutritionPhilosophy = ({ data, set, next, back }) => (
  <div className="flex flex-col h-full sel-rise">
    <div className="flex items-center justify-between mb-7">
      <IconBtn onClick={back} label="Back">
        <ChevronLeft size={17} color={T.ink} />
      </IconBtn>
      <Eyebrow step={3}>Onboarding</Eyebrow>
      <div className="w-9" />
    </div>

    <h1 className="sel-serif mb-8" style={{ fontSize: 27, lineHeight: 1.22, color: T.ink }}>
      How do you prefer
      <br />
      to track nutrition?
    </h1>

    <div className="flex flex-col gap-3">
      {NUTRITION_PHILOSOPHIES.map(({ key, sub }) => {
        const on = data.nutritionPref === key;
        return (
          <button
            key={key}
            onClick={() => set({ nutritionPref: key })}
            className="rounded-[20px] px-5 py-[17px] flex items-center gap-4 text-left sel-press"
            style={{
              background: on ? "rgba(61,74,62,0.07)" : "#FFFDF8",
              border: `1.5px solid ${on ? T.sage : T.hair}`,
            }}
          >
            <div className="flex-1">
              <div className="sel-sans text-[15px] font-medium" style={{ color: T.ink }}>
                {key}
              </div>
              <div className="sel-sans text-[12.5px] mt-0.5" style={{ color: T.inkSoft }}>
                {sub}
              </div>
            </div>
            {on && (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: T.sage }}
              >
                <Check size={13} color={T.canvas} />
              </span>
            )}
          </button>
        );
      })}
    </div>

    <div className="mt-auto pt-8">
      <div className="flex gap-3 mb-6">
        <Button tone="outline" full={false} onClick={back}>
          Back
        </Button>
        <div className="flex-1">
          <Button onClick={next}>Next</Button>
        </div>
      </div>
      <Dots total={4} active={2} />
    </div>
  </div>
);

/* ---- 1.4 The Reality Check (Private Vault) ---- */
const RealityCheck = ({ next, back }) => (
  <div className="flex flex-col h-full text-center sel-rise">
    <div className="flex items-center justify-between mb-7">
      <IconBtn onClick={back} label="Back">
        <ChevronLeft size={17} color={T.ink} />
      </IconBtn>
      <Eyebrow step={4}>Onboarding</Eyebrow>
      <div className="w-9" />
    </div>

    <h1 className="sel-serif mb-3" style={{ fontSize: 27, lineHeight: 1.22, color: T.ink }}>
      This is your
      <br />
      Reality Check.
    </h1>
    <p className="sel-sans text-[13.5px] mx-auto mb-8" style={{ color: T.inkSoft, maxWidth: 265, lineHeight: 1.55 }}>
      A bi-weekly reminder that scales lie and progress is more than numbers.
    </p>

    {/* Private vault frame — deep Aegean surround signals "this stays yours" */}
    <div
      className="mx-auto mb-3 p-[10px] rounded-[26px]"
      style={{ background: T.aegean, width: 236 }}
    >
      <Plate height={272} radius={18} />
    </div>
    <p className="sel-sans text-[11px] mb-8" style={{ color: T.inkFaint }}>
      Stored on this device only. Never scored, never shared.
    </p>

    <div className="flex flex-col gap-3">
      <Button onClick={next}>
        <span className="flex items-center justify-center gap-2">
          <Camera size={16} /> Take Baseline Photo
        </span>
      </Button>
      <button onClick={next} className="sel-sans text-[13px] underline" style={{ color: T.inkSoft }}>
        Skip for now
      </button>
    </div>

    <div className="mt-auto pt-8">
      <Dots total={4} active={3} />
    </div>
  </div>
);

/* ---------------------------------------------------------------
   2. THE HOME SANCTUARY
   --------------------------------------------------------------- */

const ENERGY_DIRECTIONS = [
  { key: "Inward", caption: "Rest", ring: T.aegean },
  { key: "Steady", caption: "Baseline", ring: T.sage },
  { key: "Outward", caption: "High Energy", ring: T.terracotta },
];

const ProgressMeter = ({ icon: Icon, label, value, pct, hidden }) => (
  <div className="flex items-center gap-3.5">
    <span
      className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
      style={{ background: T.canvasDeep }}
    >
      <Icon size={17} color={T.ink} strokeWidth={1.5} />
    </span>
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-[7px]">
        <span className="sel-sans text-[12.5px] font-medium" style={{ color: T.ink }}>
          {label}
        </span>
        <span
          className="sel-sans text-[12px] tabular-nums"
          style={{ color: hidden ? T.inkFaint : T.inkSoft, letterSpacing: hidden ? "0.1em" : 0 }}
        >
          {hidden ? "• • • •" : value}
        </span>
      </div>
      <div className="h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(36,31,26,0.09)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: T.sage }}
        />
      </div>
    </div>
  </div>
);

const HomeSanctuary = ({ state, set }) => (
  <div className="sel-rise">
    {/* Header */}
    <div className="flex items-center justify-between mb-7">
      <IconBtn label="Menu">
        <Menu size={17} color={T.ink} />
      </IconBtn>
      <span className="sel-serif text-[19px]" style={{ color: T.ink }}>
        Selena
      </span>
      <IconBtn label="Notifications">
        <Bell size={16} color={T.ink} />
      </IconBtn>
    </div>

    {/* The Imprint Zone */}
    <div
      className="rounded-[24px] overflow-hidden mb-8"
      style={{ background: T.canvasWarm, border: `1px solid ${T.hair}` }}
    >
      <div className="px-6 pt-6 pb-5">
        <p className="sel-eyebrow sel-sans mb-2.5">Today's imprint</p>
        <h1 className="sel-serif" style={{ fontSize: 26, lineHeight: 1.2, color: T.ink }}>
          The shift inward
          <br />
          has started.
        </h1>
        <p className="sel-serif italic mt-2" style={{ fontSize: 15, color: T.inkSoft }}>
          Honor the deceleration.
        </p>
      </div>
      <Plate height={168} radius={0} />
    </div>

    {/* Energy Direction Tap */}
    <p className="sel-sans text-[13px] font-medium mb-4" style={{ color: T.ink }}>
      Where is your energy going today?
    </p>
    <div className="flex justify-between mb-8">
      {ENERGY_DIRECTIONS.map(({ key, caption, ring }) => {
        const on = state.energy === key;
        return (
          <button
            key={key}
            onClick={() => set({ energy: key })}
            className="flex flex-col items-center gap-2.5 sel-press"
            style={{ width: 92 }}
          >
            <span
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 84,
                height: 84,
                padding: on ? 4 : 3,
                background: on ? ring : "transparent",
                border: on ? "none" : `1.5px solid ${T.hair}`,
              }}
            >
              <img
                src={IMG}
                alt={`${key} energy`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "999px",
                  filter: on ? "none" : "grayscale(0.55) opacity(0.75)",
                }}
              />
            </span>
            <span className="text-center leading-tight">
              <span
                className="sel-sans text-[12px] block"
                style={{ color: T.ink, fontWeight: on ? 600 : 500 }}
              >
                {key}
              </span>
              <span className="sel-sans text-[11px]" style={{ color: T.inkSoft }}>
                {caption}
              </span>
            </span>
          </button>
        );
      })}
    </div>

    {/* The Modular Vault */}
    <Card className="px-5 py-5">
      <div className="flex items-center justify-between mb-5">
        <span className="sel-sans text-[13.5px] font-medium" style={{ color: T.ink }}>
          Your daily plan
        </span>
        <button
          onClick={() => set({ hideNumbers: !state.hideNumbers })}
          className="flex items-center gap-1.5 sel-press rounded-full px-3 py-1.5"
          style={{ background: T.canvasDeep }}
        >
          {state.hideNumbers ? (
            <EyeOff size={13} color={T.inkSoft} />
          ) : (
            <Eye size={13} color={T.inkSoft} />
          )}
          <span className="sel-sans text-[11px]" style={{ color: T.inkSoft }}>
            {state.hideNumbers ? "Show Numbers" : "Hide Numbers"}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <ProgressMeter
          icon={Salad}
          label="Nutrition"
          value="1,850 kcal"
          pct={58}
          hidden={state.hideNumbers}
        />
        <ProgressMeter
          icon={Activity}
          label="Movement"
          value="0 / 45 min"
          pct={0}
          hidden={state.hideNumbers}
        />
      </div>
    </Card>
  </div>
);

/* ---------------------------------------------------------------
   3. THE TRIAD TRACKER
   --------------------------------------------------------------- */

const TRIAD = [
  {
    label: "Physical Reality",
    field: "physical",
    items: [
      { key: "Spotting", icon: Droplet },
      { key: "Heavy Flow", icon: Waves },
      { key: "Cramps", icon: Activity },
    ],
  },
  {
    label: "Mental State",
    field: "mental",
    items: [
      { key: "High Focus", icon: Sun },
      { key: "Brain Fog", icon: CloudFog },
      { key: "Anxious", icon: Brain },
    ],
  },
  {
    label: "Fuel Needs",
    field: "fuel",
    items: [
      { key: "Sugar", icon: Candy },
      { key: "Salt", icon: UtensilsCrossed },
      { key: "Heavy Carbs", icon: Salad },
    ],
  },
];

const TriadTracker = ({ state, set }) => {
  const toggle = (field, key) => {
    const cur = state.triad[field];
    set({
      triad: {
        ...state.triad,
        [field]: cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key],
      },
    });
  };

  return (
    <div className="sel-rise">
      <div className="flex items-center justify-between mb-7">
        <IconBtn label="Back">
          <ChevronLeft size={17} color={T.ink} />
        </IconBtn>
        <Eyebrow step={3}>Triad Tracker</Eyebrow>
        <button className="sel-sans text-[13px] font-medium sel-press" style={{ color: T.ink }}>
          Save
        </button>
      </div>

      <h1 className="sel-serif mb-7" style={{ fontSize: 25, lineHeight: 1.25, color: T.ink }}>
        How's your reality today?
      </h1>

      {TRIAD.map(({ label, field, items }) => (
        <div key={field} className="mb-6">
          <SectionLabel>{label}</SectionLabel>
          <div className="grid grid-cols-3 gap-2.5">
            {items.map(({ key, icon }) => (
              <Tile
                key={key}
                icon={icon}
                label={key}
                filled
                selected={state.triad[field].includes(key)}
                onClick={() => toggle(field, key)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-7 mb-4">
        <Button tone="dark">Save Entry</Button>
      </div>

      {/* Psychological toast — Deep Aegean, informational not corrective */}
      <div className="rounded-[18px] px-5 py-4 flex items-start gap-3.5" style={{ background: T.aegean }}>
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <Moon size={15} color={T.canvas} strokeWidth={1.6} />
        </span>
        <p className="sel-sans text-[13px]" style={{ color: T.canvas, lineHeight: 1.5 }}>
          Luteal buffer activated.
          <br />
          <span style={{ color: "rgba(247,244,238,0.72)" }}>Eat the carbs, use the heat pad.</span>
        </p>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------
   4. THE CYCLE RHYTHM — dynamic SVG wave
   --------------------------------------------------------------- */

const PHASES = [
  { name: "Menstruation", range: "Days 1–5", color: T.aegean },
  { name: "Follicular", range: "Days 6–13", color: "#8A9A78" },
  { name: "Ovulation", range: "Days 14–15", color: "#C9BFA6" },
  { name: "Luteal", range: "Days 16–28", color: T.sage },
  { name: "Premenstrual", range: "Days 29–Cycle Start", color: T.terracotta },
];

/** The signature element: an organic bezier that reads as a body rhythm,
 *  not a data chart. Amplitude peaks at ovulation, decays through luteal. */
const CycleWave = ({ day = 21, total = 28 }) => {
  const W = 340;
  const H = 150;
  const path =
    "M 4 104 C 30 104, 40 118, 58 116 C 82 113, 92 60, 122 44 C 152 28, 166 34, 182 52 C 196 68, 202 96, 224 100 C 250 105, 262 82, 284 78 C 306 74, 320 92, 336 100";

  const [pt, setPt] = useState({ x: 224, y: 100 });
  const ref = React.useRef(null);

  useEffect(() => {
    if (ref.current) {
      const len = ref.current.getTotalLength();
      const p = ref.current.getPointAtLength((day / total) * len);
      setPt({ x: p.x, y: p.y });
    }
  }, [day, total]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Cycle day ${day} of ${total}`}>
      <defs>
        <linearGradient id="waveInk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.aegean} />
          <stop offset="45%" stopColor="#8A9A78" />
          <stop offset="72%" stopColor={T.sage} />
          <stop offset="100%" stopColor={T.terracotta} />
        </linearGradient>
      </defs>

      {/* ghost trace beneath — the cycle before this one */}
      <path d={path} fill="none" stroke={T.ink} strokeWidth="1" opacity="0.1" transform="translate(0,10)" />

      <path
        ref={ref}
        d={path}
        fill="none"
        stroke="url(#waveInk)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* vertical drop to baseline from today */}
      <line x1={pt.x} y1={pt.y} x2={pt.x} y2={H - 12} stroke={T.ink} strokeWidth="1" strokeDasharray="2 4" opacity="0.35" />
      <circle cx={pt.x} cy={pt.y} r="11" fill={T.terracotta} opacity="0.16" />
      <circle cx={pt.x} cy={pt.y} r="5.5" fill={T.terracotta} />
      <circle cx={pt.x} cy={pt.y} r="2" fill={T.canvas} />
    </svg>
  );
};

const CycleRhythm = () => (
  <div className="sel-rise">
    <div className="flex items-center justify-between mb-8">
      <IconBtn label="Menu">
        <Menu size={17} color={T.ink} />
      </IconBtn>
      <Eyebrow step={4}>Cycle Rhythm</Eyebrow>
      <IconBtn label="Calendar">
        <Calendar size={16} color={T.ink} />
      </IconBtn>
    </div>

    <h1 className="sel-serif" style={{ fontSize: 40, lineHeight: 1.05, color: T.ink }}>
      Luteal
    </h1>
    <p className="sel-serif italic mt-3 mb-7" style={{ fontSize: 15.5, color: T.inkSoft, lineHeight: 1.5 }}>
      Your system is preparing to rest.
      <br />
      Honor the deceleration.
    </p>

    <div className="mb-7">
      <CycleWave day={21} total={28} />
    </div>

    <div className="grid grid-cols-2 gap-y-3 gap-x-3 mb-8">
      {PHASES.map(({ name, range, color }) => (
        <div key={name} className="flex items-start gap-2">
          <span
            className="rounded-full flex-shrink-0 mt-[5px]"
            style={{ width: 7, height: 7, background: color }}
          />
          <span className="leading-tight">
            <span className="sel-sans text-[12px] block" style={{ color: T.ink }}>
              {name}
            </span>
            <span className="sel-sans text-[11px]" style={{ color: T.inkFaint }}>
              {range}
            </span>
          </span>
        </div>
      ))}
    </div>

    <Button>Log Today's Reality</Button>
    <p className="sel-sans text-[12.5px] text-center mt-4" style={{ color: T.inkSoft }}>
      Today · Day 21 of 28
    </p>
  </div>
);

/* ---------------------------------------------------------------
   5. THE TRAINING PROTOCOL
   --------------------------------------------------------------- */

const FOCUS_ITEMS = [
  "Mobility & stretching",
  "Nervous system support",
  "Hydration & electrolytes",
  "Gentle walk (optional)",
];

/** 45-minute post-workout protein window — visual countdown only, mocked. */
const ProteinWindow = () => {
  const total = 45 * 60;
  const remaining = 27 * 60 + 40; // mocked
  const pct = (remaining / total) * 100;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Card className="px-5 py-4" style={{ background: T.canvasWarm }}>
      <div className="flex items-center gap-3.5">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: T.terracotta }}
        >
          <Timer size={17} color={T.canvas} strokeWidth={1.7} />
        </span>
        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="sel-sans text-[13px] font-medium" style={{ color: T.ink }}>
              Protein window open
            </span>
            <span className="sel-sans text-[13px] tabular-nums font-semibold" style={{ color: T.terracotta }}>
              {mm}:{ss}
            </span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden mb-2" style={{ background: "rgba(36,31,26,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: T.terracotta }} />
          </div>
          <p className="sel-sans text-[11.5px]" style={{ color: T.inkSoft, lineHeight: 1.45 }}>
            Aim for ~30g protein before this closes. If you miss it, nothing breaks.
          </p>
        </div>
      </div>
    </Card>
  );
};

const TrainingProtocol = () => (
  <div className="sel-rise">
    <div className="text-center mb-6">
      <h1 className="sel-serif" style={{ fontSize: 24, lineHeight: 1.25, color: T.ink }}>
        Today's Movement Plan
      </h1>
      <p className="sel-sans text-[11.5px] mt-2" style={{ color: T.inkSoft, letterSpacing: "0.04em" }}>
        Based on your logged state: <span style={{ color: T.aegean, fontWeight: 600 }}>INWARD (Rest)</span>
      </p>
    </div>

    <Plate height={224} radius={24} className="mb-6" />

    {/* Forgiveness Engine — rest earns the same completion mark as a heavy lift */}
    <Card className="px-5 py-4 mb-4 flex items-center gap-4" style={{ background: "rgba(61,74,62,0.09)", borderColor: "rgba(61,74,62,0.22)" }}>
      <div className="flex-1">
        <p className="sel-sans text-[15px] font-semibold" style={{ color: T.ink }}>
          Recovery Day
        </p>
        <p className="sel-sans text-[12.5px] mt-0.5" style={{ color: T.inkSoft }}>
          This is productive rest.
        </p>
      </div>
      <span
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: T.sage }}
      >
        <Check size={22} color={T.canvas} strokeWidth={2.4} />
      </span>
    </Card>

    <Card className="px-5 py-5 mb-4">
      <SectionLabel>Today's Focus</SectionLabel>
      <ul className="flex flex-col gap-2.5 mt-1">
        {FOCUS_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <span className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: T.sage }} />
            <span className="sel-sans text-[13px]" style={{ color: T.ink }}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </Card>

    {/* Dr. Sims' Bailout */}
    <Card className="px-5 py-4 mb-4">
      <div className="flex items-start gap-3.5">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: T.canvasDeep }}
        >
          <LifeBuoy size={17} color={T.aegean} strokeWidth={1.6} />
        </span>
        <div className="flex-1">
          <p className="sel-sans text-[13px] font-medium mb-0.5" style={{ color: T.ink }}>
            Not feeling it today?
          </p>
          <p className="sel-sans text-[12px] mb-3" style={{ color: T.inkSoft, lineHeight: 1.45 }}>
            Swap the full session for ten quiet minutes. It still counts as done.
          </p>
          <Button tone="outline" size="sm" full={false}>
            10-Minute Bailout · Pivot to Recovery
          </Button>
        </div>
      </div>
    </Card>

    <ProteinWindow />
  </div>
);

/* ---------------------------------------------------------------
   6. THE FUEL ENGINE
   --------------------------------------------------------------- */

const FOCUS_CARDS = [
  {
    title: "Brain Fog + Sugar Craving",
    body: "Try dark chocolate and pumpkin seeds—magnesium your body is begging for right now.",
  },
  {
    title: "Heavy Flow Detected",
    body: "Iron-rich foods can help replenish what your body is losing. Try a warm stew with lentils and dark leafy greens.",
  },
];

const FuelEngine = ({ state, set }) => (
  <div className="sel-rise">
    <div className="flex items-center justify-between mb-7">
      <IconBtn label="Menu">
        <Menu size={17} color={T.ink} />
      </IconBtn>
      <Eyebrow step={6}>Fuel Engine</Eyebrow>
      <div className="w-9" />
    </div>

    {/* Luteal Buffer banner */}
    <Card className="px-5 py-5 mb-7" style={{ background: T.canvasWarm }}>
      <div className="flex gap-4">
        <div className="w-[54px] h-[54px] rounded-[15px] overflow-hidden flex-shrink-0">
          <img src={IMG} alt="Luteal buffer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div className="flex-1">
          <p className="sel-serif" style={{ fontSize: 17, lineHeight: 1.3, color: T.ink }}>
            Your body is burning slightly more energy today.
          </p>
          <p className="sel-sans text-[12.5px] mt-2 mb-4" style={{ color: T.inkSoft }}>
            Would you like to activate the Luteal Buffer?
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => set({ buffer: !state.buffer })}
              className="sel-sans rounded-full px-4 py-[9px] text-[12px] font-medium sel-press flex items-center gap-1.5"
              style={{ background: state.buffer ? T.olive : T.sage, color: T.canvas }}
            >
              {state.buffer && <Check size={13} />}
              {state.buffer ? "Buffer active" : "Activate +200 kcal"}
            </button>
            <button className="sel-sans text-[12px] sel-press" style={{ color: T.inkSoft }}>
              Not today
            </button>
          </div>
        </div>
      </div>
    </Card>

    {/* Behavioral focus */}
    <SectionLabel>Today's Focus</SectionLabel>
    <div className="flex flex-col gap-3 mb-6">
      {FOCUS_CARDS.map(({ title, body }, i) => (
        <Card key={title} className="px-4 py-4 flex gap-3.5 items-start">
          <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden flex-shrink-0">
            <img src={IMG} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="flex-1">
            <p className="sel-sans text-[13px] font-semibold mb-1" style={{ color: T.ink }}>
              {title}
            </p>
            <p className="sel-sans text-[12px]" style={{ color: T.inkSoft, lineHeight: 1.5 }}>
              {body}
            </p>
          </div>
          <button
            onClick={() => set({ saved: { ...state.saved, [i]: !state.saved[i] } })}
            className="sel-press mt-0.5 flex-shrink-0"
            aria-label="Save suggestion"
          >
            <Heart
              size={17}
              strokeWidth={1.6}
              color={state.saved[i] ? T.terracotta : T.inkFaint}
              fill={state.saved[i] ? T.terracotta : "none"}
            />
          </button>
        </Card>
      ))}
    </div>

    {/* Forgiveness banner */}
    <div className="rounded-[18px] px-5 py-4 flex items-start gap-3.5" style={{ background: T.canvasDeep }}>
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(61,74,62,0.16)" }}
      >
        <Salad size={15} color={T.sage} strokeWidth={1.6} />
      </span>
      <p className="sel-sans text-[12.5px]" style={{ color: T.inkSoft, lineHeight: 1.55 }}>
        It looks like your body required extra energy yesterday. We've adjusted today's baseline to keep you
        balanced.
      </p>
    </div>
  </div>
);

/* ---------------------------------------------------------------
   GLOBAL BOTTOM NAVIGATION
   --------------------------------------------------------------- */

const NAV = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "tracker", label: "Tracker", icon: ClipboardList },
  { key: "cycle", label: "Cycle", icon: Moon },
  { key: "workouts", label: "Workouts", icon: Activity },
  { key: "nutrition", label: "Nutrition", icon: UtensilsCrossed },
];

const BottomNav = ({ tab, setTab }) => (
  <div
    className="flex justify-between px-5 pt-3 pb-4"
    style={{ borderTop: `1px solid ${T.hair}`, background: T.canvas }}
  >
    {NAV.map(({ key, label, icon: Icon }) => {
      const on = tab === key;
      return (
        <button
          key={key}
          onClick={() => setTab(key)}
          className="flex flex-col items-center gap-[5px] sel-press"
          style={{ width: 58 }}
        >
          <Icon size={19} strokeWidth={on ? 2 : 1.5} color={on ? T.ink : T.inkFaint} />
          <span
            className="sel-sans text-[10px]"
            style={{ color: on ? T.ink : T.inkFaint, fontWeight: on ? 600 : 400 }}
          >
            {label}
          </span>
          <span
            className="rounded-full"
            style={{ width: on ? 14 : 0, height: 2, background: T.terracotta, transition: "width .2s" }}
          />
        </button>
      );
    })}
  </div>
);

/* ---------------------------------------------------------------
   ROOT — mocked state only, no persistence, no network
   --------------------------------------------------------------- */

export default function SelenaApp() {
  const [phase, setPhase] = useState("onboarding"); // onboarding | app
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState("home");

  const [onboarding, setOnboarding] = useState({
    vibe: null,
    lastPeriod: "May 12, 2025",
    periodLength: "5 days",
    hurdles: [],
    ageFork: "20s/30s",
    onOC: false,
    nutritionPref: "Protein & Calories only",
  });

  const [app, setApp] = useState({
    energy: "Inward",
    hideNumbers: false,
    buffer: false,
    saved: {},
    triad: { physical: ["Heavy Flow"], mental: ["Brain Fog"], fuel: ["Heavy Carbs"] },
  });

  const setOn = (patch) => setOnboarding((p) => ({ ...p, ...patch }));
  const setApp_ = (patch) => setApp((p) => ({ ...p, ...patch }));

  const onboardingScreens = [
    <VibeCheck key="1" data={onboarding} set={setOn} next={() => setStep(1)} />,
    <BiologicalBaseline key="2" data={onboarding} set={setOn} next={() => setStep(2)} back={() => setStep(0)} />,
    <NutritionPhilosophy key="3" data={onboarding} set={setOn} next={() => setStep(3)} back={() => setStep(1)} />,
    <RealityCheck key="4" next={() => setPhase("app")} back={() => setStep(2)} />,
  ];

  const tabs = {
    home: <HomeSanctuary state={app} set={setApp_} />,
    tracker: <TriadTracker state={app} set={setApp_} />,
    cycle: <CycleRhythm />,
    workouts: <TrainingProtocol />,
    nutrition: <FuelEngine state={app} set={setApp_} />,
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center py-8 px-4"
      style={{ background: "#E4DED0" }}
    >
      <GlobalStyles />

      {/* dev-only screen switcher — not part of the product UI */}
      <div className="flex gap-2 mb-5 flex-wrap justify-center">
        <button
          onClick={() => {
            setPhase("onboarding");
            setStep(0);
          }}
          className="sel-sans text-[11px] rounded-full px-3 py-1.5"
          style={{
            background: phase === "onboarding" ? T.ink : "transparent",
            color: phase === "onboarding" ? T.canvas : T.inkSoft,
            border: `1px solid ${T.hair}`,
          }}
        >
          Onboarding
        </button>
        <button
          onClick={() => setPhase("app")}
          className="sel-sans text-[11px] rounded-full px-3 py-1.5"
          style={{
            background: phase === "app" ? T.ink : "transparent",
            color: phase === "app" ? T.canvas : T.inkSoft,
            border: `1px solid ${T.hair}`,
          }}
        >
          App
        </button>
      </div>

      <div
        className="w-full flex flex-col overflow-hidden sel-canvas"
        style={{
          maxWidth: 392,
          height: 812,
          borderRadius: 38,
          boxShadow: "0 26px 70px rgba(28,40,51,0.20)",
          border: `1px solid rgba(255,255,255,0.5)`,
        }}
      >
        <div className="flex-1 overflow-y-auto sel-scroll px-6 pt-7 pb-7">
          {phase === "onboarding" ? onboardingScreens[step] : tabs[tab]}
        </div>

        {phase === "app" && <BottomNav tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}
