import React from "react";
import { Eye, EyeOff, Heart, Salad, Activity, Check, Beef } from "lucide-react";
import { T } from "../theme/tokens.js";
import { maskValue, applyBuffer, MASK } from "../engine/index.js";
import { Eyebrow, Card, SectionLabel, Instruction, IMG, IMG_BLOOM_RED, IMG_MEDITATE } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   6. THE FUEL ENGINE
   --------------------------------------------------------------- */

const KCAL_TARGET = 1850;
const KCAL_EATEN = 1070;

const FOCUS_CARDS = [
  {
    title: "Brain fog + sugar craving",
    body: "Try dark chocolate and pumpkin seeds: magnesium your body is asking for right now.",
    img: IMG,
  },
  {
    title: "Heavy flow",
    body: "Iron-rich foods help replenish what your body is losing. Try a warm stew with lentils and dark leafy greens.",
    img: IMG_BLOOM_RED,
  },
];

const fmt = (n) => n.toLocaleString("en-GB");

const ProgressMeter = ({ icon: Icon, label, value, pct, hidden }) => (
  <div className="flex items-center gap-3.5">
    <span className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: T.canvasDeep }}>
      <Icon size={17} color={T.ink} strokeWidth={1.5} aria-hidden="true" />
    </span>
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-[7px]">
        <span className="sel-sans text-[12.5px] font-medium" style={{ color: T.ink }}>
          {label}
        </span>
        <span
          className="sel-sans text-[12.5px] tabular-nums"
          style={{ color: T.inkSoft, letterSpacing: hidden ? "0.12em" : 0 }}
          data-testid={`meter-${label}`}
        >
          {maskValue(value, hidden)}
        </span>
      </div>
      <div className="h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(42,38,34,0.09)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: T.sage }} />
      </div>
    </div>
  </div>
);

export const Fuel = ({ ctx, fuel, setFuel, trackingStyle }) => {
  const hidden = fuel.hideNumbers;
  const target = applyBuffer(KCAL_TARGET, ctx.buffer, fuel.bufferAccepted);
  const kcal = target.max === target.base ? `${fmt(KCAL_EATEN)} / ${fmt(target.base)} kcal` : `${fmt(KCAL_EATEN)} / ${fmt(target.min)}–${fmt(target.max)} kcal`;
  const plates = trackingStyle === "Visual plates";

  return (
    <div className="sel-rise">
      <div className="flex items-center justify-between mb-7">
        <Eyebrow>Fuel Engine</Eyebrow>
        <button
          type="button"
          onClick={() => setFuel({ hideNumbers: !hidden })}
          aria-pressed={hidden}
          className="flex items-center gap-1.5 sel-press rounded-full px-3.5"
          style={{ background: T.canvasDeep }}
        >
          {hidden ? <EyeOff size={14} color={T.inkSoft} aria-hidden="true" /> : <Eye size={14} color={T.inkSoft} aria-hidden="true" />}
          <span className="sel-sans text-[12px]" style={{ color: T.ink }}>
            Hide numbers
          </span>
        </button>
      </div>

      {/* Luteal Buffer — offered, never applied on its own */}
      {ctx.buffer && !fuel.bufferDismissed && (
        <Card className="px-5 py-5 mb-6" role="region" aria-label="Luteal Buffer">
          <div className="flex gap-4">
            <div className="w-[54px] h-[54px] rounded-[15px] overflow-hidden flex-shrink-0">
              <img src={IMG_MEDITATE} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="flex-1">
              <p className="sel-serif" style={{ fontSize: 17, lineHeight: 1.3, color: T.ink }}>
                Your body is burning slightly more energy today.
              </p>
              <p className="sel-sans text-[12.5px] mt-2 mb-3" style={{ color: T.inkSoft }}>
                Optional Luteal Buffer:{" "}
                {hidden ? `+${MASK} kcal` : `+${ctx.buffer.min}–${ctx.buffer.max} kcal`}
              </p>
              <Instruction topic="lutealBuffer" />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setFuel({ bufferAccepted: !fuel.bufferAccepted })}
                  aria-pressed={fuel.bufferAccepted}
                  className="sel-sans rounded-full px-4 text-[12.5px] font-medium sel-press flex items-center gap-1.5"
                  style={{ background: T.sage, color: T.canvas }}
                >
                  {fuel.bufferAccepted && <Check size={13} aria-hidden="true" />}
                  {fuel.bufferAccepted ? "Buffer on today" : "Use the buffer"}
                </button>
                {!fuel.bufferAccepted && (
                  <button
                    type="button"
                    onClick={() => setFuel({ bufferDismissed: true })}
                    className="sel-sans text-[12.5px] sel-press px-3"
                    style={{ color: T.inkSoft }}
                  >
                    Not today
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="px-5 py-5 mb-6">
        <SectionLabel>Today so far</SectionLabel>
        <div className="flex flex-col gap-4 mt-1">
          {plates ? (
            <ProgressMeter icon={Salad} label="Plates" value="2 / 4 plates" pct={50} hidden={hidden} />
          ) : (
            <ProgressMeter icon={Salad} label="Energy" value={kcal} pct={58} hidden={hidden} />
          )}
          <ProgressMeter icon={Beef} label="Protein" value="62 / 110 g" pct={56} hidden={hidden} />
          <ProgressMeter icon={Activity} label="Movement" value="0 / 45 min" pct={0} hidden={hidden} />
        </div>
      </Card>

      <SectionLabel>Today's focus</SectionLabel>
      <div className="flex flex-col gap-3 mb-6">
        {FOCUS_CARDS.map(({ title, body, img }, i) => {
          const saved = !!fuel.saved?.[i];
          return (
            <Card key={title} className="px-4 py-4 flex gap-3.5 items-start">
              <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden flex-shrink-0">
                <img src={img} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div className="flex-1">
                <p className="sel-sans text-[13px] font-semibold mb-1" style={{ color: T.ink }}>
                  {title}
                </p>
                <p className="sel-sans text-[12.5px]" style={{ color: T.inkSoft, lineHeight: 1.5 }}>
                  {body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFuel({ saved: { ...fuel.saved, [i]: !saved } })}
                className="sel-press flex-shrink-0 flex items-center justify-center rounded-full"
                aria-label={`Save suggestion: ${title}`}
                aria-pressed={saved}
              >
                <Heart size={17} strokeWidth={1.6} color={saved ? T.terracotta : T.inkSoft} fill={saved ? T.terracotta : "none"} aria-hidden="true" />
              </button>
            </Card>
          );
        })}
      </div>

      <div className="rounded-[18px] px-5 py-4 flex items-start gap-3.5" style={{ background: T.canvasDeep }}>
        <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: T.canvas }}>
          <Salad size={15} color={T.sage} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <p className="sel-sans text-[12.5px]" style={{ color: T.inkSoft, lineHeight: 1.55 }}>
          Eating more on a hungry day is your body doing its job. Your target only moves if you choose the buffer.
        </p>
      </div>
    </div>
  );
};
