import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidColor,
  AndroidDefaults,
  AndroidFlags,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

const STORAGE_KEY = '@namaz_notification_ids';
const AZAN_SOUND_FILE = 'azan_notification.wav';
const AZAN_SOUND_RESOURCE = 'azan_notification';
export const AZAN_CHANNEL_ID = 'azan-exact-alarm-v1';
export const PRAYER_TEXT_CHANNEL_ID = 'prayer-text-v1';
const LEGACY_AZAN_CHANNEL_IDS = ['azan', 'azan-v2', 'azan-alarm-v3', 'azan-alarm-v4'];
const AZAN_VIBRATION_PATTERN = [0, 700, 250, 700];
const STOP_ACTION_ID = 'stop-azan';
const OPEN_ACTION_ID = 'open-azan';

function getAndroidSound() {
  return AZAN_SOUND_RESOURCE;
}

function getIosSound() {
  return AZAN_SOUND_FILE;
}

async function readNotificationIds() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  return rawValue ? JSON.parse(rawValue) : {};
}

async function writeNotificationIds(ids) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function getStoredNotificationIds(notificationGroup) {
  if (!notificationGroup) {
    return [];
  }

  if (typeof notificationGroup === 'string') {
    return [notificationGroup];
  }

  return [notificationGroup.alarmId, notificationGroup.textId].filter(Boolean);
}

async function ensureNotificationAccess() {
  const settings = await notifee.requestPermission({
    sound: true,
    announcement: true,
    criticalAlert: false,
  });

  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

async function ensureAzanChannel() {
  if (Platform.OS !== 'android') {
    return AZAN_CHANNEL_ID;
  }

  await Promise.all(
    LEGACY_AZAN_CHANNEL_IDS.map((channelId) =>
      notifee.deleteChannel(channelId).catch(() => {})
    )
  );

  return notifee.createChannel({
    id: AZAN_CHANNEL_ID,
    name: 'Азан',
    badge: false,
    bypassDnd: true,
    description: 'Точный будильник азана для времени намаза',
    importance: AndroidImportance.HIGH,
    lights: true,
    lightColor: AndroidColor.YELLOW,
    sound: getAndroidSound(),
    vibration: true,
    vibrationPattern: AZAN_VIBRATION_PATTERN,
    visibility: AndroidVisibility.PUBLIC,
  });
}

async function ensurePrayerTextChannel() {
  if (Platform.OS !== 'android') {
    return PRAYER_TEXT_CHANNEL_ID;
  }

  return notifee.createChannel({
    id: PRAYER_TEXT_CHANNEL_ID,
    name: 'Намаз',
    badge: true,
    description: 'Текстовые уведомления о наступлении времени намаза',
    importance: AndroidImportance.HIGH,
    lights: true,
    lightColor: AndroidColor.YELLOW,
    vibration: true,
    visibility: AndroidVisibility.PUBLIC,
  });
}

async function ensureNotificationChannels() {
  await Promise.all([ensureAzanChannel(), ensurePrayerTextChannel()]);
}

function createExactAlarmTrigger(date) {
  return {
    alarmManager: {
      type: AlarmType.SET_ALARM_CLOCK,
    },
    timestamp: date.getTime(),
    type: TriggerType.TIMESTAMP,
  };
}

function formatTimeForNotification(date) {
  if (!date) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bishkek',
  }).format(date);
}

function preparePrayerNotification(prayer) {
  return {
    ...prayer,
    formattedTime: prayer.formattedTime || formatTimeForNotification(prayer.time),
    notificationKey: prayer.notificationKey || prayer.key,
  };
}

function createAzanNotification(prayer) {
  return {
    id: `${prayer.notificationKey}:alarm`,
    title: prayer.name,
    body: `Время намаза наступило (${prayer.formattedTime})`,
    data: {
      notificationKey: prayer.notificationKey,
      prayerKey: prayer.key,
      prayerName: prayer.name,
      source: 'azan-exact-alarm',
    },
    ios: {
      sound: getIosSound(),
    },
    android: {
      actions: [
        {
          title: 'Выключить звук',
          pressAction: {
            id: STOP_ACTION_ID,
          },
        },
      ],
      autoCancel: true,
      category: AndroidCategory.ALARM,
      channelId: AZAN_CHANNEL_ID,
      color: '#C9A84C',
      defaults: [AndroidDefaults.SOUND, AndroidDefaults.VIBRATE],
      flags: [AndroidFlags.FLAG_INSISTENT],
      fullScreenAction: {
        id: OPEN_ACTION_ID,
      },
      importance: AndroidImportance.HIGH,
      lightUpScreen: true,
      loopSound: false,
      ongoing: false,
      pressAction: {
        id: OPEN_ACTION_ID,
      },
      showChronometer: true,
      sound: getAndroidSound(),
      timestamp: prayer.time.getTime(),
      vibrationPattern: AZAN_VIBRATION_PATTERN,
      visibility: AndroidVisibility.PUBLIC,
    },
  };
}

