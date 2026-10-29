import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Home as HomeIcon, ClipboardList, Moon, Activity, UtensilsCrossed } from "lucide-react";
import { T } from "./theme/tokens.js";
import { sunset, resumeOnOpen } from "./engine/index.js";
import { deriveToday } from "./derive.js";
import { GlobalStyles, DrawerHost } from "./ui/primitives.jsx";
import { usePersistent } from "./ui/usePersistent.js";
import { Onboarding, ONBOARDING_BG } from "./screens/Onboarding.jsx";
import { Home } from "./screens/Home.jsx";
import { Triad } from "./screens/Triad.jsx";
import { Rhythm } from "./screens/Rhythm.jsx";
import { Training } from "./screens/Training.jsx";
import { Fuel } from "./screens/Fuel.jsx";

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

/** App tabs that carry their own backdrop instead of the plain canvas. */
const APP_BG = {
  tracker: { color: T.aegean },
};

const BottomNav = ({ tab, setTab }) => (
  <nav aria-label="Main" className="flex justify-between px-4 pt-2 pb-3" style={{ borderTop: `1px solid ${T.hair}`, background: T.canvas, position: "relative", zIndex: 2 }}>
    {NAV.map(({ key, label, icon: Icon }) => {
      const on = tab === key;
      return (
        <button
          type="button"
          key={key}
          onClick={() => setTab(key)}
          aria-current={on ? "page" : undefined}
          className="flex flex-col items-center justify-center gap-[5px] sel-press"
          style={{ width: 60 }}
        >
          <Icon size={19} strokeWidth={on ? 2 : 1.5} color={on ? T.ink : T.inkSoft} aria-hidden="true" />
          <span className="sel-sans text-[10.5px]" style={{ color: on ? T.ink : T.inkSoft, fontWeight: on ? 600 : 400 }}>
            {label}
          </span>
          <span className="rounded-full" style={{ width: on ? 14 : 0, height: 2, background: T.terracotta, transition: "width .2s" }} />
        </button>
      );
    })}
  </nav>
);

/* ---------------------------------------------------------------
   ROOT — local state only, no network
   --------------------------------------------------------------- */

const isoDaysAgo = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const defaultProfile = (now = new Date()) => ({
  goal: null,
  ageGroup: "20s/30s",
  onBirthControl: false,
  lastPeriod: isoDaysAgo(20, now), // day 21 — early luteal
  cycleLength: 28,
  hurdles: [],
  trackingStyle: "Protein & Calories only",
  hasBaselinePhoto: false,
});

/** The past six days, as the Forgiveness Engine sees them. */
const PAST_DAYS = [
  { prescribed: "strength", completed: true },
  { prescribed: "rest", completed: true },
  null,
  { prescribed: "strength", completed: true },
  { prescribed: "strength", completed: true },
  null,
];

const LAST_ACTIVE_KEY = "selena.lastActive";

