/* ---------------------------------------------------------------
   WAVE — the Cycle Rhythm curve as a pure SVG path.
   A smooth line through one point per day; energy rises to ovulation,
   lifts again mid-luteal, and sinks into the next bleed.
   --------------------------------------------------------------- */

import { normalizeLength } from "./phase.js";

export const WAVE = Object.freeze({ width: 340, height: 150, padX: 8, top: 24, bottom: 120 });

const gauss = (t, mu, sigma) => Math.exp(-((t - mu) ** 2) / (2 * sigma ** 2));

/** Relative energy for a position 0..1 through the cycle, in 0..1. */
export const energyAt = (t) => {
  const e = 0.12 + 0.82 * gauss(t, 0.48, 0.13) + 0.38 * gauss(t, 0.74, 0.1);
  return Math.min(1, Math.max(0, e));
};

const round = (n) => Math.round(n * 100) / 100;

/** x for a day, clamped to the wave bounds and increasing with the day. */
export const cursorX = (day, len = 28, { width = WAVE.width, padX = WAVE.padX } = {}) => {
  const n = normalizeLength(len);
  const d = Math.min(Math.max(Number.isFinite(day) ? day : 1, 1), n);
  return round(padX + ((d - 1) / (n - 1)) * (width - 2 * padX));
};

export const cursorY = (day, len = 28, { top = WAVE.top, bottom = WAVE.bottom } = {}) => {
  const n = normalizeLength(len);
  const d = Math.min(Math.max(day, 1), n);
  return round(bottom - energyAt((d - 1) / (n - 1)) * (bottom - top));
};

/** Inverse of cursorX, rounded to the nearest whole day. */
export const dayFromX = (x, len = 28, { width = WAVE.width, padX = WAVE.padX } = {}) => {
  const n = normalizeLength(len);
  const t = (x - padX) / (width - 2 * padX);
  return Math.min(n, Math.max(1, Math.round(t * (n - 1)) + 1));
};

/** Catmull-Rom through every day, emitted as cubic beziers. */
export const wavePath = (len = 28, opts = {}) => {
  const n = normalizeLength(len);
  const pts = Array.from({ length: n }, (_, i) => [cursorX(i + 1, n, opts), cursorY(i + 1, n, opts)]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [round(p1[0] + (p2[0] - p0[0]) / 6), round(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [round(p2[0] - (p3[0] - p1[0]) / 6), round(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
};
