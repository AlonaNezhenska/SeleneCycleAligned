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
  Leaf,
  ArrowRight,
  Thermometer,
  Battery,
  Users,
  Zap,
  Coffee,
  Droplets,
  CloudRain,
  CloudDrizzle,
  Blend,
  CircleDot,
  PersonStanding,
  HeartCrack,
  Anchor,
  Flame,
  Frown,
  Bone,
  AlarmClock,
  BatteryLow,
  Footprints,
  Hourglass,
  Wind,
  Sparkles,
  MoonStar,
  Snowflake,
  Target,
  Puzzle,
  Shuffle,
  Smile,
  Angry,
  Meh,
  TriangleAlert,
  TrendingUp,
  Pause,
  Minus,
  User,
  UserMinus,
  Repeat,
  Scan,
  Soup,
  Sandwich,
  Beef,
  Utensils,
  Ban,
  CupSoda,
  GlassWater,
  Equal,
  Hammer,
  Weight,
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

const IMG = "/assets/hero-moon-woman.png";
const IMG_VAULT = "/assets/vault-frame.png";
const IMG_MEDITATE = "/assets/meditating-woman.png";
const IMG_FOREST = "/assets/forest-sunbeam.jpg";
const IMG_BLOOM_RED = "/assets/icons/orb-body.jpg";

