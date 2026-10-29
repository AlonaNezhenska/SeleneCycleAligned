import React, { useEffect, useState } from "react";
import { ChevronLeft, Camera, Check, Leaf, Sun, Moon, Waves, CloudFog, Candy, ArrowRight } from "lucide-react";
import { T, tone } from "../theme/tokens.js";
import { MIN_LENGTH, MAX_LENGTH } from "../engine/phase.js";
import { Eyebrow, IconBtn, Button, Card, Tile, ToggleRow, Dots, Plate, IMG_VAULT } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   1. ONBOARDING — the Sanctuary Gateway

   Each step owns its backdrop and alternates dark/light so the flow
   breathes: hero → pink wash → deep green → soft light → dark vault.
   The scrim sits above the photo to guarantee text contrast.
   --------------------------------------------------------------- */

export const ONBOARDING_BG = [
  {
    img: "/assets/hero-moon-woman.png",
    scrim:
      "linear-gradient(180deg, rgba(20,28,26,0.30) 0%, rgba(20,28,26,0.10) 38%, rgba(16,22,20,0.72) 78%, rgba(16,22,20,0.88) 100%)",
  },
  {
    img: "/assets/wash-pink-ombre.jpg",
    scrim:
      "linear-gradient(180deg, rgba(250,244,238,0.70) 0%, rgba(250,240,236,0.55) 50%, rgba(250,238,235,0.45) 100%)",
  },
  {
    img: "/assets/forest-deep.jpg",
    scrim:
      "linear-gradient(180deg, rgba(18,30,24,0.80) 0%, rgba(16,26,22,0.88) 55%, rgba(14,22,19,0.93) 100%)",
  },
  {
    img: "/assets/wash-pink-soft.jpg",
    scrim:
      "linear-gradient(180deg, rgba(250,245,240,0.76) 0%, rgba(249,241,238,0.62) 55%, rgba(248,238,236,0.52) 100%)",
  },
  {
    img: "/assets/marble-dark-green.jpg",
    scrim:
      "linear-gradient(180deg, rgba(16,26,32,0.82) 0%, rgba(14,24,30,0.89) 60%, rgba(12,20,26,0.94) 100%)",
  },
];

const HURDLES = [
  { key: "Cramps", icon: Waves },
  { key: "Brain fog", icon: CloudFog },
  { key: "Cravings", icon: Candy },
];

/** A spectrum from most to least numeric. */
export const TRACKING_STYLES = [
  { key: "Exact macros", sub: "Track every macro with precision" },
  { key: "Protein & Calories only", sub: "Keep it simple and high level" },
  { key: "Visual plates", sub: "Use portion-based visual guidance" },
];

const StepHeader = ({ step, label, back, dark = false }) => (
  <div className="flex items-center justify-between mb-7">
    <IconBtn onClick={back} label="Back" dark={dark}>
      <ChevronLeft size={17} color={tone(dark).text} />
    </IconBtn>
    <Eyebrow step={step} dark={dark}>
      {label}
    </Eyebrow>
    <div className="w-11" />
  </div>
);

const Footer = ({ step, back, next, dark = false, nextLabel = "Next" }) => (
  <div className="mt-auto pt-6">
    <div className="flex gap-3 mb-6">
      <Button tone="outline" full={false} onClick={back} dark={dark}>
        Back
      </Button>
      <div className="flex-1">
        <Button onClick={next}>{nextLabel}</Button>
      </div>
    </div>
    <Dots total={4} active={step} dark={dark} />
  </div>
);

/* ---- 1.0 Welcome — full-bleed moonlit hero, text sits on the art ---- */
const Welcome = ({ next }) => (
  <div className="flex flex-col h-full sel-rise">
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <Leaf size={15} color={T.canvas} strokeWidth={1.5} aria-hidden="true" />
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
      <p className="sel-sans text-[14px] mt-4 mb-9" style={{ color: "rgba(242,239,230,0.86)", lineHeight: 1.5, maxWidth: 230 }}>
        A sanctuary for your body, mind and energy.
      </p>
      <Button tone="outline" dark onClick={next}>
        <span className="flex items-center justify-center gap-2">
          Get started <ArrowRight size={16} aria-hidden="true" />
        </span>
      </Button>
    </div>
  </div>
);

