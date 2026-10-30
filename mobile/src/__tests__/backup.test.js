import { toBackup, mergeBackup, BACKUP_CATEGORIES, DEFAULT_BACKUP } from "../lib/backup";

const data = {
  onboarded: true,
  agreement: { version: 2, acceptedAt: "2026-10-01T09:00:00.000Z" },
  profile: { lastPeriod: "2026-10-09", cycleLength: 29, baselinePhoto: "file://me.jpg", tracking: { training: true, nutrition: false } },
  days: {
    "2026-10-29": {
      vibe: "Inward",
      triad: { flow: ["Heavy"] },
      entry: { prescribed: "rest", completed: true },
      movement: 20,
      cardio: "zone2",
      food: { kcal: 600, protein: 40, plates: 0 },
      bufferAccepted: true,
    },
  },
};

describe("backup categories", () => {
  it("start with nothing ticked", () => {
    expect(Object.values(DEFAULT_BACKUP).every((v) => v === false)).toBe(true);
    expect(BACKUP_CATEGORIES.map((c) => c.key).sort()).toEqual(Object.keys(DEFAULT_BACKUP).sort());
  });

  it("never include the baseline photo", () => {
    for (const { key } of BACKUP_CATEGORIES) expect(JSON.stringify(toBackup(data, key))).not.toContain("me.jpg");
  });

  it("send only the fields that belong to each category", () => {
    expect(toBackup(data, "logs").days["2026-10-29"]).toEqual({
      vibe: "Inward",
      triad: { flow: ["Heavy"] },
      entry: { prescribed: "rest", completed: true },
    });
    expect(toBackup(data, "training").days["2026-10-29"]).toEqual({ movement: 20, cardio: "zone2" });
    expect(toBackup(data, "nutrition").days["2026-10-29"]).toEqual({ food: { kcal: 600, protein: 40, plates: 0 }, bufferAccepted: true });
    expect(toBackup(data, "cycle").profile).toMatchObject({ cycleLength: 29, tracking: { training: true, nutrition: false } });
  });
});

describe("restoring a backup", () => {
  const fresh = { onboarded: false, agreement: null, profile: { lastPeriod: "2026-10-01", cycleLength: 28, baselinePhoto: null }, days: {} };

  it("brings the cycle details to a new phone but keeps its own photo", () => {
    const merged = mergeBackup({ ...fresh, profile: { ...fresh.profile, baselinePhoto: "file://new.jpg" } }, "cycle", toBackup(data, "cycle"));
    expect(merged.profile.cycleLength).toBe(29);
    expect(merged.profile.baselinePhoto).toBe("file://new.jpg");
    expect(merged.onboarded).toBe(true);
  });

  it("lets this phone win on the same day and adds the other days", () => {
    const local = { ...fresh, days: { "2026-10-29": { vibe: "Outward" } } };
    const remote = { days: { "2026-10-29": { vibe: "Inward" }, "2026-10-28": { vibe: "Steady" } } };
    const merged = mergeBackup(local, "logs", remote);
    expect(merged.days["2026-10-29"].vibe).toBe("Outward");
    expect(merged.days["2026-10-28"].vibe).toBe("Steady");
  });

  it("ignores an empty payload", () => {
    expect(mergeBackup(fresh, "logs", null)).toBe(fresh);
  });
});
