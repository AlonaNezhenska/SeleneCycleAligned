import React, { useRef, useState } from "react";
import { T } from "../theme/tokens.js";
import { PHASES, getPhase, phaseRange, affirmationFor, wavePath, cursorX, cursorY, dayFromX, WAVE } from "../engine/index.js";
import { Eyebrow, Button } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   4. THE CYCLE RHYTHM — one wave, one cursor, no calendar grid
   --------------------------------------------------------------- */

export const PHASE_COLOR = {
  menstrual: T.aegean,
  follicular: "#7E8E6C",
  ovulatory: T.terracotta,
  earlyLuteal: T.sage,
  lateLuteal: "#6E5A7E",
};

/** The signature element: an organic bezier that reads as a body rhythm,
 *  not a data chart. Drag the cursor or use the arrow keys to explore. */
const CycleWave = ({ day, today, length, onChange }) => {
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const { width: W, height: H } = WAVE;
  const d = wavePath(length);
  const x = cursorX(day, length);
  const y = cursorY(day, length);
  const todayX = cursorX(today, length);

  const fromPointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return;
    onChange(dayFromX(((e.clientX - rect.left) / rect.width) * W, length));
  };

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) {
      e.preventDefault();
      onChange(Math.min(length, Math.max(1, day + step)));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(1);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(length);
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => dragging.current && fromPointer(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <defs>
        <linearGradient id="waveInk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.aegean} />
          <stop offset="45%" stopColor={T.terracotta} />
          <stop offset="75%" stopColor={T.sage} />
          <stop offset="100%" stopColor="#6E5A7E" />
        </linearGradient>
      </defs>

      {/* ghost trace beneath — the cycle before this one */}
      <path d={d} fill="none" stroke={T.ink} strokeWidth="1" opacity="0.1" transform="translate(0,10)" />
      <path d={d} fill="none" stroke="url(#waveInk)" strokeWidth="2.4" strokeLinecap="round" />

      {/* today's mark on the baseline */}
      <circle cx={todayX} cy={H - 10} r="3" fill={T.ink} opacity="0.55" />

      <line x1={x} y1={y} x2={x} y2={H - 12} stroke={T.ink} strokeWidth="1" strokeDasharray="2 4" opacity="0.35" />
      <g
        role="slider"
        tabIndex={0}
        aria-label="Cycle day"
        aria-valuemin={1}
        aria-valuemax={length}
        aria-valuenow={day}
        aria-valuetext={`Day ${day} of ${length}`}
        onKeyDown={onKeyDown}
        style={{ outline: "none" }}
      >
        <circle cx={x} cy={y} r="22" fill="transparent" />
        <circle cx={x} cy={y} r="11" fill={T.terracotta} opacity="0.18" />
        <circle cx={x} cy={y} r="6" fill={T.terracotta} />
        <circle cx={x} cy={y} r="2.2" fill={T.canvas} />
      </g>
    </svg>
  );
};

export const Rhythm = ({ ctx, goTo }) => {
  const [day, setDay] = useState(ctx.day);
  const phase = getPhase(day, ctx.length);
  const label = PHASES.find((p) => p.key === phase).label;
  const isToday = day === ctx.day;

  return (
    <div className="sel-rise">
      <div className="flex items-center justify-between mb-8">
        <Eyebrow>Cycle Rhythm</Eyebrow>
        {!isToday && (
          <button type="button" onClick={() => setDay(ctx.day)} className="sel-sans text-[12.5px] underline px-2" style={{ color: T.inkSoft }}>
            Back to today
          </button>
        )}
      </div>

      <h1 className="sel-serif" style={{ fontSize: 40, lineHeight: 1.05, color: T.ink }} aria-live="polite">
        {label}
      </h1>
      <p className="sel-serif italic mt-3 mb-6" style={{ fontSize: 15.5, color: T.inkSoft, lineHeight: 1.5, minHeight: 46 }}>
        {affirmationFor(phase, day)}
      </p>

      <div className="mb-2">
        <CycleWave day={day} today={ctx.day} length={ctx.length} onChange={setDay} />
      </div>
      <p className="sel-sans text-[12.5px] text-center mb-7" style={{ color: T.inkSoft }}>
        {isToday ? `Today · Day ${day} of ${ctx.length}` : `Day ${day} of ${ctx.length}`}
      </p>

      <ul className="grid grid-cols-2 gap-y-3 gap-x-3 mb-8">
        {PHASES.map(({ key, label: name }) => {
          const r = phaseRange(key, ctx.length);
          return (
            <li key={key} className="flex items-start gap-2">
              <span className="rounded-full flex-shrink-0 mt-[5px]" style={{ width: 8, height: 8, background: PHASE_COLOR[key] }} aria-hidden="true" />
              <span className="leading-tight">
                <span className="sel-sans text-[12.5px] block" style={{ color: T.ink, fontWeight: key === phase ? 600 : 400 }}>
                  {name}
                </span>
                <span className="sel-sans text-[11.5px]" style={{ color: T.inkSoft }}>
                  Days {r.start}–{r.end}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <Button onClick={() => goTo("tracker")}>Log today's reality</Button>
    </div>
  );
};