/* ---- 1.1 Intention ---- */
const Intention = ({ data, set, next, back }) => (
  <div className="flex flex-col h-full sel-rise">
    <StepHeader step={1} label="Onboarding" back={back} />

    <h1 className="sel-serif mb-3" style={{ fontSize: 30, lineHeight: 1.2, color: T.ink }}>
      How do you want
      <br />
      to feel in a few months?
    </h1>
    <p className="sel-sans text-[13.5px] mb-9" style={{ color: T.inkSoft, lineHeight: 1.55, maxWidth: 265 }}>
      This is about your energy, mood and overall wellbeing, not just numbers.
    </p>

    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Your intention">
      {[
        { label: "Stronger", icon: Sun, accent: T.terracotta },
        { label: "Less exhausted", icon: Leaf, accent: T.sage },
        { label: "In tune with my body", icon: Moon, accent: T.aegean },
      ].map(({ label, icon: Icon, accent }) => {
        const on = data.goal === label;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={on}
            key={label}
            onClick={() => set({ goal: label })}
            className="rounded-full py-[13px] px-6 flex items-center gap-3.5 sel-press sel-sans text-[15px]"
            style={{
              background: on ? accent : T.canvas,
              color: on ? T.canvas : T.ink,
              border: `1.5px solid ${on ? accent : T.hair}`,
              fontWeight: on ? 600 : 500,
            }}
          >
            <Icon size={18} strokeWidth={1.6} color={on ? T.canvas : T.ink} aria-hidden="true" />
            <span className="flex-1 text-left">{label}</span>
            {on && <Check size={16} aria-hidden="true" />}
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

/* ---- 1.2 Biological Baseline — Age Fork, birth control, cycle ---- */
const fieldStyle = (c) => ({
  background: "rgba(242,239,230,0.08)",
  border: `1px solid ${c.hair}`,
  color: c.text,
  colorScheme: "dark",
});

const BiologicalBaseline = ({ data, set, next, back }) => {
  const c = tone(true);
  const toggleHurdle = (k) =>
    set({ hurdles: data.hurdles.includes(k) ? data.hurdles.filter((h) => h !== k) : [...data.hurdles, k] });

  return (
    <div className="flex flex-col h-full sel-rise">
      <StepHeader step={2} label="Your cycle" back={back} dark />

      <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: c.text }}>
        Let's get to know
        <br />
        your cycle.
      </h1>
      <p className="sel-sans text-[13.5px] mb-7" style={{ color: c.textSoft, lineHeight: 1.55, maxWidth: 260 }}>
        This helps us understand your unique rhythm (and not guess).
      </p>

      <ToggleRow
        dark
        label="Which decade are you in?"
        sublabel="This sets how hard strength sets go and your recovery load."
        value={data.ageGroup === "40+"}
        onChange={(v) => set({ ageGroup: v ? "40+" : "20s/30s" })}
        leftLabel="20s / 30s"
        rightLabel="40+"
      />

      <ToggleRow
        dark
        label="Hormonal birth control"
        sublabel="If yes, we follow how you feel instead of the calendar."
        value={data.onBirthControl}
        onChange={(v) => set({ onBirthControl: v })}
        leftLabel="No"
        rightLabel="Yes"
      />

      <div className="grid grid-cols-2 gap-3 mt-2 mb-5">
        <div>
          <label htmlFor="last-period" className="sel-sans text-[13px] font-medium mb-2 block" style={{ color: c.text }}>
            Last period started
          </label>
          <input
            id="last-period"
            type="date"
            value={data.lastPeriod}
            onChange={(e) => e.target.value && set({ lastPeriod: e.target.value })}
            className="sel-sans w-full rounded-[14px] px-3 text-[14px]"
            style={fieldStyle(c)}
          />
        </div>
        <div>
          <label htmlFor="cycle-length" className="sel-sans text-[13px] font-medium mb-2 block" style={{ color: c.text }}>
            Cycle length (days)
          </label>
          <input
            id="cycle-length"
            type="number"
            inputMode="numeric"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={data.cycleLength}
            onChange={(e) => set({ cycleLength: Number(e.target.value) })}
            className="sel-sans w-full rounded-[14px] px-3 text-[14px]"
            style={fieldStyle(c)}
          />
        </div>
      </div>

      <p className="sel-sans text-[13px] font-medium mb-1" style={{ color: c.text }} id="hurdle-label">
        What is your hardest hurdle?
      </p>
      <p className="sel-sans text-[12px] mb-3" style={{ color: c.textSoft }}>
        Choose as many as apply.
      </p>
      <div className="grid grid-cols-3 gap-2.5" role="group" aria-labelledby="hurdle-label">
        {HURDLES.map(({ key, icon }) => (
          <Tile key={key} icon={icon} label={key} dark selected={data.hurdles.includes(key)} onClick={() => toggleHurdle(key)} />
        ))}
      </div>

      <Footer step={1} back={back} next={next} dark />
    </div>
  );
};

/* ---- 1.3 Tracking style ---- */
const TrackingStyle = ({ data, set, next, back }) => (
  <div className="flex flex-col h-full sel-rise">
    <StepHeader step={3} label="Onboarding" back={back} />

    <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: T.ink }}>
      How do you prefer
      <br />
      to track nutrition?
    </h1>
    <p className="sel-sans text-[13.5px] mb-8" style={{ color: T.inkSoft, lineHeight: 1.55, maxWidth: 265 }}>
      Choose what feels good for you. You can always change this later.
    </p>

    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Tracking style">
      {TRACKING_STYLES.map(({ key, sub }) => {
        const on = data.trackingStyle === key;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={on}
            key={key}
            onClick={() => set({ trackingStyle: key })}
            className="rounded-[20px] px-5 py-[15px] flex items-center gap-4 text-left sel-press"
            style={{ background: on ? T.canvasDeep : T.canvas, border: `1.5px solid ${on ? T.sage : T.hair}` }}
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
              <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.sage }}>
                <Check size={13} color={T.canvas} aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>

    <Footer step={2} back={back} next={next} />
  </div>
);

/* ---- 1.4 Baseline photo — Polaroid, private, face softened ---- */

/** The face is softened by blurring the upper band of the frame, where a
 *  face sits in a standard mirror photo. Real face detection would replace
 *  this before launch. */
const Polaroid = ({ src }) => (
  <figure
    className="mx-auto p-3 pb-12"
    style={{ width: 236, background: T.canvas, borderRadius: 6, boxShadow: "0 14px 32px rgba(0,0,0,0.35)", transform: "rotate(-2deg)" }}
  >
    {src ? (
      <div className="relative overflow-hidden" style={{ height: 250, borderRadius: 2 }}>
        <img src={src} alt="Your baseline photo, face softened" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-0"
          style={{ height: "42%", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
        />
      </div>
    ) : (
      <Plate height={250} radius={2} src={IMG_VAULT} alt="Empty baseline photo frame" />
    )}
    <figcaption className="sel-serif italic text-center mt-3" style={{ fontSize: 15, color: T.ink }}>
      Scales lie. This won't.
    </figcaption>
  </figure>
);

const BaselinePhoto = ({ data, set, next, back }) => {
  const c = tone(true);
  const [src, setSrc] = useState(null);

  useEffect(() => () => src && URL.revokeObjectURL(src), [src]);

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    set({ hasBaselinePhoto: true });
  };

  return (
    <div className="flex flex-col h-full sel-rise">
      <StepHeader step={4} label="Baseline photo" back={back} dark />

      <h1 className="sel-serif mb-3" style={{ fontSize: 28, lineHeight: 1.22, color: c.text }}>
        Scales lie.
        <br />
        Mirrors remember.
      </h1>
      <p className="sel-sans text-[13.5px] mb-7" style={{ color: c.textSoft, maxWidth: 270, lineHeight: 1.55 }}>
        An optional photo to look back on. Progress shows up in how you move and feel long before a number does.
      </p>

      <Polaroid src={src} />

      <p className="sel-sans text-[12px] text-center mt-5 mb-6" style={{ color: c.textSoft }}>
        Stays on this device. Your face is blurred automatically.
      </p>

      <div className="flex flex-col gap-3">
        <label
          className="sel-sans font-medium rounded-full sel-press py-[13px] px-7 text-[15px] w-full flex items-center justify-center gap-2 cursor-pointer"
          style={{ background: T.sage, color: T.canvas, minHeight: 44 }}
        >
          <Camera size={16} aria-hidden="true" /> {data.hasBaselinePhoto ? "Retake baseline photo" : "Take baseline photo"}
          <input type="file" accept="image/*" capture="user" className="sr-only" onChange={pick} />
        </label>
        <Button tone="quiet" dark onClick={next}>
          {data.hasBaselinePhoto ? "Enter the sanctuary" : "Skip for now"}
        </Button>
      </div>

      <div className="mt-auto pt-6">
        <Dots total={4} active={3} dark />
      </div>
    </div>
  );
};

export const Onboarding = ({ step, setStep, data, set, done }) => {
  const go = (n) => () => setStep(n);
  const screens = [
    <Welcome key="0" next={go(1)} />,
    <Intention key="1" data={data} set={set} next={go(2)} back={go(0)} />,
    <BiologicalBaseline key="2" data={data} set={set} next={go(3)} back={go(1)} />,
    <TrackingStyle key="3" data={data} set={set} next={go(4)} back={go(2)} />,
    <BaselinePhoto key="4" data={data} set={set} next={done} back={go(3)} />,
  ];
  return screens[step];
};