function createPrayerTextNotification(prayer) {
  return {
    id: `${prayer.notificationKey}:text`,
    title: prayer.name,
    body: `Время намаза наступило (${prayer.formattedTime})`,
    data: {
      notificationKey: prayer.notificationKey,
      prayerKey: prayer.key,
      prayerName: prayer.name,
      source: 'prayer-text-notification',
    },
    android: {
      actions: [
        {
          title: 'Выключить звук',
          pressAction: {
            id: STOP_ACTION_ID,
          },
        },
      ],
      autoCancel: true,
      category: AndroidCategory.REMINDER,
      channelId: PRAYER_TEXT_CHANNEL_ID,
      color: '#C9A84C',
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: OPEN_ACTION_ID,
      },
      timestamp: prayer.time.getTime(),
      visibility: AndroidVisibility.PUBLIC,
    },
  };
}

export async function requestAzanSystemAccess() {
  if (Platform.OS === 'web') {
    return {
      batteryOptimizationEnabled: false,
      notificationGranted: false,
      platform: Platform.OS,
      powerManagerActivity: null,
      scheduledCount: 0,
    };
  }

  const notificationGranted = await ensureNotificationAccess();
  const scheduledNotifications = await notifee.getTriggerNotifications();
  const batteryOptimizationEnabled =
    Platform.OS === 'android'
      ? await notifee.isBatteryOptimizationEnabled().catch(() => false)
      : false;
  const powerManagerInfo =
    Platform.OS === 'android'
      ? await notifee.getPowerManagerInfo().catch(() => null)
      : null;

  if (Platform.OS === 'android') {
    await ensureNotificationChannels();
  }

  return {
    batteryOptimizationEnabled,
    notificationGranted,
    platform: Platform.OS,
    powerManagerActivity: powerManagerInfo?.activity || null,
    scheduledCount: scheduledNotifications.length,
  };
}

export async function openAzanBatterySettings() {
  if (Platform.OS !== 'android') {
    return;
  }

  const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled().catch(
    () => false
  );

  if (batteryOptimizationEnabled) {
    await notifee.openBatteryOptimizationSettings();
    return;
  }

  const powerManagerInfo = await notifee.getPowerManagerInfo().catch(() => null);

  if (powerManagerInfo?.activity) {
    await notifee.openPowerManagerSettings();
  }
}

export async function openAzanExactAlarmSettings() {
  if (Platform.OS === 'android') {
    await notifee.openAlarmPermissionSettings();
  }
}

export async function cancelPrayerNotification(prayerKey) {
  const ids = await readNotificationIds();
  const notificationIds = getStoredNotificationIds(ids[prayerKey]);

  if (!notificationIds.length) {
    return;
  }

  await Promise.all(
    notificationIds.map(async (notificationId) => {
      await notifee.cancelTriggerNotification(notificationId).catch(() => {});
      await notifee.cancelNotification(notificationId).catch(() => {});
    })
  );

  delete ids[prayerKey];
  await writeNotificationIds(ids);
}

export async function syncPrayerNotifications(schedule, notificationPrefs) {
  if (Platform.OS === 'web') {
    return;
  }

  const now = Date.now();
  const enabledSchedule = schedule.filter(
    (prayer) => notificationPrefs[prayer.key] && prayer.time && prayer.time.getTime() > now
  );
  const ids = await readNotificationIds();

  await Promise.all(
    Object.values(ids).flatMap((notificationGroup) =>
      getStoredNotificationIds(notificationGroup).map((notificationId) =>
        notifee.cancelTriggerNotification(notificationId).catch(() => {})
      )
    )
  );

  if (!enabledSchedule.length) {
    await writeNotificationIds({});
    return;
  }

  const hasAccess = await ensureNotificationAccess();

  if (!hasAccess) {
    return;
  }

  await ensureNotificationChannels();

  const nextIds = {};

  for (const prayer of enabledSchedule.slice(0, 50)) {
    const preparedPrayer = preparePrayerNotification(prayer);
    const trigger = createExactAlarmTrigger(preparedPrayer.time);
    const alarmId = await notifee.createTriggerNotification(
      createAzanNotification(preparedPrayer),
      trigger
    );
    const textId = await notifee.createTriggerNotification(
      createPrayerTextNotification(preparedPrayer),
      trigger
    );

    nextIds[preparedPrayer.notificationKey] = {
      alarmId,
      textId,
    };
  }

  await writeNotificationIds(nextIds);
}

