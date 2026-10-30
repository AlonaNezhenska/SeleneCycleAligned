import { dailyIndex, motivationFor, MOTIVATION_IMAGES } from "../content/motivation";

describe("daily motivation", () => {
  it("has the ten pictures", () => {
    expect(MOTIVATION_IMAGES).toHaveLength(10);
  });

  it("keeps the same picture all day", () => {
    expect(dailyIndex(new Date(2026, 9, 30, 0, 5), 10)).toBe(dailyIndex(new Date(2026, 9, 30, 23, 55), 10));
  });

  it("moves to the next picture each day and wraps around", () => {
    const first = dailyIndex(new Date(2026, 9, 30), 10);
    for (let i = 1; i <= 10; i++) {
      expect(dailyIndex(new Date(2026, 9, 30 + i), 10)).toBe((first + i) % 10);
    }
  });

  it("shows every picture once in any ten days", () => {
    const seen = new Set(Array.from({ length: 10 }, (_, i) => dailyIndex(new Date(2026, 11, 25 + i), 10)));
    expect(seen.size).toBe(10);
  });

  it("works with any list length, including one added later", () => {
    expect(dailyIndex(new Date(2026, 9, 30), 13)).toBeLessThan(13);
    expect(dailyIndex(new Date(2026, 9, 30), 0)).toBe(0);
    expect(motivationFor(new Date(2026, 9, 30), ["only"])).toBe("only");
  });
});
