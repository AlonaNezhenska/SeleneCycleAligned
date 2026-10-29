import React, { useRef, useState } from "react";
import { Leaf } from "lucide-react";
import { T, DARK_TEXT } from "../theme/tokens.js";
import {
  PHASES,
  getPhase,
  CAL,
  CAL_GROUPS,
  groupForPhase,
  groupRange,
  groupCenter,
  calendarPath,
  markerPoint,
  dayFromY,
} from "../engine/index.js";
import { Button } from "../ui/primitives.jsx";

/* ---------------------------------------------------------------
   4. THE CYCLE CALENDAR — phases, not just days

   Four painted glows on forest green, joined by one thin contour.
   The artwork stays as artwork; only the marker, the active glow
   and the labels are live.
   --------------------------------------------------------------- */

const GLOW = {
  menstruation: "/assets/cycle/menstruation-glow.png",
  follicular: "/assets/cycle/follicular-glow.png",
  ovulation: "/assets/cycle/ovulation-glow.png",
  luteal: "/assets/cycle/luteal-glow.png",
};

/** Glow images are 768px squares with the blob in the middle ~55%. */
const GLOW_SIZE = 236;

const pct = (v, of) => `${(v / of) * 100}%`;

const PhaseColumn = ({ day, today, length, onChange }) => {
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const active = groupForPhase(getPhase(day, length)).key;
  const m = markerPoint(day, length);
  const t = markerPoint(today, length);

  const fromPointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.height) return;
    onChange(dayFromY(((e.clientY - rect.top) / rect.height) * CAL.height, length));
  };

  const onKeyDown = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      onChange(Math.min(length, Math.max(1, day + step)));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      onChange(e.key === "Home" ? 1 : length);
    }
  };

  return (
    <div className="relative" style={{ aspectRatio: `${CAL.width} / ${CAL.height}` }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CAL.width} ${CAL.height}`}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none", cursor: "grab", overflow: "visible" }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* the painted glows — screen blending lets overlaps brighten */}
        {CAL_GROUPS.map((g) => {
          const c = groupCenter(g);
          const on = g.key === active;
          return (
            <image
              key={g.key}
              href={GLOW[g.key]}
              x={c.x - GLOW_SIZE / 2}
              y={c.y - GLOW_SIZE / 2}
              width={GLOW_SIZE}
              height={GLOW_SIZE}
              style={{
                mixBlendMode: "screen",
                opacity: on ? 1 : 0.72,
                filter: on ? "saturate(1.25) brightness(1.15)" : "none",
                transformOrigin: `${c.x}px ${c.y}px`,
                transform: on ? "scale(1.08)" : "none",
                transition: "opacity .5s ease, transform .5s ease, filter .5s ease",
              }}
            />
          );
        })}

        {/* the contour that ties the cycle together */}
        <path d={calendarPath()} fill="none" stroke={T.canvas} strokeWidth="0.9" opacity="0.7" />

        {/* connectors from each glow to its label */}
        {CAL_GROUPS.map((g) => {
          const c = groupCenter(g);
          const on = g.key === active;
          return (
            <g key={g.key} opacity={on ? 0.95 : 0.55}>
              <line x1={c.x} y1={c.y} x2={CAL.labelX - 6} y2={c.y} stroke={T.canvas} strokeWidth="0.7" />
              <circle cx={c.x} cy={c.y} r="2.4" fill={T.canvas} />
              <circle cx={CAL.labelX - 6} cy={c.y} r="1.6" fill={T.canvas} />
            </g>
          );
        })}

        {/* today, when you have wandered away from it */}
        {today !== day && <circle cx={t.x} cy={t.y} r="3" fill="none" stroke={T.canvas} strokeWidth="1" opacity="0.7" />}

        <g
          role="slider"
          tabIndex={0}
          aria-label="Cycle day"
          aria-valuemin={1}
          aria-valuemax={length}
          aria-valuenow={day}
          aria-valuetext={`Day ${day} of ${length}`}
          onKeyDown={onKeyDown}
          style={{ outline: "none", transition: "transform .3s ease" }}
        >
          <circle cx={m.x} cy={m.y} r="22" fill="transparent" />
          <circle cx={m.x} cy={m.y} r="9" fill={T.canvas} opacity="0.18" />
          <circle cx={m.x} cy={m.y} r="4.5" fill={T.canvas} />
          {/* the label sits on whichever side of the line has room */}
          <text
            x={m.x < 95 ? m.x + 14 : m.x - 14}
            y={m.y + 3}
            textAnchor={m.x < 95 ? "start" : "end"}
            className="sel-sans"
            style={{ fontSize: 8.5, letterSpacing: "0.14em", fill: T.canvas }}
          >
            {today === day ? "YOU ARE HERE" : `DAY ${day}`}
          </text>
        </g>
      </svg>

      {/* labels are real buttons: tap a phase to jump to its first day */}
      {CAL_GROUPS.map((g) => {
        const r = groupRange(g.key, length);
        const on = g.key === active;
        return (
          <button
            type="button"
            key={g.key}
            onClick={() => onChange(r.start)}
            aria-pressed={on}
            aria-label={`${g.label}, days ${r.start} to ${r.end}`}
            className="absolute text-left sel-press"
            style={{
              left: pct(CAL.labelX, CAL.width),
              right: 0,
              top: pct(g.cy, CAL.height),
              transform: "translateY(-30%)",
              color: on ? DARK_TEXT.text : DARK_TEXT.textSoft,
            }}
          >
            <span className="sel-serif block" style={{ fontSize: 15, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.15 }}>
              {g.label}
            </span>
            <span className="sel-serif block" style={{ fontSize: 15, letterSpacing: "0.06em", lineHeight: 1.3 }}>
              {r.start}–{r.end}
            </span>
            <span className="sel-serif italic block mt-1" style={{ fontSize: 12.5, lineHeight: 1.3 }}>
              {g.words.join(" · ")}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const Rhythm = ({ ctx, goTo }) => {
  const [day, setDay] = useState(ctx.day);
  const phase = getPhase(day, ctx.length);
  const label = PHASES.find((p) => p.key === phase).label;
  const isToday = day === ctx.day;

  return (
    <div className="sel-rise">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="sel-serif" style={{ fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: DARK_TEXT.text, lineHeight: 1.2 }}>
            Cycle calendar
          </h1>
          <p className="sel-serif italic mt-1" style={{ fontSize: 16, color: DARK_TEXT.textSoft }}>
            phases, not just days
          </p>
        </div>
        {!isToday && (
          <button type="button" onClick={() => setDay(ctx.day)} className="sel-sans text-[12.5px] underline px-1" style={{ color: DARK_TEXT.textSoft }}>
            Back to today
          </button>
        )}
      </div>

      <PhaseColumn day={day} today={ctx.day} length={ctx.length} onChange={setDay} />

      <p
        role="status"
        aria-live="polite"
        aria-label="Selected day"
        className="sel-sans text-[13px] text-center mt-4 mb-1"
        style={{ color: DARK_TEXT.text, letterSpacing: "0.04em" }}
      >
        {isToday ? "Today" : "Exploring"} · Day {day} of {ctx.length} · {label}
      </p>

      <div className="flex items-end justify-between mt-6 mb-6">
        <p className="sel-serif italic" style={{ fontSize: 16, lineHeight: 1.3, color: DARK_TEXT.textSoft }}>
          same you,
          <br />
          different energy
        </p>
        <Leaf size={30} strokeWidth={1} color={DARK_TEXT.textSoft} aria-hidden="true" />
      </div>

      <Button onClick={() => goTo("tracker")}>Log today's reality</Button>
    </div>
  );
};