export async function getNotificationDebugState() {
  if (Platform.OS === 'web') {
    return {
      azanChannelId: AZAN_CHANNEL_ID,
      azanChannelSound: null,
      batteryOptimizationEnabled: false,
      exactAlarmMode: 'web',
      granted: false,
      platform: Platform.OS,
      scheduledCount: 0,
      textChannelId: PRAYER_TEXT_CHANNEL_ID,
    };
  }

  const settings = await notifee.getNotificationSettings();
  const scheduledNotifications = await notifee.getTriggerNotifications();

  if (Platform.OS === 'android') {
    await ensureNotificationChannels();
  }

  const azanChannel =
    Platform.OS === 'android' ? await notifee.getChannel(AZAN_CHANNEL_ID).catch(() => null) : null;
  const textChannel =
    Platform.OS === 'android'
      ? await notifee.getChannel(PRAYER_TEXT_CHANNEL_ID).catch(() => null)
      : null;
  const batteryOptimizationEnabled =
    Platform.OS === 'android'
      ? await notifee.isBatteryOptimizationEnabled().catch(() => false)
      : false;
  const powerManagerInfo =
    Platform.OS === 'android'
      ? await notifee.getPowerManagerInfo().catch(() => null)
      : null;

  return {
    azanChannelId: AZAN_CHANNEL_ID,
    azanChannelSound: azanChannel?.sound || azanChannel?.soundURI || null,
    batteryOptimizationEnabled,
    exactAlarmMode: 'AlarmManager.SET_ALARM_CLOCK',
    granted: settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED,
    platform: Platform.OS,
    powerManagerActivity: powerManagerInfo?.activity || null,
    scheduledCount: scheduledNotifications.length,
    textChannelId: PRAYER_TEXT_CHANNEL_ID,
    textChannelSound: textChannel?.sound || textChannel?.soundURI || null,
  };
}

export async function sendTestAzanNotification(seconds = 2) {
  if (Platform.OS === 'web') {
    return {
      ok: false,
      message: 'Web не поддерживает локальные уведомления.',
    };
  }

  const hasAccess = await ensureNotificationAccess();

  if (!hasAccess) {
    return {
      ok: false,
      message: 'Нет разрешения на уведомления.',
    };
  }

  await ensureNotificationChannels();

  const fireDate = new Date(Date.now() + Math.max(1, seconds) * 1000);
  const preparedPrayer = preparePrayerNotification({
    key: 'test',
    name: 'Тест азана',
    notificationKey: `test-${Date.now()}`,
    time: fireDate,
  });
  const trigger = createExactAlarmTrigger(fireDate);

  await Promise.all([
    notifee.createTriggerNotification(createAzanNotification(preparedPrayer), trigger),
    notifee.createTriggerNotification(createPrayerTextNotification(preparedPrayer), trigger),
  ]);

  return {
    ok: true,
    message:
      seconds <= 2 ? 'Тестовый азан и пуш запланированы.' : `Азан и пуш через ${seconds} секунд.`,
  };
}

export async function triggerPrayerTimeTestInTenSeconds() {
  return sendTestAzanNotification(10);
}

export async function clearAllScheduledNotificationsForTesting() {
  if (Platform.OS === 'web') {
    return {
      ok: false,
      message: 'На web нечего очищать.',
    };
  }

  await notifee.cancelAllNotifications();
  await notifee.cancelTriggerNotifications();
  await writeNotificationIds({});

  return {
    ok: true,
    message: 'Все будильники и пуши намаза очищены.',
  };
}

export async function stopAzanNotification(notificationId, notificationKey) {
  if (Platform.OS === 'web') {
    return;
  }

  if (notificationKey) {
    const ids = await readNotificationIds();
    const notificationIds = getStoredNotificationIds(ids[notificationKey]);

    await Promise.all(
      notificationIds.map((linkedNotificationId) =>
        notifee.cancelNotification(linkedNotificationId).catch(() => {})
      )
    );
  }

  if (notificationId) {
    await notifee.cancelNotification(notificationId).catch(() => {});
  }

  await notifee.stopForegroundService().catch(() => {});
}

async function handleAzanNotificationEvent({ type, detail }) {
  const source = detail.notification?.data?.source;
  const isAzanNotification =
    source === 'azan-exact-alarm' || source === 'prayer-text-notification';

  if (!isAzanNotification) {
    return;
  }

  const shouldStop =
    type === EventType.DISMISSED ||
    type === EventType.PRESS ||
    (type === EventType.ACTION_PRESS && detail.pressAction?.id === STOP_ACTION_ID);

  if (!shouldStop) {
    return;
  }

  await stopAzanNotification(detail.notification?.id, detail.notification?.data?.notificationKey);
}

export function registerAzanBackgroundEvents() {
  notifee.onBackgroundEvent(handleAzanNotificationEvent);

  notifee.onForegroundEvent((event) => {
    handleAzanNotificationEvent(event).catch(() => {});
  });
}
