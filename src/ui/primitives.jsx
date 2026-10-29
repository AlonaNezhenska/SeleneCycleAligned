import React, { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { T, tone, MIN_TOUCH } from "../theme/tokens.js";
import { RATIONALE } from "../engine/copy.js";

export const IMG = "/assets/hero-moon-woman.png";
export const IMG_VAULT = "/assets/vault-frame.png";
export const IMG_MEDITATE = "/assets/meditating-woman.png";
export const IMG_FOREST = "/assets/forest-sunbeam.jpg";
export const IMG_BLOOM_RED = "/assets/icons/orb-body.jpg";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.92 0 0 0 0 0.9 0 0 0 0 0.85 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

    .sel-serif { font-family: 'Playfair Display', Georgia, serif; }
    .sel-sans  { font-family: 'Inter', system-ui, sans-serif; }

    /* Paper texture — a seamless tile multiplied over whatever sits beneath,
       so it tints photos and flat tokens alike without hiding them. */
    .sel-canvas { background-color: ${T.canvas}; }
    .sel-canvas::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background-image: ${NOISE}; background-repeat: repeat; background-size: 160px 160px;
      mix-blend-mode: multiply; opacity: 0.55;
    }

    /* Every control is at least a thumb wide. */
    .sel-app button, .sel-app [role="slider"], .sel-app input, .sel-app select { min-height: ${MIN_TOUCH}px; }
    .sel-app button { min-width: ${MIN_TOUCH}px; }

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

    @keyframes sel-drawer { from { transform: translateY(100%); } to { transform: none; } }
    .sel-drawer { animation: sel-drawer .32s cubic-bezier(.22,.8,.3,1) both; }

    /* Tile labels are shortened to fit; the tip carries the full wording. */
    .sel-tip { position: relative; }
    .sel-tip-label {
      position: absolute; bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%) translateY(3px);
      width: 128px; padding: 7px 9px; border-radius: 10px; z-index: 30;
      background: ${T.ink}; color: ${T.canvas};
      font-size: 11px; line-height: 1.35; text-align: center;
      opacity: 0; pointer-events: none;
      transition: opacity .16s ease, transform .16s ease;
      box-shadow: 0 6px 18px rgba(31,58,95,0.22);
    }
    .sel-tip-label::after {
      content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
      border: 5px solid transparent; border-top-color: ${T.ink};
    }
    .sel-tip:hover .sel-tip-label,
    .sel-tip:focus-visible .sel-tip-label {
      opacity: 1; transform: translateX(-50%) translateY(0);
    }
    @media (hover: none) { .sel-tip:hover .sel-tip-label { opacity: 0; } }

    @media (prefers-reduced-motion: reduce) {
      .sel-rise, .sel-bg-fade, .sel-drawer { animation: none; }
      .sel-press { transition: none; }
    }

    :focus-visible { outline: 2px solid ${T.terracotta}; outline-offset: 3px; }
  `}</style>
);

/* ---------------------------------------------------------------
   SHARED PRIMITIVES
   --------------------------------------------------------------- */

export const Eyebrow = ({ step, children, dark = false }) => {
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

export const IconBtn = ({ children, onClick, label, dark = false }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="w-11 h-11 rounded-full flex items-center justify-center sel-press flex-shrink-0"
    style={{ border: `1px solid ${tone(dark).hair}` }}
  >
    {children}
  </button>
);

export const Button = ({ children, onClick, tone: variant = "primary", full = true, size = "lg", dark = false, ...rest }) => {
  const c = tone(dark);
  const variants = {
    primary: { background: T.sage, color: T.canvas, border: `1.5px solid ${T.sage}` },
    dark: { background: T.aegean, color: T.canvas, border: `1.5px solid ${T.aegean}` },
    warm: { background: T.terracotta, color: T.canvas, border: `1.5px solid ${T.terracotta}` },
    outline: { background: "transparent", color: c.text, border: `1.5px solid ${c.text}` },
    quiet: { background: "transparent", color: c.textSoft, border: "1.5px solid transparent" },
  };
  const sizes = { lg: "py-[13px] px-7 text-[15px]", sm: "py-[10px] px-4 text-[12.5px]" };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sel-sans font-medium rounded-full sel-press ${sizes[size]} ${full ? "w-full" : ""}`}
      style={variants[variant]}
      {...rest}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = "", style = {}, dark = false, ...rest }) => {
  const c = tone(dark);
  return (
    <div
      className={`rounded-[20px] ${className}`}
      style={{
        background: c.surface,
        border: `1px solid ${c.hair}`,
        backdropFilter: dark ? "blur(8px)" : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

/** Selection tile — the workhorse. Filled = chosen, never "correct".
 *  `full` adds a hover tip for labels too long to sit under the icon. */
export const Tile = ({ icon: Icon, label, full, selected, onClick, filled = false, dark = false, accent = T.sage }) => {
  const c = tone(dark);
  const ink = selected && filled ? T.canvas : c.text;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={full || label}
      aria-pressed={selected}
      className={`rounded-[16px] py-[16px] px-2 flex flex-col items-center gap-2 sel-press ${full ? "sel-tip" : ""}`}
      style={{
        background: selected ? (filled ? accent : dark ? c.surfaceDeep : "rgba(91,107,74,0.12)") : c.surface,
        border: `1.5px solid ${selected ? accent : c.hair}`,
        color: ink,
        backdropFilter: dark ? "blur(8px)" : undefined,
      }}
    >
      <Icon size={22} strokeWidth={1.5} color={ink} aria-hidden="true" />
      <span className="sel-sans text-[11.5px] text-center leading-tight" style={{ fontWeight: selected ? 600 : 400 }}>
        {label}
      </span>
      {full && <span className="sel-tip-label sel-sans" aria-hidden="true">{full}</span>}
    </button>
  );
};

/** Aesthetic toggle — a hand-drawn feeling switch, not a system control. */
export const Switch = ({ value, onChange, leftLabel, rightLabel, label, dark = false }) => {
  const c = tone(dark);
  return (
    <div
      className="flex rounded-full p-[3px] sel-sans"
      style={{ background: dark ? "rgba(0,0,0,0.25)" : T.canvasDeep }}
      role="group"
      aria-label={label}
    >
      {[
        { l: leftLabel, v: false },
        { l: rightLabel, v: true },
      ].map(({ l, v }) => (
        <button
          type="button"
          key={l}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className="flex-1 rounded-full py-[9px] text-[12.5px] font-medium sel-press"
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

export const ToggleRow = ({ label, sublabel, dark = false, ...rest }) => {
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
      <Switch dark={dark} label={label} {...rest} />
    </Card>
  );
};

export const Dots = ({ total, active, dark = false }) => (
  <div className="flex justify-center gap-[7px]" aria-hidden="true">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className="h-[5px] rounded-full transition-all duration-300"
        style={{
          width: i === active ? 18 : 5,
          background: i === active ? tone(dark).text : dark ? "rgba(242,239,230,0.3)" : "rgba(42,38,34,0.2)",
        }}
      />
    ))}
  </div>
);

/** Illustration frame — all raster art routes through here. */
export const Plate = ({ height = 200, radius = 20, className = "", src = IMG, alt = "Selena illustration", dark = false }) => (
  <div
    className={`overflow-hidden ${className}`}
    style={{
      height,
      borderRadius: radius,
      background: dark ? "rgba(0,0,0,0.2)" : T.canvasDeep,
      border: `1px solid ${tone(dark).hair}`,
    }}
  >
    <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </div>
);

export const SectionLabel = ({ children, dark = false }) => (
  <p className="sel-eyebrow sel-sans mb-2.5" style={{ color: tone(dark).textSoft }}>
    {children}
  </p>
);

/* ---------------------------------------------------------------
   PROGRESSIVE DISCLOSURE
   Layer 1: a calm instruction with an info icon.
   Layer 2: a half-screen rationale drawer.
   Layer 3: the sources, one tap further in.
   --------------------------------------------------------------- */

/** The phone frame registers itself here so drawers cover the device,
 *  not the browser window. Without a host they render in place. */
export const DrawerHost = createContext(null);

const Drawer = ({ title, onClose, children }) => {
  const host = useContext(DrawerHost);
  const sheet = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: "rgba(42,38,34,0.35)" }}>
      <button type="button" aria-label="Close" className="flex-1 w-full" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sel-drawer px-6 pt-5 pb-7 sel-scroll overflow-y-auto"
        style={{ background: T.canvas, borderRadius: "26px 26px 0 0", height: "50%" }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="sel-serif" style={{ fontSize: 20, lineHeight: 1.25, color: T.ink }}>
            {title}
          </h2>
          <IconBtn label="Close" onClick={onClose}>
            <X size={16} color={T.ink} />
          </IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
  return host ? createPortal(sheet, host) : sheet;
};

export const Instruction = ({ topic, dark = false }) => {
  const [open, setOpen] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const r = RATIONALE[topic];
  const c = tone(dark);

  return (
    <>
      <div className="flex items-center gap-2">
        <p className="sel-sans text-[12.5px] flex-1" style={{ color: c.textSoft, lineHeight: 1.5 }}>
          {r.instruction}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Why this?"
          className="rounded-full flex items-center justify-center sel-press flex-shrink-0"
        >
          <Info size={16} color={c.textSoft} strokeWidth={1.7} />
        </button>
      </div>

      {open && (
        <Drawer title="Why this?" onClose={() => { setOpen(false); setShowSources(false); }}>
          <p className="sel-sans text-[13.5px] mb-5" style={{ color: T.ink, lineHeight: 1.6 }}>
            {r.rationale}
          </p>
          {showSources ? (
            <ul className="flex flex-col gap-2.5" aria-label="Sources">
              {r.sources.map((s) => (
                <li key={s.label} className="sel-sans text-[12.5px]" style={{ color: T.inkSoft, lineHeight: 1.45 }}>
                  <span className="font-semibold" style={{ color: T.ink }}>
                    {s.kind}
                  </span>{" "}
                  · {s.ref ? <a href={s.ref} target="_blank" rel="noreferrer">{s.label}</a> : s.label}
                  {!s.ref && <span className="block text-[11.5px]">Citation pending review.</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Button tone="outline" size="sm" full={false} onClick={() => setShowSources(true)}>
              Show sources
            </Button>
          )}
        </Drawer>
      )}
    </>
  );
};
