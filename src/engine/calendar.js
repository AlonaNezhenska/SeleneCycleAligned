/* ---------------------------------------------------------------
   CYCLE CALENDAR — geometry for the four-blob phase column.
   A thin line weaves down through the blobs; today's marker rides
   that line, sitting inside the blob of the current phase.
   --------------------------------------------------------------- */

import { getPhase, phaseRange, normalizeLength, clampDay } from "./phase.js";

export const CAL = Object.freeze({ width: 340, height: 500, top: 10, bottom: 490, band: 45, labelX: 196 });

/** Four visual groups over the five engine phases: luteal is one blob. */
export const CAL_GROUPS = [
  { key: "menstruation", label: "Menstruation", phases: ["menstrual"], words: ["rest", "release", "reset"], cy: 70 },
  { key: "follicular", label: "Follicular", phases: ["follicular"], words: ["build", "focus", "grow"], cy: 190 },
  { key: "ovulation", label: "Ovulation", phases: ["ovulatory"], words: ["connect", "create", "shine"], cy: 310 },
  { key: "luteal", label: "Luteal", phases: ["earlyLuteal", "lateLuteal"], words: ["slow down", "nourish", "prepare"], cy: 430 },
];

const round = (n) => Math.round(n * 100) / 100;

/** The line's x for a given y. Peaks land on the blob centres, so the
 *  blobs alternate right, left, right, left down the column. */
export const lineX = (y) => round(92 + 22 * Math.sin((Math.PI * (y - 10)) / 120));

export const groupCenter = (group) => ({ x: lineX(group.cy), y: group.cy });

export const groupForPhase = (phase) => CAL_GROUPS.find((g) => g.phases.includes(phase));

export const groupForDay = (day, len = 28) => groupForPhase(getPhase(day, len));

/** First and last day a group covers in this cycle. */
export const groupRange = (groupKey, len = 28) => {
  const g = CAL_GROUPS.find((x) => x.key === groupKey);
  const ranges = g.phases.map((p) => phaseRange(p, len));
  return { start: ranges[0].start, end: ranges[ranges.length - 1].end };
};

/** The contour line as an SVG path, sampled finely enough to read as a curve. */
export const calendarPath = (step = 4) => {
  const pts = [];
  for (let y = CAL.top; y <= CAL.bottom; y += step) pts.push(`${lineX(y)} ${y}`);
  return `M ${pts.join(" L ")}`;
};

/** Where today's marker sits: inside its group's band, moving down with each day. */
export const markerPoint = (day, len = 28) => {
  const n = normalizeLength(len);
  const d = clampDay(day, n);
  const g = groupForDay(d, n);
  const { start, end } = groupRange(g.key, n);
  const f = (d - start + 0.5) / (end - start + 1);
  const y = round(g.cy - CAL.band + f * 2 * CAL.band);
  return { x: lineX(y), y };
};

/** Inverse of markerPoint for dragging: the nearest day to a y position. */
export const dayFromY = (y, len = 28) => {
  const n = normalizeLength(len);
  let best = 1;
  let bestDist = Infinity;
  for (let d = 1; d <= n; d++) {
    const dist = Math.abs(markerPoint(d, n).y - y);
    if (dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
};
