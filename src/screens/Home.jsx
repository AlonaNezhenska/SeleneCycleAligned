import React, { useRef } from "react";
import { ShieldCheck, Leaf, Check, ArrowRight, Users, User, UserMinus, TrendingUp, Pause } from "lucide-react";
import { T } from "../theme/tokens.js";
import { MODES, UI_COPY, timeline, streak, STATUS } from "../engine/index.js";
import { IconBtn, Card, Button, SectionLabel, Instruction, IMG } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   2. THE HOME SANCTUARY
   --------------------------------------------------------------- */

export const MODE_STYLE = {
  Inward: { caption: "Rest", ring: T.aegean },
  Steady: { caption: "Baseline", ring: T.sage },
  Outward: { caption: "High energy", ring: T.terracotta },
};

/** The Imprint Zone — a third of the screen, one affirmation, no digits. */
const ImprintZone = ({ text }) => (
  <section
    aria-label="Today's imprint"
    className="relative rounded-[24px] overflow-hidden mb-7 flex items-end"
    style={{ height: "33vh", minHeight: 220, maxHeight: 268, border: `1px solid ${T.hair}` }}
  >
    <img src={IMG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ background: "linear-gradient(180deg, rgba(42,38,34,0.05) 20%, rgba(31,58,95,0.88) 100%)" }}
    />
    <p className="sel-serif relative px-6 pb-6" style={{ fontSize: 27, lineHeight: 1.2, color: T.canvas }}>
      {text}
    </p>
  </section>
);

/** Vibe Check — a real radio group: one tab stop, arrows move the choice. */
export const VibeCheck = ({ value, onChange }) => {
  const refs = useRef([]);
  const focusIndex = Math.max(0, MODES.indexOf(value));

  const onKeyDown = (e, i) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + MODES.length) % MODES.length;
    onChange(MODES[next]);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-labelledby="vibe-label" className="flex justify-between mb-7">
      {MODES.map((key, i) => {
        const on = value === key;
        const { caption, ring } = MODE_STYLE[key];
        return (
          <button
            type="button"
            key={key}
            ref={(el) => (refs.current[i] = el)}
            role="radio"
            aria-checked={on}
            tabIndex={i === focusIndex ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="flex flex-col items-center gap-2 sel-press rounded-[18px] py-1"
            style={{ width: 96 }}
          >
            <span
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{
                width: 76,
                height: 76,
                padding: on ? 4 : 3,
                background: on ? ring : "transparent",
                border: on ? "none" : `1.5px solid ${T.hair}`,
              }}
            >
              <img
                src={IMG}
                alt=""
                aria-hidden="true"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 999,
                  filter: on ? "none" : "grayscale(0.55) opacity(0.75)",
                }}
              />
            </span>
            <span className="text-center leading-tight">
              <span className="sel-sans text-[12.5px] block" style={{ color: T.ink, fontWeight: on ? 600 : 500 }}>
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
  );
};

const Chip = ({ on, onClick, icon: Icon, children }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className="sel-sans rounded-full px-3.5 text-[12.5px] font-medium sel-press flex items-center gap-1.5"
    style={{
      background: on ? T.aegean : T.canvas,
      color: on ? T.canvas : T.ink,
      border: `1px solid ${on ? T.aegean : T.hair}`,
    }}
  >
    <Icon size={14} aria-hidden="true" />
    {children}
  </button>
);

/** Late Luteal Fork — the expanded check-in for the last days. */
const ForkCheckIn = ({ fork, checkIn, onChange }) => {
  const set = (patch) => onChange({ ...checkIn, ...patch });
  return (
    <Card className="px-5 py-5 mb-7" style={{ background: T.canvasDeep }}>
      <p className="sel-sans text-[13.5px] font-medium mb-1" style={{ color: T.ink }}>
        A quick extra check-in
      </p>
      <p className="sel-sans text-[12.5px] mb-4" style={{ color: T.inkSoft, lineHeight: 1.5 }}>
        {UI_COPY.forkPrompt}
      </p>

      <p className="sel-eyebrow sel-sans mb-2">Social battery</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <Chip icon={Users} on={checkIn.social === "butterfly"} onClick={() => set({ social: "butterfly" })}>
          Butterfly
        </Chip>
        <Chip icon={User} on={checkIn.social === "neutral"} onClick={() => set({ social: "neutral" })}>
          Neutral
        </Chip>
        <Chip icon={UserMinus} on={checkIn.social === "hermit"} onClick={() => set({ social: "hermit" })}>
          The Hermit
        </Chip>
      </div>

      <p className="sel-eyebrow sel-sans mb-2">Drive</p>
      <div className="flex flex-wrap gap-2">
        <Chip icon={TrendingUp} on={checkIn.drive === "high"} onClick={() => set({ drive: "high" })}>
          Ready to push
        </Chip>
        <Chip icon={Pause} on={checkIn.drive === "low"} onClick={() => set({ drive: "low" })}>
          Running low
        </Chip>
      </div>

      {fork.path && (
        <p role="status" className="sel-serif italic mt-4" style={{ fontSize: 15, color: T.ink }}>
          {fork.path === "wipeout" ? UI_COPY.wipeout : UI_COPY.surge}
        </p>
      )}
    </Card>
  );
};

