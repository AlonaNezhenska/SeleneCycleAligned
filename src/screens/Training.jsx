import React, { useEffect, useState } from "react";
import { Check, LifeBuoy, Timer, Play, Square, Egg } from "lucide-react";
import { T } from "../theme/tokens.js";
import {
  preFlightNudge,
  shouldOfferBailout,
  postWorkoutWindow,
  windowRemaining,
  normalizeCardio,
  UI_COPY,
} from "../engine/index.js";
import { Card, Button, SectionLabel, Plate, Instruction, IMG_FOREST } from "../ui/primitives.jsx";
import { MODE_STYLE } from "./Home.jsx";

/* ---------------------------------------------------------------
   5. THE TRAINING PROTOCOL
   --------------------------------------------------------------- */

const CARDIO_CHOICES = [
  { key: "zone2", label: "Zone 2" },
  { key: "sit", label: "SIT" },
  { key: "spin", label: "Spin class" },
];
const CARDIO_NAME = { zone2: "Zone 2", sit: "SIT", spin: "Spin class" };

const clock = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Re-render once a second while something is timing. */
const useNow = (active) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
};

const IconDisc = ({ icon: Icon, bg, color = T.canvas }) => (
  <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
    <Icon size={17} color={color} strokeWidth={1.7} aria-hidden="true" />
  </span>
);

