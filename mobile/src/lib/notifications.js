import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";
import { MOMENT_IMAGE } from "../content/moments";
import { MOMENT_TEXT, notificationTimes, upcomingMoments } from "./moments";
import { newId } from "./food";

/* ---------------------------------------------------------------
   PHONE NOTIFICATIONS — scheduled on the phone, sent from the phone.

   Nothing goes to a server. They come in the evening, and only up to
   72 hours ahead: the plan is rewritten each time the app opens, so
   after three days away Selena goes quiet by itself.
   --------------------------------------------------------------- */

const ON_PHONE = Platform.OS === "ios";

if (ON_PHONE) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Ask once; true when the phone allows notifications. */
export const askPermission = async () => {
  if (!ON_PHONE) return false;
  const now = await Notifications.getPermissionsAsync();
  if (now.granted) return true;
  const next = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } });
  return next.granted;
};

/** iOS moves the file it is given, so each notification gets its own copy. */
const attachment = async (key) => {
  try {
    const asset = Asset.fromModule(MOMENT_IMAGE[key]);
    await asset.downloadAsync();
    const gif = asset.type === "gif";
    const copy = new File(Paths.cache, `moment-${newId()}.${asset.type}`);
    new File(asset.localUri).copy(copy);
    return [{ identifier: key, url: copy.uri, typeHint: gif ? "com.compuserve.gif" : "public.jpeg" }];
  } catch {
    return [];
  }
};

const send = async (key, trigger) =>
  Notifications.scheduleNotificationAsync({
    content: { title: "Selena", body: MOMENT_TEXT[key], data: { moment: key }, attachments: await attachment(key) },
    trigger,
  });

/** Replace what is planned with the moments due in the next three days. */
export const planNotifications = async (profile, todayKey, now = new Date()) => {
  if (!ON_PHONE) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!profile.notifications) return;
  for (const m of notificationTimes(upcomingMoments(profile, todayKey), now)) {
    await send(m.key, { type: Notifications.SchedulableTriggerInputTypes.DATE, date: m.at });
  }
};

/** A sample, a few seconds from now, to see how one arrives. */
export const sendSample = async (key = "period-here") => {
  if (!ON_PHONE) return;
  await send(key, { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 });
};

/** Tapping a notification opens its picture in the app. */
export const onNotificationTap = (open) => {
  if (!ON_PHONE) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const key = r.notification.request.content.data?.moment;
    if (key) open(key);
  });
  return () => sub.remove();
};