export default function SelenaApp({ initialPhase = "onboarding", initialProfile, initialTab = "home", now: fixedNow }) {
  const now = useMemo(() => fixedNow ?? new Date(), [fixedNow]);
  const [phase, setPhase] = useState(initialPhase);
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState(initialTab);
  const [dayOverride, setDayOverride] = useState(null);
  const [drawerHost, setDrawerHost] = useState(null);

  const [profile, setProfile] = useState(() => ({ ...defaultProfile(now), ...initialProfile }));
  const [today, setTodayState] = useState({ vibe: null, checkIn: { social: null, drive: null }, cardio: null });
  const [triad, setTriad] = useState({
    flow: ["Heavy"],
    pain: ["Uterine cramps"],
    cognition: ["Brain fog"],
  });
  const [hideNumbers, setHideNumbers] = usePersistent("selena.hideNumbers", true);
  const [fuelState, setFuelState] = useState({ bufferAccepted: false, bufferDismissed: false, saved: {} });
  const [session, setSessionState] = useState({ startedAt: null, endedAt: null, bailoutOffered: false, bailoutVisible: false });
  const [todayEntry, setTodayEntry] = useState(null);

  // 72-Hour Sunset Protocol: after a long absence, resume without comment.
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(LAST_ACTIVE_KEY));
      const resumed = last && sunset(last, Date.now()) ? resumeOnOpen() : { lastActive: Date.now() };
      localStorage.setItem(LAST_ACTIVE_KEY, String(resumed.lastActive));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setOn = (patch) => setProfile((p) => ({ ...p, ...patch }));
  const setToday = (patch) => setTodayState((p) => ({ ...p, ...patch }));
  const setSession = useCallback((patch) => setSessionState((p) => ({ ...p, ...patch })), []);
  const fuel = { ...fuelState, hideNumbers };
  const setFuel = ({ hideNumbers: h, ...patch }) => {
    if (h !== undefined) setHideNumbers(h);
    if (Object.keys(patch).length) setFuelState((p) => ({ ...p, ...patch }));
  };

  const ctx = useMemo(() => deriveToday({ profile, today, now, dayOverride }), [profile, today, now, dayOverride]);
  const markDone = (kind = ctx.prescription.kind) => setTodayEntry({ prescribed: kind, completed: true });
  const history = [...PAST_DAYS, todayEntry];

  const screenBg = phase === "onboarding" ? ONBOARDING_BG[step] : APP_BG[tab];

  const tabs = {
    home: <Home ctx={ctx} today={today} setToday={setToday} history={history} goTo={setTab} />,
    tracker: <Triad ctx={ctx} log={triad} setLog={setTriad} fuel={fuel} setFuel={setFuel} />,
    cycle: <Rhythm key={ctx.day} ctx={ctx} goTo={setTab} />,
    workouts: (
      <Training
        plannedAt={now}
        ctx={ctx}
        session={session}
        setSession={setSession}
        todayEntry={todayEntry}
        markDone={markDone}
        cardio={today.cardio}
        setCardio={(cardio) => setToday({ cardio })}
      />
    ),
    nutrition: <Fuel ctx={ctx} fuel={fuel} setFuel={setFuel} trackingStyle={profile.trackingStyle} />,
  };

  const devBtn = (on) => ({
    background: on ? T.ink : "transparent",
    color: on ? T.canvas : T.ink,
    border: `1px solid ${T.hair}`,
  });

  return (
    <div className="sel-app w-full min-h-screen flex flex-col items-center py-6 px-4" style={{ background: "#E2DCCD" }}>
      <GlobalStyles />

      {/* dev-only controls — not part of the product UI */}
      <div className="flex gap-2 mb-4 flex-wrap justify-center items-center sel-sans" aria-label="Mockup controls" role="toolbar">
        <button
          type="button"
          onClick={() => {
            setPhase("onboarding");
            setStep(0);
          }}
          className="text-[12px] rounded-full px-3"
          style={devBtn(phase === "onboarding")}
        >
          Onboarding
        </button>
        <button type="button" onClick={() => setPhase("app")} className="text-[12px] rounded-full px-3" style={devBtn(phase === "app")}>
          App
        </button>
        <label className="text-[12px] flex items-center gap-2 ml-2" style={{ color: T.ink }}>
          Simulate day {ctx.day}
          <input
            type="range"
            min={1}
            max={ctx.length}
            value={ctx.day}
            onChange={(e) => setDayOverride(Number(e.target.value))}
            style={{ accentColor: T.terracotta }}
          />
        </label>
        {dayOverride != null && (
          <button type="button" onClick={() => setDayOverride(null)} className="text-[12px] rounded-full px-3" style={devBtn(false)}>
            Real day
          </button>
        )}
      </div>

      <div
        ref={setDrawerHost}
        className="w-full flex flex-col overflow-hidden sel-canvas"
        style={{
          maxWidth: 392,
          height: "min(812px, calc(100vh - 90px))",
          minHeight: 640,
          borderRadius: 38,
          boxShadow: "0 26px 70px rgba(31,58,95,0.20)",
          border: "1px solid rgba(242,239,230,0.6)",
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
              backgroundColor: screenBg.color,
              backgroundImage: screenBg.img ? `${screenBg.scrim}, url("${screenBg.img}")` : undefined,
              backgroundSize: "cover, cover",
              backgroundPosition: "center, center",
            }}
          />
        )}

        <DrawerHost.Provider value={drawerHost}>
          <main className="flex-1 overflow-y-auto sel-scroll px-6 pt-7 pb-7" style={{ position: "relative", zIndex: 1 }}>
            {phase === "onboarding" ? (
              <Onboarding step={step} setStep={setStep} data={profile} set={setOn} done={() => setPhase("app")} />
            ) : (
              tabs[tab]
            )}
          </main>
        </DrawerHost.Provider>

        {phase === "app" && <BottomNav tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}
