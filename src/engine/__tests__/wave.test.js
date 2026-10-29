import { describe, it, expect } from "vitest";
import { wavePath, cursorX, cursorY, dayFromX, WAVE } from "../wave.js";

/** Minimal SVG path grammar for what wavePath emits: one M, then C segments. */
const PATH_RE = /^M -?\d+(\.\d+)? -?\d+(\.\d+)?( C -?\d+(\.\d+)? -?\d+(\.\d+)?, -?\d+(\.\d+)? -?\d+(\.\d+)?, -?\d+(\.\d+)? -?\d+(\.\d+)?)+$/;

describe("wavePath", () => {
  it.each([28, 21, 35])("returns a valid SVG d string for a %i-day cycle", (len) => {
    const d = wavePath(len);
    expect(d).toMatch(PATH_RE);
    expect(d.match(/ C /g)).toHaveLength(len - 1);
    expect(d).not.toMatch(/NaN|Infinity/);
  });

  it("falls back to 28 days for a bad length", () => {
    expect(wavePath(0)).toBe(wavePath(28));
  });
});

describe("cursorX", () => {
  it("increases monotonically across the cycle", () => {
    for (const len of [28, 35]) {
      for (let d = 1; d < len; d++) expect(cursorX(d + 1, len)).toBeGreaterThan(cursorX(d, len));
    }
  });

  it("stays clamped to the wave bounds", () => {
    expect(cursorX(1, 28)).toBe(WAVE.padX);
    expect(cursorX(28, 28)).toBe(WAVE.width - WAVE.padX);
    expect(cursorX(0, 28)).toBe(WAVE.padX);
    expect(cursorX(-10, 28)).toBe(WAVE.padX);
    expect(cursorX(99, 28)).toBe(WAVE.width - WAVE.padX);
    expect(cursorX(NaN, 28)).toBe(WAVE.padX);
  });

  it("round-trips through dayFromX", () => {
    for (let d = 1; d <= 28; d++) expect(dayFromX(cursorX(d, 28), 28)).toBe(d);
    expect(dayFromX(-50, 28)).toBe(1);
    expect(dayFromX(9999, 28)).toBe(28);
  });
});

describe("cursorY", () => {
  it("peaks around ovulation and sits inside the drawing area", () => {
    const ys = Array.from({ length: 28 }, (_, i) => cursorY(i + 1, 28));
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(WAVE.top);
      expect(y).toBeLessThanOrEqual(WAVE.bottom);
    }
    const peakDay = ys.indexOf(Math.min(...ys)) + 1;
    expect(peakDay).toBeGreaterThanOrEqual(12);
    expect(peakDay).toBeLessThanOrEqual(16);
  });
});