/** Per-screen palette. Dark screens invert ink to canvas and go glassy. */
const tone = (dark) =>
  dark
    ? {
        text: T.canvas,
        textSoft: "rgba(247,244,238,0.66)",
        textFaint: "rgba(247,244,238,0.40)",
        hair: "rgba(247,244,238,0.26)",
        surface: "rgba(255,253,248,0.10)",
        surfaceDeep: "rgba(255,253,248,0.17)",
      }
    : {
        text: T.ink,
        textSoft: T.inkSoft,
        textFaint: T.inkFaint,
        hair: T.hair,
        surface: "#FFFDF8",
        surfaceDeep: T.canvasDeep,
      };

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

    @keyframes sel-bg-fade { from { opacity: 0; } to { opacity: 1; } }
    .sel-bg-fade { animation: sel-bg-fade .6s ease both; }

    /* Tile labels are shortened to fit; the tip carries the full wording. */
    .sel-tip { position: relative; }
    .sel-tip-label {
      position: absolute; bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%) translateY(3px);
      width: 128px; padding: 7px 9px; border-radius: 10px; z-index: 30;
      background: ${T.aegean}; color: ${T.canvas};
      font-size: 11px; line-height: 1.35; text-align: center;
      opacity: 0; pointer-events: none;
      transition: opacity .16s ease, transform .16s ease;
      box-shadow: 0 6px 18px rgba(28,40,51,0.22);
    }
    .sel-tip-label::after {
      content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
      border: 5px solid transparent; border-top-color: ${T.aegean};
    }
    .sel-tip:hover .sel-tip-label,
    .sel-tip:focus-visible .sel-tip-label {
      opacity: 1; transform: translateX(-50%) translateY(0);
    }
    @media (hover: none) { .sel-tip:hover .sel-tip-label { opacity: 0; } }

    @media (prefers-reduced-motion: reduce) {
      .sel-rise, .sel-bg-fade { animation: none; }
      .sel-press { transition: none; }
    }

    :focus-visible { outline: 2px solid ${T.sage}; outline-offset: 3px; }
  `}</style>
);

/* ---------------------------------------------------------------
   SHARED PRIMITIVES
   --------------------------------------------------------------- */

const Eyebrow = ({ step, children, dark = false }) => {
  const c = tone(dark);
  return (
    <div className="flex items-center gap-2">
      {step != null && (
        <span
          className="w-[19px] h-[19px] rounded-full flex items-center justify-center sel-sans"
          style={{ background: c.text, color: dark ? T.aegean : T.canvas, fontSize: 10, fontWeight: 600 }}
        >
          {step}
        </span>
      )}
      <span className="sel-eyebrow sel-sans" style={{ color: c.textSoft }}>
        {children}
      </span>
    </div>
  );
};

const IconBtn = ({ children, onClick, label, dark = false }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="w-9 h-9 rounded-full flex items-center justify-center sel-press"
    style={{ border: `1px solid ${tone(dark).hair}` }}
  >
    {children}
  </button>
);

const Button = ({ children, onClick, tone: variant = "primary", full = true, size = "lg", dark = false }) => {
  const c = tone(dark);
  const variants = {
    primary: { background: T.sage, color: T.canvas, border: `1.5px solid ${T.sage}` },
    dark: { background: T.aegean, color: T.canvas, border: `1.5px solid ${T.aegean}` },
    outline: { background: "transparent", color: c.text, border: `1.5px solid ${c.text}` },
    quiet: { background: "transparent", color: c.textSoft, border: "1.5px solid transparent" },
  };
  const sizes = { lg: "py-[15px] px-7 text-[15px]", sm: "py-[9px] px-4 text-[12px]" };
  return (
    <button
      onClick={onClick}
      className={`sel-sans font-medium rounded-full sel-press ${sizes[size]} ${full ? "w-full" : ""}`}
      style={variants[variant]}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", style = {}, onClick, dark = false }) => {
  const c = tone(dark);
  return (
    <div
      onClick={onClick}
      className={`rounded-[20px] ${className}`}
      style={{
        background: c.surface,
        border: `1px solid ${c.hair}`,
        backdropFilter: dark ? "blur(8px)" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Selection tile — the workhorse. Filled = chosen, never "correct".
 *  `full` adds a hover tip for labels too long to sit under the icon. */
const Tile = ({
  icon: Icon,
  label,
  full,
  selected,
  onClick,
  filled = false,
  dark = false,
  accent = T.sage,
}) => {
  const c = tone(dark);
  const ink = selected && filled ? T.canvas : c.text;
  return (
    <button
      onClick={onClick}
      aria-label={full || label}
      aria-pressed={selected}
      className={`rounded-[16px] py-[18px] px-2 flex flex-col items-center gap-2 sel-press ${full ? "sel-tip" : ""}`}
      style={{
        background: selected ? (filled ? accent : dark ? c.surfaceDeep : "rgba(61,74,62,0.07)") : c.surface,
        border: `1.5px solid ${selected ? accent : c.hair}`,
        color: ink,
        backdropFilter: dark ? "blur(8px)" : undefined,
      }}
    >
      <Icon size={22} strokeWidth={1.5} color={ink} />
      <span
        className="sel-sans text-[11.5px] text-center leading-tight"
        style={{ fontWeight: selected ? 600 : 400 }}
      >
        {label}
      </span>
      {full && <span className="sel-tip-label sel-sans">{full}</span>}
    </button>
  );
};

/** Aesthetic toggle — a hand-drawn feeling switch, not a system control. */
const Switch = ({ value, onChange, leftLabel, rightLabel, dark = false }) => {
  const c = tone(dark);
  return (
    <div
      className="flex rounded-full p-[3px] sel-sans"
      style={{ background: dark ? "rgba(28,40,51,0.45)" : T.canvasDeep }}
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
            background: value === v ? (dark ? T.sage : T.aegean) : "transparent",
            color: value === v ? T.canvas : c.textSoft,
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

const ToggleRow = ({ label, sublabel, dark = false, ...rest }) => {
  const c = tone(dark);
  return (
    <Card className="px-5 py-4 mb-3" dark={dark}>
      <p className="sel-sans text-[14px] font-medium mb-0.5" style={{ color: c.text }}>
        {label}
      </p>
      {sublabel && (
        <p className="sel-sans text-[12px] mb-3" style={{ color: c.textSoft }}>
          {sublabel}
        </p>
      )}
      <Switch dark={dark} {...rest} />
    </Card>
  );
};

const Dots = ({ total, active, dark = false }) => (
  <div className="flex justify-center gap-[7px]">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className="h-[5px] rounded-full transition-all duration-300"
        style={{
          width: i === active ? 18 : 5,
          background: i === active ? tone(dark).text : dark ? "rgba(247,244,238,0.3)" : "rgba(36,31,26,0.2)",
        }}
      />
    ))}
  </div>
);

/** Illustration frame — all raster art routes through here. */
const Plate = ({ height = 200, radius = 20, className = "", src = IMG, alt = "Selena illustration", dark = false }) => (
  <div
    className={`overflow-hidden ${className}`}
    style={{
      height,
      borderRadius: radius,
      background: dark ? "rgba(0,0,0,0.2)" : T.canvasDeep,
      border: `1px solid ${tone(dark).hair}`,
    }}
  >
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  </div>
);

const SectionLabel = ({ children, dark = false }) => (
  <p className="sel-eyebrow sel-sans mb-2.5" style={{ color: tone(dark).textSoft }}>
    {children}
  </p>
);

/* ---------------------------------------------------------------
   1. ONBOARDING FLOW — Screens 1.0 – 1.4

   Each step owns its backdrop and alternates dark/light so the flow
   breathes: hero → pink wash → deep green → soft light → dark vault.
   The scrim sits above the photo to guarantee text contrast.
   --------------------------------------------------------------- */

const ONBOARDING_BG = [
  {
    img: "/assets/hero-moon-woman.png",
    scrim:
      "linear-gradient(180deg, rgba(20,28,26,0.30) 0%, rgba(20,28,26,0.10) 38%, rgba(16,22,20,0.72) 78%, rgba(16,22,20,0.88) 100%)",
  },
  {
    img: "/assets/wash-pink-ombre.jpg",
    scrim:
      "linear-gradient(180deg, rgba(250,244,238,0.62) 0%, rgba(250,240,236,0.40) 50%, rgba(250,238,235,0.30) 100%)",
  },
  {
    img: "/assets/forest-deep.jpg",
    scrim:
      "linear-gradient(180deg, rgba(18,30,24,0.78) 0%, rgba(16,26,22,0.86) 55%, rgba(14,22,19,0.92) 100%)",
  },
  {
    img: "/assets/wash-pink-soft.jpg",
    scrim:
      "linear-gradient(180deg, rgba(250,245,240,0.70) 0%, rgba(249,241,238,0.52) 55%, rgba(248,238,236,0.42) 100%)",
  },
  {
    img: "/assets/marble-dark-green.jpg",
    scrim:
      "linear-gradient(180deg, rgba(16,26,32,0.80) 0%, rgba(14,24,30,0.88) 60%, rgba(12,20,26,0.93) 100%)",
  },
];

/** App tabs that carry their own backdrop instead of the plain paper canvas.
 *  The tracker echoes the onboarding cycle screen so logging feels continuous. */
const APP_BG = {
  tracker: ONBOARDING_BG[2],
};

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

/* ---- 1.0 Welcome — full-bleed moonlit hero, text sits on the art ---- */
const Welcome = ({ next }) => (
  <div className="flex flex-col h-full sel-rise">
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <Leaf size={15} color={T.canvas} strokeWidth={1.5} />
      <span className="sel-serif" style={{ fontSize: 25, color: T.canvas }}>
        Selena
      </span>
    </div>

    <div className="mt-auto">
      <h1 className="sel-serif" style={{ fontSize: 37, lineHeight: 1.16, color: T.canvas }}>
        Your cycle,
        <br />
        your rhythm,
        <br />
        your power.
      </h1>
      <p
        className="sel-sans text-[14px] mt-4 mb-9"
        style={{ color: "rgba(247,244,238,0.78)", lineHeight: 1.5, maxWidth: 230 }}
      >
        A sanctuary for your body, mind and energy.
      </p>
      <Button tone="outline" dark onClick={next}>
        <span className="flex items-center justify-center gap-2">
          Get started <ArrowRight size={16} />
        </span>
      </Button>
    </div>
  </div>
);

/* ---- 1.1 The Vibe Check ---- */
const VibeCheck = ({ data, set, next, back }) => (
  <div className="flex flex-col h-full sel-rise">
    <div className="flex items-center justify-between mb-9">
      <IconBtn onClick={back} label="Back">
        <ChevronLeft size={17} color={T.ink} />
      </IconBtn>
      <Eyebrow step={1}>Onboarding</Eyebrow>
      <div className="w-9" />
    </div>

    <h1 className="sel-serif mb-3" style={{ fontSize: 30, lineHeight: 1.2, color: T.ink }}>
      How do you want
      <br />
      to feel in 3 months?
    </h1>
    <p className="sel-sans text-[13.5px] mb-9" style={{ color: T.inkSoft, lineHeight: 1.55, maxWidth: 265 }}>
      This is about your energy, mood and overall wellbeing — not just numbers.
    </p>

    <div className="flex flex-col gap-3">
      {[
        { label: "Stronger", icon: Sun, accent: T.terracotta },
        { label: "Less exhausted", icon: Leaf, accent: T.sage },
        { label: "In tune with my body", icon: Moon, accent: "#9B8FC7" },
      ].map(({ label, icon: Icon, accent }) => {
        const on = data.vibe === label;
        return (
          <button
            key={label}
            onClick={() => set({ vibe: label })}
            className="rounded-full py-[15px] px-6 flex items-center gap-3.5 sel-press sel-sans text-[15px]"
            style={{
              background: on ? accent : "rgba(255,253,248,0.72)",
              color: on ? T.canvas : T.ink,
              border: `1.5px solid ${on ? accent : T.hair}`,
              fontWeight: on ? 600 : 500,
            }}
          >
            <Icon size={18} strokeWidth={1.6} color={on ? T.canvas : T.ink} />
            <span className="flex-1 text-left">{label}</span>
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

  const c = tone(true);

  return (
    <div className="flex flex-col h-full sel-rise">
      <div className="flex items-center justify-between mb-7">
        <IconBtn onClick={back} label="Back" dark>
          <ChevronLeft size={17} color={c.text} />
        </IconBtn>
        <Eyebrow step={2} dark>
          Your cycle
        </Eyebrow>
        <div className="w-9" />
      </div>

      <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: c.text }}>
        Let's get to know
        <br />
        your cycle.
      </h1>
      <p className="sel-sans text-[13.5px] mb-8" style={{ color: c.textSoft, lineHeight: 1.55, maxWidth: 260 }}>
        This helps us understand your unique rhythm (and not guess).
      </p>

      <label className="sel-sans text-[13px] font-medium mb-2 block" style={{ color: c.text }}>
        When did your last period start?
      </label>
      <Card className="px-4 py-[13px] mb-5 flex items-center justify-between sel-press" dark>
        <span className="sel-sans text-[15px]" style={{ color: c.text }}>
          {data.lastPeriod}
        </span>
        <Calendar size={17} color={c.textSoft} strokeWidth={1.6} />
      </Card>

      <label className="sel-sans text-[13px] font-medium mb-2 block" style={{ color: c.text }}>
        How long does it usually last?
      </label>
      <Card className="px-4 py-[13px] mb-6 flex items-center justify-between sel-press" dark>
        <span className="sel-sans text-[15px]" style={{ color: c.text }}>
          {data.periodLength}
        </span>
        <ChevronDown size={17} color={c.textSoft} strokeWidth={1.6} />
      </Card>

      <label className="sel-sans text-[13px] font-medium mb-1 block" style={{ color: c.text }}>
        What is your hardest hurdle?
      </label>
      <p className="sel-sans text-[12px] mb-3" style={{ color: c.textSoft }}>
        Choose as many as apply.
      </p>
      <div className="grid grid-cols-3 gap-2.5 mb-7">
        {HURDLES.map(({ key, icon }) => (
          <Tile
            key={key}
            icon={icon}
            label={key}
            dark
            selected={data.hurdles.includes(key)}
            onClick={() => toggleHurdle(key)}
          />
        ))}
      </div>

      <ToggleRow
        dark
        label="Which decade are you in?"
        sublabel="This sets your protein timing and recovery load."
        value={data.ageFork === "40+"}
        onChange={(v) => set({ ageFork: v ? "40+" : "20s/30s" })}
        leftLabel="20s / 30s"
        rightLabel="40+ (Perimenopause)"
      />

      <ToggleRow
        dark
        label="Hormonal birth control"
        sublabel="Are you currently taking oral contraceptives?"
        value={data.onOC}
        onChange={(v) => set({ onOC: v })}
        leftLabel="No"
        rightLabel="Yes"
      />

      <div className="mt-auto pt-6">
        <div className="flex gap-3 mb-6">
          <Button tone="outline" full={false} onClick={back} dark>
            Back
          </Button>
          <div className="flex-1">
            <Button onClick={next}>Next</Button>
          </div>
        </div>
        <Dots total={4} active={1} dark />
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

    <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: T.ink }}>
      How do you prefer
      <br />
      to track nutrition?
    </h1>
    <p className="sel-sans text-[13.5px] mb-8" style={{ color: T.inkSoft, lineHeight: 1.55, maxWidth: 265 }}>
      Choose what feels good for you. You can always change this later.
    </p>

    <div className="flex flex-col gap-3">
      {NUTRITION_PHILOSOPHIES.map(({ key, sub }) => {
        const on = data.nutritionPref === key;
        return (
          <button
            key={key}
            onClick={() => set({ nutritionPref: key })}
            className="rounded-[20px] px-5 py-[17px] flex items-center gap-4 text-left sel-press"
            style={{
              background: on ? "rgba(61,74,62,0.12)" : "rgba(255,253,248,0.72)",
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
const RealityCheck = ({ next, back }) => {
  const c = tone(true);

  return (
    <div className="flex flex-col h-full sel-rise">
      <div className="flex items-center justify-between mb-7">
        <IconBtn onClick={back} label="Back" dark>
          <ChevronLeft size={17} color={c.text} />
        </IconBtn>
        <Eyebrow step={4} dark>
          Reality check
        </Eyebrow>
        <div className="w-9" />
      </div>

      <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: c.text }}>
        This is your
        <br />
        Reality Check.
      </h1>
      <p className="sel-sans text-[13.5px] mb-8" style={{ color: c.textSoft, maxWidth: 265, lineHeight: 1.55 }}>
        A bi-weekly reminder that progress is more than a number on a scale.
      </p>

      {/* Private vault frame — width pinned to the art's 0.76 aspect so the frame isn't cropped */}
      <div className="mx-auto mb-4" style={{ width: 236 }}>
        <Plate height={310} radius={20} src={IMG_VAULT} alt="Private baseline photo vault" dark />
      </div>
      <p className="sel-sans text-[11px] text-center mb-8" style={{ color: c.textFaint }}>
        Stored on this device only. Never scored, never shared.
      </p>

      <div className="flex flex-col gap-3">
        <Button onClick={next}>
          <span className="flex items-center justify-center gap-2">
            <Camera size={16} /> Take Baseline Photo
          </span>
        </Button>
        <button onClick={next} className="sel-sans text-[13px] underline" style={{ color: c.textSoft }}>
          Skip for now
        </button>
      </div>

      <div className="mt-auto pt-8">
        <Dots total={4} active={3} dark />
      </div>
    </div>
  );
};

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
  <span
    className="relative inline-block overflow-hidden align-top"
    style={{ width: size, height: size, borderRadius: 999 }}
  >
    <img
      src={ORB[pillar].src}
      alt=""
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: `scale(${ORB[pillar].zoom})`,
        mixBlendMode: "multiply",
      }}
    />
    {children}
  </span>
);

const Orb = ({ pillar, size }) => (
  <span
    className="inline-block"
    style={{ borderRadius: 999, background: T.canvasWarm, isolation: "isolate", lineHeight: 0 }}
  >
    <OrbImg pillar={pillar} size={size} />
  </span>
);

/** Three pillars. `single` groups are genuine scales — the states are
 *  mutually exclusive, so picking one replaces the last. */
const PILLARS = [
  {
    key: "physical",
    title: "Physical Reality",
    caption: "Body & symptoms",
    purpose: "Inflammation, fluid shifts and systemic stress. This is what calls a deload or the 10-Minute Bailout.",
    accent: T.terracotta,
    groups: [
      {
        key: "flow",
        label: "Bleeding & Flow",
        icon: Droplet,
        options: [
          { k: "Spotting", icon: Droplet },
          { k: "Light", icon: Droplets },
          { k: "Medium", icon: CloudDrizzle },
          { k: "Heavy", icon: CloudRain },
          { k: "Clots", icon: Blend },
        ],
      },
      {
        key: "pain",
        label: "Localized Pain",
        icon: Waves,
        options: [
          { k: "Uterine cramps", short: "Cramps", icon: Zap },
          { k: "Lower back ache", short: "Back ache", icon: PersonStanding },
          { k: "Breast tenderness", short: "Breast", icon: HeartCrack },
          { k: "Pelvic heaviness", short: "Pelvic", icon: Anchor },
          { k: "Hormonal headache", short: "Headache", icon: Hammer },
        ],
      },
      {
        key: "fatigue",
        label: "Systemic Fatigue",
        icon: Battery,
        options: [
          { k: "Heavy limbs", short: "Heavy limbs", icon: Weight },
          { k: "Joint stiffness", short: "Joints", icon: Bone },
          {
            k: "Waking up wired",
            short: "Wired",
            icon: AlarmClock,
            note: "Insomnia that runs hot — a cortisol signature, not a willpower problem.",
          },
          { k: "Bone-deep exhaustion", short: "Exhausted", icon: BatteryLow },
          { k: "Restless legs", short: "Restless", icon: Footprints },
        ],
      },
      {
        key: "digestion",
        label: "Digestive Response",
        icon: Activity,
        options: [
          { k: "Bloating / water retention", short: "Bloating", icon: CircleDot },
          { k: "Constipation", short: "Constipated", icon: Hourglass },
          { k: "Diarrhea", short: "Diarrhea", icon: Wind },
          { k: "Nausea", short: "Nausea", icon: Frown },
          { k: "IBS flare-up", short: "IBS flare", icon: Flame },
        ],
      },
      {
        key: "skin",
        label: "Skin & Temperature",
        icon: Thermometer,
        options: [
          { k: "Hormonal breakouts", short: "Breakouts", icon: Sparkles },
          { k: "Night sweats", short: "Night sweats", icon: MoonStar },
          {
            k: "Hot flashes",
            short: "Hot flashes",
            icon: Thermometer,
            note: "Tracked closely on the 40+ perimenopause track.",
          },
          {
            k: "Freezing cold",
            short: "Freezing",
            icon: Snowflake,
            note: "Often low metabolic output — worth fuelling, not pushing through.",
          },
        ],
      },
    ],
  },
  {
    key: "mental",
    title: "Mental State",
    caption: "Mind, mood & social battery",
    purpose: "Serotonin and dopamine shifts. Powers the Mental Support Engine and catches late-luteal withdrawal.",
    accent: "#6B6FA8",
    groups: [
      {
        key: "cognition",
        label: "Cognitive Function",
        icon: Brain,
        options: [
          { k: "Sharp / high focus", short: "Sharp", icon: Target },
          { k: "Brain fog", short: "Brain fog", icon: CloudFog },
          { k: "Forgetfulness", short: "Forgetful", icon: Puzzle },
          { k: "Scatterbrained", short: "Scattered", icon: Shuffle },
        ],
      },
      {
        key: "emotion",
        label: "Emotional State",
        icon: Heart,
        options: [
          { k: "Calm / grounded", short: "Calm", icon: Smile },
          { k: "Irritable / snappy", short: "Irritable", icon: Angry },
          { k: "Anxious / overwhelmed", short: "Anxious", icon: TriangleAlert },
          { k: "Low mood", short: "Low mood", icon: CloudDrizzle },
          { k: "Highly sensitive / tearful", short: "Tearful", icon: Frown },
          { k: "Apathetic", short: "Apathetic", icon: Meh },
        ],
      },
      {
        key: "drive",
        label: "Drive & Motivation",
        icon: Zap,
        options: [
          { k: "Ambitious / ready to push", short: "Ambitious", icon: TrendingUp },
          { k: "Zero motivation", short: "Zero drive", icon: Pause },
          { k: "Indifferent", short: "Indifferent", icon: Minus },
        ],
      },
      {
        key: "social",
        label: "Social Capacity",
        icon: Users,
        single: true,
        options: [
          { k: "Social butterfly", short: "Butterfly", icon: Users, note: "Outward energy, high desire to connect." },
          { k: "Socially neutral", short: "Neutral", icon: User, note: "Baseline." },
          {
            k: "The Hermit",
            short: "Hermit",
            icon: UserMinus,
            note: "Inward energy. Late-luteal withdrawal is a phase, not a personality flaw.",
          },
        ],
      },
      {
        key: "intrusive",
        label: "Intrusive Tendencies",
        icon: CloudFog,
        options: [
          { k: "Rumination", short: "Rumination", icon: Repeat },
          { k: "Body-image distortion", short: "Body image", icon: Scan },
        ],
      },
    ],
  },
  {
    key: "fuel",
    title: "Fuel Needs",
    caption: "Cravings & energy input",
    purpose: "Metabolic shifts and blood sugar crashes — read as signals, never as failures of discipline.",
    accent: T.olive,
    groups: [
      {
        key: "cravings",
        label: "Primary Cravings",
        icon: Candy,
        options: [
          {
            k: "Sweet / sugar",
            short: "Sweet",
            icon: Candy,
            note: "Progesterone crash — your brain is seeking serotonin.",
          },
          { k: "Salty / savory", short: "Salty", icon: Soup, note: "Electrolyte and mineral depletion." },
          { k: "Heavy carbs / comfort", short: "Carbs", icon: Sandwich, note: "Quick energy seeking." },
          { k: "High fat / rich", short: "Rich / fat", icon: Beef, note: "Satiety seeking." },
        ],
      },
      {
        key: "appetite",
        label: "Appetite",
        icon: UtensilsCrossed,
        single: true,
        options: [
          { k: "Normal baseline", short: "Baseline", icon: Equal },
          {
            k: "Bottomless pit",
            short: "Bottomless",
            icon: Utensils,
            note: "Your luteal burn is real. The Buffer exists for exactly this.",
          },
          { k: "Loss of appetite / queasy", short: "No appetite", icon: Ban },
        ],
      },
      {
        key: "stimulant",
        label: "Stimulant & Hydration",
        icon: Coffee,
        options: [
          {
            k: "Craving extra caffeine",
            short: "Caffeine",
            icon: CupSoda,
            note: "Usually masking fatigue rather than fixing it.",
          },
          { k: "Thirsty / dehydrated", short: "Thirsty", icon: GlassWater, note: "Electrolyte imbalance." },
        ],
      },
    ],
  },
];

/** Watercolor orbs overlapped into the triad mark — rebuilt from the
 *  individual icons so it stays crisp at any size. */
/** The three orbs share one isolated cream plate so they blend into each
 *  other rather than each punching an opaque hole in the dark screen. */
const TriadVenn = () => (
  <div
    className="mx-auto rounded-[24px] flex items-center justify-center"
    style={{
      width: 248,
      height: 200,
      background: T.canvasWarm,
      border: `1px solid ${T.hair}`,
      isolation: "isolate",
    }}
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
const readSignals = (log, state) => {
  const has = (g, k) => (log[g] || []).includes(k);
  const count = (g) => (log[g] || []).length;
  const out = [];

  const heavyLoad =
    has("flow", "Heavy") ||
    has("flow", "Clots") ||
    has("fatigue", "Bone-deep exhaustion") ||
    count("pain") + count("fatigue") >= 4;

  if (heavyLoad)
    out.push({
      key: "deload",
      icon: LifeBuoy,
      title: "Today asks for less.",
      body: "Your load is high enough that pushing costs more than it returns. Swap the session for ten quiet minutes — it still counts as done.",
      action: "Pivot to the 10-Minute Bailout",
      onAction: null,
    });

  if (has("social", "The Hermit"))
    out.push({
      key: "hermit",
      icon: Users,
      title: "Your social battery is flat.",
      body: "Late-luteal withdrawal is chemistry, not a character flaw. Protect the quiet — cancel the optional thing without the guilt tax.",
    });

  if (has("intrusive", "Body-image distortion"))
    out.push({
      key: "hide",
      icon: EyeOff,
      title: "The mirror is lying today.",
      body: "Distortion peaks with hormonal shifts. You can put the numbers away and let the data keep working underneath.",
      action: state.hideNumbers ? "Numbers are hidden" : "Hide numbers for now",
      onAction: state.hideNumbers ? null : { hideNumbers: true },
    });

  if (has("appetite", "Bottomless pit"))
    out.push({
      key: "buffer",
      icon: Salad,
      title: "Your burn is genuinely higher.",
      body: "The luteal phase costs more energy. Eating to that is the plan working, not the plan breaking.",
      action: state.buffer ? "Buffer active" : "Activate Luteal Buffer",
      onAction: state.buffer ? null : { buffer: true },
    });

  return out;
};

const PillarSection = ({ pillar, log, open, onToggleOpen, onPick }) => {
  const c = tone(true);
  const selectedCount = pillar.groups.reduce((n, g) => n + (log[g.key] || []).length, 0);

  return (
    <div
      className="rounded-[22px] mb-3 overflow-hidden"
      style={{ background: c.surface, border: `1px solid ${c.hair}`, backdropFilter: "blur(8px)" }}
    >
      <button
        onClick={onToggleOpen}
        className="w-full px-4 py-4 flex items-center gap-3.5 text-left sel-press"
        aria-expanded={open}
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
          >
            {selectedCount}
          </span>
        )}
        <ChevronDown
          size={17}
          color={c.textSoft}
          strokeWidth={1.7}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        />
      </button>

      {open && (
        <div className="px-4 pb-5 sel-rise">
          <p className="sel-sans text-[12px] mb-5" style={{ color: c.textSoft, lineHeight: 1.5 }}>
            {pillar.purpose}
          </p>

          {pillar.groups.map((g) => {
            const picked = log[g.key] || [];
            const notes = g.options.filter((o) => o.note && picked.includes(o.k));

            return (
              <div key={g.key} className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <g.icon size={15} color={c.text} strokeWidth={1.6} />
                  <span className="sel-eyebrow sel-sans" style={{ color: c.textSoft }}>
                    {g.label}
                  </span>
                  {g.single && (
                    <span className="sel-sans text-[10px]" style={{ color: c.textFaint }}>
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

const TriadTracker = ({ state, set }) => {
  const [open, setOpen] = useState("physical");
  const c = tone(true);
  const log = state.triad;

  const pick = (group, key) => {
    const cur = log[group.key] || [];
    const nextForGroup = group.single
      ? cur.includes(key)
        ? []
        : [key]
      : cur.includes(key)
      ? cur.filter((x) => x !== key)
      : [...cur, key];

    set({ triad: { ...log, [group.key]: nextForGroup } });
  };

  const signals = readSignals(log, state);
  const total = Object.values(log).reduce((n, v) => n + v.length, 0);

  return (
    <div className="sel-rise">
      <div className="flex items-center justify-between mb-7">
        <IconBtn label="Back" dark>
          <ChevronLeft size={17} color={c.text} />
        </IconBtn>
        <Eyebrow step={3} dark>
          Triad Tracker
        </Eyebrow>
        <button className="sel-sans text-[13px] font-medium sel-press" style={{ color: c.text }}>
          Save
        </button>
      </div>

      <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: c.text }}>
        How's your
        <br />
        reality today?
      </h1>
      <p className="sel-sans text-[13.5px] mb-7" style={{ color: c.textSoft, lineHeight: 1.55, maxWidth: 265 }}>
        Log what's true. The plan adapts around it — nothing here is scored.
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

      {/* Signals — what the log just unlocked. Offered, never forced. */}
      {signals.length > 0 && (
        <div className="mt-7">
          <SectionLabel dark>What this means today</SectionLabel>
          <div className="flex flex-col gap-3">
            {signals.map(({ key, icon: Icon, title, body, action, onAction }) => (
              <div
                key={key}
                className="rounded-[18px] px-5 py-4"
                style={{ background: T.aegean, border: `1px solid ${c.hair}` }}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <Icon size={15} color={T.canvas} strokeWidth={1.6} />
                  </span>
                  <div className="flex-1">
                    <p className="sel-sans text-[13px] font-semibold mb-1" style={{ color: T.canvas }}>
                      {title}
                    </p>
                    <p className="sel-sans text-[12px]" style={{ color: "rgba(247,244,238,0.72)", lineHeight: 1.5 }}>
                      {body}
                    </p>
                    {action && (
                      <button
                        onClick={() => onAction && set(onAction)}
                        disabled={!onAction}
                        className="sel-sans rounded-full px-4 py-[9px] text-[12px] font-medium mt-3 sel-press flex items-center gap-1.5"
                        style={{
                          background: onAction ? "rgba(255,255,255,0.13)" : "transparent",
                          border: `1px solid rgba(247,244,238,${onAction ? 0.3 : 0.18})`,
                          color: onAction ? T.canvas : "rgba(247,244,238,0.55)",
                        }}
                      >
                        {!onAction && <Check size={13} />}
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

      <div className="mt-7">
        <Button>Save Entry</Button>
        <p className="sel-sans text-[11.5px] text-center mt-3" style={{ color: c.textFaint }}>
          {total === 0 ? "Nothing logged yet — even that is data." : `${total} signal${total === 1 ? "" : "s"} logged today.`}
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

    <Plate height={224} radius={24} className="mb-6" src={IMG_FOREST} alt="Movement and recovery" />

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
    img: IMG,
  },
  {
    title: "Heavy Flow Detected",
    body: "Iron-rich foods can help replenish what your body is losing. Try a warm stew with lentils and dark leafy greens.",
    img: IMG_BLOOM_RED,
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
          <img src={IMG_MEDITATE} alt="Luteal buffer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
      {FOCUS_CARDS.map(({ title, body, img }, i) => (
        <Card key={title} className="px-4 py-4 flex gap-3.5 items-start">
          <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden flex-shrink-0">
            <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
    triad: {
      flow: ["Heavy"],
      pain: ["Uterine cramps"],
      cognition: ["Brain fog"],
      cravings: ["Heavy carbs / comfort"],
    },
  });

  const setOn = (patch) => setOnboarding((p) => ({ ...p, ...patch }));
  const setApp_ = (patch) => setApp((p) => ({ ...p, ...patch }));

  const onboardingScreens = [
    <Welcome key="0" next={() => setStep(1)} />,
    <VibeCheck key="1" data={onboarding} set={setOn} next={() => setStep(2)} back={() => setStep(0)} />,
    <BiologicalBaseline key="2" data={onboarding} set={setOn} next={() => setStep(3)} back={() => setStep(1)} />,
    <NutritionPhilosophy key="3" data={onboarding} set={setOn} next={() => setStep(4)} back={() => setStep(2)} />,
    <RealityCheck key="4" next={() => setPhase("app")} back={() => setStep(3)} />,
  ];

  const screenBg = phase === "onboarding" ? ONBOARDING_BG[step] : APP_BG[tab];

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
          position: "relative",
        }}
      >
        {screenBg && (
          <div
            key={phase === "onboarding" ? `on-${step}` : `app-${tab}`}
            aria-hidden="true"
            className="sel-bg-fade"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `${screenBg.scrim}, url("${screenBg.img}")`,
              backgroundSize: "cover, cover",
              backgroundPosition: "center, center",
            }}
          />
        )}

        <div
          className="flex-1 overflow-y-auto sel-scroll px-6 pt-7 pb-7"
          style={{ position: "relative", zIndex: 1 }}
        >
          {phase === "onboarding" ? onboardingScreens[step] : tabs[tab]}
        </div>

        {phase === "app" && <BottomNav tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}
