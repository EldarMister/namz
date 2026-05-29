import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = '@namaz_notification_ids';

async function readNotificationIds() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  return rawValue ? JSON.parse(rawValue) : {};
}

async function writeNotificationIds(ids) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

async function ensureNotificationAccess() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function createDailyTrigger(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dailyType = Notifications.SchedulableTriggerInputTypes?.DAILY;

  if (dailyType) {
    return {
      type: dailyType,
      channelId: 'azan',
      hour,
      minute,
    };
  }

  return {
    hour,
    minute,
    repeats: true,
  };
}

export async function cancelPrayerNotification(prayerKey) {
  const ids = await readNotificationIds();
  const notificationId = ids[prayerKey];

  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
  delete ids[prayerKey];
  await writeNotificationIds(ids);
}

export async function syncPrayerNotifications(schedule, notificationPrefs) {
  if (Platform.OS === 'web') {
    return;
  }

  const hasEnabledPrayer = schedule.some((prayer) => notificationPrefs[prayer.key]);
  const ids = await readNotificationIds();

  if (!hasEnabledPrayer) {
    await Promise.all(
      Object.values(ids).map((notificationId) =>
        Notifications.cancelScheduledNotificationAsync(notificationId)
      )
    );
    await writeNotificationIds({});
    return;
  }

  const hasAccess = await ensureNotificationAccess();

  if (!hasAccess) {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('azan', {
      name: 'Азан',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const nextIds = { ...ids };

  for (const prayer of schedule) {
    if (nextIds[prayer.key]) {
      await Notifications.cancelScheduledNotificationAsync(nextIds[prayer.key]);
      delete nextIds[prayer.key];
    }

    if (!notificationPrefs[prayer.key]) {
      continue;
    }

    // Ежедневный триггер пересоздаётся после смены метода расчёта или города.
    nextIds[prayer.key] = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Время намаза: ${prayer.name}`,
        body: `Наступило время ${prayer.name}`,
        sound: 'default',
      },
      trigger: createDailyTrigger(prayer.time),
    });
  }

  await writeNotificationIds(nextIds);
}
