/* ---------------------------------------------------------------
   NOTIFICATIONS — evening only, and silence after a long absence.
   --------------------------------------------------------------- */

export const EVENING = Object.freeze({ startHour: 19, endHour: 21 });
export const SUNSET_HOURS = 72;

const HOUR = 60 * 60 * 1000;

export const NOTIFICATION_TEMPLATES = [
  "Your evening check-in is here whenever you want it.",
  "A quiet moment to log how today felt.",
  "Tomorrow's plan is ready. Nothing to do tonight.",
  "Your body did a lot today. Rest counts.",
];

/** 72-Hour Sunset Protocol: after three days away, go silent. */
export const sunset = (lastActive, now = Date.now()) => {
  const away = new Date(now).getTime() - new Date(lastActive).getTime();
  return away >= SUNSET_HOURS * HOUR;
};

export const isEveningWindow = (time) => {
  const h = new Date(time).getHours();
  return h >= EVENING.startHour && h < EVENING.endHour;
};

/** The next evening slot at or after `now`, or nothing if tracking is paused. */
export const scheduleNotifications = ({ now = Date.now(), lastActive, template = NOTIFICATION_TEMPLATES[0] }) => {
  if (lastActive != null && sunset(lastActive, now)) return [];

  const at = new Date(now);
  if (at.getHours() >= EVENING.endHour) at.setDate(at.getDate() + 1);
  if (at.getHours() < EVENING.startHour || at.getHours() >= EVENING.endHour) {
    at.setHours(EVENING.startHour, 0, 0, 0);
  }
  return [{ at: at.getTime(), body: template }];
};

/** On the next open: clear the pause, say nothing about the gap. */
export const resumeOnOpen = (now = Date.now()) => ({ paused: false, lastActive: new Date(now).getTime(), message: null });