const ProteinWindow = ({ window, now }) => {
  const left = windowRemaining(window, now);
  const pct = (left / (window.minutes * 60 * 1000)) * 100;
  return (
    <Card className="px-5 py-4" role="region" aria-label="Protein window">
      <div className="flex items-start gap-3.5">
        <IconDisc icon={Timer} bg={T.terracotta} />
        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="sel-sans text-[13.5px] font-medium" style={{ color: T.ink }}>
              {left > 0 ? "Protein window open" : "Window closed. All good."}
            </span>
            <span className="sel-sans text-[13px] tabular-nums font-semibold" style={{ color: T.terracotta }}>
              {clock(left)}
            </span>
          </div>
          <div className="h-[6px] rounded-full overflow-hidden mb-2" style={{ background: "rgba(42,38,34,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: T.terracotta }} />
          </div>
          <p className="sel-sans text-[12.5px] mb-2" style={{ color: T.inkSoft, lineHeight: 1.45 }}>
            Aim for {window.proteinGrams}g+ protein in the next {window.minutes} minutes. Nothing breaks if you don't.
          </p>
          <Instruction topic="postWindow" />
        </div>
      </div>
    </Card>
  );
};

export const Training = ({ ctx, plannedAt, session, setSession, todayEntry, markDone, cardio, setCardio }) => {
  const p = ctx.prescription;
  const running = session.startedAt != null && session.endedAt == null;
  const windowOpen = session.endedAt != null;
  const now = useNow(running || windowOpen);

  const elapsed = running ? now - session.startedAt : 0;

  useEffect(() => {
    if (running && shouldOfferBailout(elapsed, session.bailoutOffered)) {
      setSession({ bailoutOffered: true, bailoutVisible: true });
    }
  }, [running, elapsed, session.bailoutOffered, setSession]);

  const preFlight = preFlightNudge(session.startedAt ?? plannedAt ?? now);
  const cardioChoice = normalizeCardio(cardio ?? p.cardio.cardio, p.mode);
  const protein = windowOpen ? postWorkoutWindow(session.endedAt) : null;
  const done = todayEntry?.completed === true;

  const start = () => setSession({ startedAt: Date.now(), endedAt: null, bailoutOffered: false, bailoutVisible: false });
  const end = () => {
    setSession({ endedAt: Date.now(), bailoutVisible: false });
    markDone();
  };
  const bailout = () => {
    setSession({ endedAt: Date.now(), bailoutVisible: false });
    markDone("rest");
  };

  return (
    <div className="sel-rise">
      <div className="text-center mb-6">
        <h1 className="sel-serif" style={{ fontSize: 24, lineHeight: 1.25, color: T.ink }}>
          Today's movement plan
        </h1>
        <p className="sel-sans text-[12px] mt-2" style={{ color: T.inkSoft, letterSpacing: "0.04em" }}>
          Based on your energy:{" "}
          <span style={{ color: MODE_STYLE[p.mode].ring, fontWeight: 700 }}>
            {p.mode.toUpperCase()} ({MODE_STYLE[p.mode].caption})
          </span>
        </p>
      </div>

      <Plate height={190} radius={24} className="mb-6" src={IMG_FOREST} alt="Movement and recovery" />

      {/* Forgiveness Engine — rest earns the same completion mark as a heavy lift */}
      <Card className="px-5 py-4 mb-4 flex items-center gap-4" style={{ background: T.canvasDeep }}>
        <div className="flex-1">
          <p className="sel-sans text-[15px] font-semibold" style={{ color: T.ink }}>
            {p.title}
          </p>
          <p className="sel-sans text-[12.5px] mt-0.5" style={{ color: T.inkSoft }}>
            {p.summary}
          </p>
        </div>
        {done ? (
          <span
            role="img"
            aria-label="Done today"
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: T.sage }}
          >
            <Check size={22} color={T.canvas} strokeWidth={2.4} aria-hidden="true" />
          </span>
        ) : (
          p.kind === "rest" && (
            <Button size="sm" full={false} onClick={() => markDone("rest")}>
              Rest taken
            </Button>
          )
        )}
      </Card>

      <Card className="px-5 py-5 mb-4">
        <SectionLabel>Today's focus</SectionLabel>
        <ul className="flex flex-col gap-2.5 mt-1 mb-4">
          {p.options.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: T.sage }} aria-hidden="true" />
              <span className="sel-sans text-[13px]" style={{ color: T.ink }}>
                {item}
              </span>
            </li>
          ))}
          {p.strength && (
            <li className="sel-sans text-[12.5px] pl-4" style={{ color: T.inkSoft }}>
              {p.strength.toFailure
                ? "Take each working set until you cannot complete another clean rep."
                : `Stop each set with ${p.strength.rir.min}–${p.strength.rir.max} reps in reserve.`}
            </li>
          )}
          {p.plyometrics && (
            <li className="sel-sans text-[12.5px] pl-4" style={{ color: T.inkSoft }}>
              Plyometrics are part of today: a few sets of jumps or bounds.
            </li>
          )}
        </ul>
        <Instruction topic="prescription" />
      </Card>

      {/* Polarized cardio — easy or hard, never the grey middle */}
      <Card className="px-5 py-5 mb-4">
        <SectionLabel>Cardio</SectionLabel>
        <div className="flex gap-2 mb-3" role="group" aria-label="Cardio choice">
          {CARDIO_CHOICES.map(({ key, label }) => {
            const on = (cardio ?? p.cardio.cardio) === key;
            return (
              <button
                type="button"
                key={key}
                aria-pressed={on}
                onClick={() => setCardio(key)}
                className="sel-sans flex-1 rounded-full text-[12.5px] font-medium sel-press"
                style={{ background: on ? T.aegean : T.canvas, color: on ? T.canvas : T.ink, border: `1px solid ${on ? T.aegean : T.hair}` }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="sel-sans text-[12.5px]" style={{ color: T.inkSoft, lineHeight: 1.5 }} role="status">
          {cardioChoice.replaced
            ? UI_COPY.cardioSwap(CARDIO_NAME[cardioChoice.requested], CARDIO_NAME[cardioChoice.cardio])
            : `${CARDIO_NAME[cardioChoice.cardio]} it is.`}
        </p>
      </Card>

      {preFlight && !windowOpen && (
        <Card className="px-5 py-4 mb-4" role="region" aria-label="Pre-Flight">
          <div className="flex items-start gap-3.5">
            <IconDisc icon={Egg} bg={T.sage} />
            <div className="flex-1">
              <p className="sel-sans text-[13.5px] font-medium mb-0.5" style={{ color: T.ink }}>
                Pre-Flight: {preFlight.proteinGrams}g protein first
              </p>
              <Instruction topic="preFlight" />
            </div>
          </div>
        </Card>
      )}

      {/* Session — the Bailout appears once, from the tenth minute */}
      {p.kind === "strength" && !windowOpen && (
        <Card className="px-5 py-4 mb-4">
          {running ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="sel-sans text-[12px]" style={{ color: T.inkSoft }}>
                  Session time
                </p>
                <p className="sel-sans text-[22px] font-semibold tabular-nums" style={{ color: T.ink }} aria-label="Elapsed time">
                  {clock(elapsed)}
                </p>
              </div>
              <Button tone="dark" size="sm" full={false} onClick={end}>
                <span className="flex items-center gap-1.5">
                  <Square size={13} aria-hidden="true" /> End session
                </span>
              </Button>
            </div>
          ) : (
            <Button onClick={start}>
              <span className="flex items-center justify-center gap-2">
                <Play size={15} aria-hidden="true" /> Start session
              </span>
            </Button>
          )}
        </Card>
      )}

      {session.bailoutVisible && (
        <Card className="px-5 py-4 mb-4" role="alertdialog" aria-label="Bailout" style={{ background: T.canvasDeep }}>
          <div className="flex items-start gap-3.5">
            <IconDisc icon={LifeBuoy} bg={T.aegean} />
            <div className="flex-1">
              <p className="sel-sans text-[13.5px] font-medium mb-1" style={{ color: T.ink }}>
                Ten minutes in. How's it landing?
              </p>
              <p className="sel-sans text-[12.5px] mb-3" style={{ color: T.inkSoft, lineHeight: 1.45 }}>
                {UI_COPY.bailoutPrompt}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button tone="dark" size="sm" full={false} onClick={bailout}>
                  Switch to recovery
                </Button>
                <Button tone="outline" size="sm" full={false} onClick={() => setSession({ bailoutVisible: false })}>
                  Keep going
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {protein && <ProteinWindow window={protein} now={now} />}
    </div>
  );
};
