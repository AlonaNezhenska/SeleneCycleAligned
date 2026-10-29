import { describe, it, expect } from "vitest";
import {
  CAL,
  CAL_GROUPS,
  lineX,
  groupCenter,
  groupForDay,
  groupRange,
  calendarPath,
  markerPoint,
  dayFromY,
} from "../calendar.js";
import { PHASES } from "../phase.js";

describe("calendar groups", () => {
  it("cover all five engine phases exactly once", () => {
    const covered = CAL_GROUPS.flatMap((g) => g.phases).sort();
    expect(covered).toEqual(PHASES.map((p) => p.key).sort());
  });

  it.each([
    [1, "menstruation"],
    [5, "menstruation"],
    [6, "follicular"],
    [14, "ovulation"],
    [17, "luteal"],
    [28, "luteal"],
  ])("day %i belongs to %s", (day, key) => {
    expect(groupForDay(day, 28).key).toBe(key);
  });

  it("match the reference day ranges on a 28-day cycle", () => {
    expect(groupRange("menstruation", 28)).toEqual({ start: 1, end: 5 });
    expect(groupRange("follicular", 28)).toEqual({ start: 6, end: 13 });
    expect(groupRange("ovulation", 28)).toEqual({ start: 14, end: 16 });
    expect(groupRange("luteal", 28)).toEqual({ start: 17, end: 28 });
  });

  it("stretch to a 35-day cycle without gaps", () => {
    let next = 1;
    for (const g of CAL_GROUPS) {
      const r = groupRange(g.key, 35);
      expect(r.start).toBe(next);
      next = r.end + 1;
    }
    expect(next).toBe(36);
  });

  it("alternate right and left down the column", () => {
    const xs = CAL_GROUPS.map((g) => groupCenter(g).x);
    expect(xs[0]).toBeGreaterThan(xs[1]);
    expect(xs[2]).toBeGreaterThan(xs[1]);
    expect(xs[2]).toBeGreaterThan(xs[3]);
  });
});

describe("calendarPath", () => {
  it("is a valid SVG d string from top to bottom", () => {
    const d = calendarPath();
    expect(d).toMatch(/^M -?\d+(\.\d+)? \d+( L -?\d+(\.\d+)? \d+)+$/);
    expect(d).not.toMatch(/NaN|Infinity/);
    expect(d.startsWith(`M ${lineX(CAL.top)} ${CAL.top}`)).toBe(true);
  });
});

describe("markerPoint", () => {
  it("moves strictly down the column as the days pass", () => {
    for (const len of [28, 35]) {
      for (let d = 1; d < len; d++) expect(markerPoint(d + 1, len).y).toBeGreaterThan(markerPoint(d, len).y);
    }
  });

  it("always sits on the contour line, inside its phase's glow", () => {
    for (let d = 1; d <= 28; d++) {
      const p = markerPoint(d, 28);
      const g = groupForDay(d, 28);
      expect(p.x).toBe(lineX(p.y));
      expect(Math.abs(p.y - g.cy)).toBeLessThanOrEqual(CAL.band);
    }
  });

  it("clamps day 0 and days past the cycle", () => {
    expect(markerPoint(0, 28)).toEqual(markerPoint(1, 28));
    expect(markerPoint(40, 28)).toEqual(markerPoint(28, 28));
  });

  it("round-trips through dayFromY for dragging", () => {
    for (let d = 1; d <= 28; d++) expect(dayFromY(markerPoint(d, 28).y, 28)).toBe(d);
    expect(dayFromY(-100, 28)).toBe(1);
    expect(dayFromY(9999, 28)).toBe(28);
  });
});
