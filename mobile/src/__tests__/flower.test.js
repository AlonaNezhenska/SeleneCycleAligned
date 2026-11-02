import { bloomFrame, BLOOM_COUNT, intensityWord } from "../content/bloom";
import { levelFromX } from "../ui/FlowerIntensity";

describe("the peony behind every intensity slider", () => {
  it("has the frames from the GIF", () => {
    expect(BLOOM_COUNT).toBe(25);
  });

  it("opens for a positive state: closed bud at 1, full bloom at 5", () => {
    expect(bloomFrame(1, "open")).toBe(0);
    expect(bloomFrame(3, "open")).toBe(12);
    expect(bloomFrame(5, "open")).toBe(24);
  });

  it("closes for a difficult symptom: full bloom at 1, tight bud at 5", () => {
    expect(bloomFrame(1, "close")).toBe(24);
    expect(bloomFrame(5, "close")).toBe(0);
  });

  it("moves through every frame in order while dragging, and back", () => {
    for (const direction of ["open", "close"]) {
      let prev = bloomFrame(1, direction);
      for (let l = 1.05; l <= 5; l += 0.05) {
        const f = bloomFrame(l, direction);
        expect(Math.abs(f - prev)).toBeLessThanOrEqual(1);
        prev = f;
      }
    }
    expect(bloomFrame(0, "open")).toBe(0);
    expect(bloomFrame(9, "open")).toBe(24);
  });

  it("names every level in words", () => {
    expect([1, 2, 3, 4, 5].map(intensityWord)).toEqual(["Very mild", "Mild", "Moderate", "Intense", "Very intense"]);
    expect(intensityWord(3.4)).toBe("Moderate");
  });
});

describe("slider position", () => {
  const track = { x: 20, width: 300 };

  it("maps the finger straight onto the track, ends included", () => {
    expect(levelFromX(20, track)).toBe(1);
    expect(levelFromX(170, track)).toBe(3);
    expect(levelFromX(320, track)).toBe(5);
  });

  it("responds to small movements: a few points of travel change the flower", () => {
    // one frame of the peony is ~12 points of track on a 300-point slider
    expect(levelFromX(32, track) - levelFromX(20, track)).toBeCloseTo(0.16, 2);
  });

  it("holds at the ends when the finger slides past them", () => {
    expect(levelFromX(-50, track)).toBe(1);
    expect(levelFromX(999, track)).toBe(5);
  });
});

describe("tile lines", () => {
  const { tileRows, CATEGORY } = require("../content/journal");
  const keys = (rows) => rows.map((r) => r.map((o) => o.key));

  it("keeps opposites together and every option exactly once", () => {
    const cat = CATEGORY.energy;
    const rows = keys(tileRows(cat.options, cat.rows));
    expect(rows).toContainEqual(["low", "high"]);
    expect(rows).toContainEqual(["fog", "focus", "clarity"]);
    expect(rows.flat().sort()).toEqual(cat.options.map((o) => o.key).sort());
  });

  it("lists every symptom of every category in its lines", () => {
    for (const cat of Object.values(CATEGORY)) {
      for (const g of [cat, ...(cat.groups ?? [])]) {
        if (!g.rows) continue;
        const listed = g.rows.flat();
        expect(new Set(listed).size).toBe(listed.length);
        expect(listed.sort()).toEqual(g.options.map((o) => o.key).sort());
      }
    }
  });
});