/** Prescription card — what today asks for, in one glance. */
export const PrescriptionCard = ({ ctx, onOpen }) => {
  const p = ctx.prescription;
  const { ring } = MODE_STYLE[p.mode];
  return (
    <Card className="px-5 py-5 mb-7" aria-label="Today's prescription" role="region">
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-full" style={{ width: 8, height: 8, background: ring }} aria-hidden="true" />
        <span className="sel-eyebrow sel-sans">Today · {p.mode}</span>
      </div>
      <p className="sel-serif" style={{ fontSize: 21, lineHeight: 1.25, color: T.ink }}>
        {p.title}
      </p>
      <p className="sel-sans text-[13px] mt-1 mb-3" style={{ color: T.inkSoft, lineHeight: 1.5 }}>
        {p.summary}
      </p>
      <Instruction topic="prescription" />
      <div className="mt-3">
        <Button tone="outline" size="sm" full={false} onClick={onOpen}>
          <span className="flex items-center gap-1.5">
            Open the plan <ArrowRight size={14} aria-hidden="true" />
          </span>
        </Button>
      </div>
    </Card>
  );
};

/** Streak of green checks. Paused days are hollow and never break it. */
const Streak = ({ history }) => {
  const days = timeline(history);
  const count = streak(history);
  return (
    <section aria-label="Your streak">
      <SectionLabel>Showing up</SectionLabel>
      <div className="flex justify-between mb-2">
        {days.map((s, i) => (
          <span
            key={i}
            aria-label={s === STATUS.DONE ? "Done" : "Paused"}
            role="img"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={
              s === STATUS.DONE
                ? { background: T.sage }
                : { border: `1.5px dashed ${T.inkSoft}` }
            }
          >
            {s === STATUS.DONE && <Check size={17} color={T.canvas} strokeWidth={2.4} aria-hidden="true" />}
          </span>
        ))}
      </div>
      <p className="sel-sans text-[12px]" style={{ color: T.inkSoft }}>
        {count} days of showing up. Paused days wait for you.
      </p>
    </section>
  );
};

export const Home = ({ ctx, today, setToday, history, goTo }) => (
  <div className="sel-rise">
    <div className="flex items-center justify-between mb-6">
      <div className="w-11" />
      <span className="sel-serif text-[19px] flex items-center gap-1.5" style={{ color: T.ink }}>
        <Leaf size={14} strokeWidth={1.5} aria-hidden="true" /> Selena
      </span>
      <IconBtn label="Privacy & data" onClick={() => goTo("privacy")}>
        <ShieldCheck size={17} color={T.ink} strokeWidth={1.6} />
      </IconBtn>
    </div>

    <ImprintZone text={ctx.affirmation} />

    <div className="flex items-baseline justify-between mb-1">
      <p id="vibe-label" className="sel-sans text-[13.5px] font-medium" style={{ color: T.ink }}>
        Vibe Check
      </p>
      {today.vibe && (
        <button
          type="button"
          onClick={() => setToday({ vibe: null })}
          className="sel-sans text-[12px] underline"
          style={{ color: T.inkSoft }}
        >
          Let the rhythm decide
        </button>
      )}
    </div>
    <p className="sel-sans text-[12.5px] mb-4" style={{ color: T.inkSoft, lineHeight: 1.5 }}>
      {ctx.promptVibeCheck ? UI_COPY.vibePrompt : "Where is your energy going today?"}
    </p>
    <VibeCheck value={today.vibe ?? (ctx.promptVibeCheck ? null : ctx.mode)} onChange={(vibe) => setToday({ vibe })} />

    {ctx.fork && !today.vibe && (
      <ForkCheckIn fork={ctx.fork} checkIn={today.checkIn} onChange={(checkIn) => setToday({ checkIn })} />
    )}

    <PrescriptionCard ctx={ctx} onOpen={() => goTo("workouts")} />

    <Streak history={history} />
  </div>
);
