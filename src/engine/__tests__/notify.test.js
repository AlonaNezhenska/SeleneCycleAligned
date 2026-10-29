import { describe, it, expect } from "vitest";
import {
  sunset,
  scheduleNotifications,
  isEveningWindow,
  resumeOnOpen,
  NOTIFICATION_TEMPLATES,
  EVENING,
} from "../notify.js";
import { findBlocked } from "../copy.js";

const at = (d, h, m = 0) => new Date(2026, 9, d, h, m).getTime();
const HOUR = 60 * 60 * 1000;

describe("72-Hour Sunset Protocol", () => {
  it("pauses at exactly 72 hours away", () => {
    expect(sunset(at(20, 12), at(20, 12) + 72 * HOUR)).toBe(true);
    expect(sunset(at(20, 12), at(20, 12) + 71 * HOUR)).toBe(false);
  });

  it("schedules zero notifications once paused", () => {
    expect(scheduleNotifications({ now: at(25, 9), lastActive: at(20, 9) })).toEqual([]);
  });

  it("resumes quietly on the next open", () => {
    const r = resumeOnOpen(at(25, 9));
    expect(r).toEqual({ paused: false, lastActive: at(25, 9), message: null });
    expect(scheduleNotifications({ now: at(25, 9), lastActive: r.lastActive })).toHaveLength(1);
  });
});

describe("Evening-only notifications", () => {
  it("moves a morning request to 19:00 the same day", () => {
    const [n] = scheduleNotifications({ now: at(29, 7), lastActive: at(29, 6) });
    expect(n.at).toBe(at(29, 19));
  });

  it("keeps a time already inside the window", () => {
    const [n] = scheduleNotifications({ now: at(29, 20, 15), lastActive: at(29, 20) });
    expect(n.at).toBe(at(29, 20, 15));
  });

  it("rolls past 21:00 to the next evening", () => {
    const [n] = scheduleNotifications({ now: at(29, 22), lastActive: at(29, 21) });
    expect(n.at).toBe(at(30, 19));
  });

  it("never schedules anything in the morning", () => {
    for (let h = 0; h < 24; h++) {
      const out = scheduleNotifications({ now: at(29, h), lastActive: at(29, 0) });
      for (const n of out) {
        expect(isEveningWindow(n.at)).toBe(true);
        expect(new Date(n.at).getHours()).toBeGreaterThanOrEqual(EVENING.startHour);
      }
    }
  });

  it("every template passes the copy blocklist", () => {
    for (const t of NOTIFICATION_TEMPLATES) expect(findBlocked(t)).toEqual([]);
  });
});
