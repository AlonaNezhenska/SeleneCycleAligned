import { weekStart, weekDates, weekVibes, summarizeWeek, recentWeeks } from "../lib/vibes";

describe("weeks", () => {
  it("start on Monday", () => {
    expect(weekStart(new Date(2026, 9, 29))).toBe("2026-10-26"); // Thursday → Monday
    expect(weekStart(new Date(2026, 9, 26))).toBe("2026-10-26"); // Monday stays
    expect(weekStart(new Date(2026, 10, 1))).toBe("2026-10-26"); // Sunday belongs to the same week
  });

  it("list seven dates across a month end", () => {
    expect(weekDates("2026-10-26")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("go back in order for the history row", () => {
    expect(recentWeeks(new Date(2026, 9, 29), 3)).toEqual(["2026-10-12", "2026-10-19", "2026-10-26"]);
  });
});

describe("weekly vibes", () => {
  const days = {
    "2026-10-26": { vibe: "Inward" },
    "2026-10-27": { vibe: "Inward" },
    "2026-10-28": { vibe: "Steady" },
    "2026-10-29": { triad: {} }, // a day without a chosen vibe
    "2026-10-19": { vibe: "Outward" }, // the week before
  };

  it("only counts vibes the user chose, Monday first", () => {
    expect(weekVibes(days, "2026-10-26")).toEqual(["Inward", "Inward", "Steady", null, null, null, null]);
  });

  it("summarise how full the bubble is and what dominated", () => {
    const s = summarizeWeek(weekVibes(days, "2026-10-26"));
    expect(s.counts).toEqual({ Inward: 2, Steady: 1, Outward: 0 });
    expect(s.logged).toBe(3);
    expect(s.fill).toBeCloseTo(3 / 7);
    expect(s.headline).toMatch(/Mostly Inward/);
  });

  it("calls Steady by its friendly name, Balance", () => {
    expect(summarizeWeek(["Steady", null, null, null, null, null, null]).headline).toBe("All Balance so far.");
  });

  it("describes ties and empty weeks kindly", () => {
    expect(summarizeWeek(["Inward", "Outward", null, null, null, null, null]).headline).toMatch(/mixed week/);
    expect(summarizeWeek(Array(7).fill(null)).headline).toMatch(/fills as you check in/);
  });
});
