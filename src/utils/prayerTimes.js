import {
  CalculationMethod,
  Coordinates,
  PrayerTimes,
} from 'adhan';

import { PRAYERS } from '../constants/prayers';

export const DEFAULT_METHOD = 'MWL';

export function getCalculationParams() {
  // Единственный метод расчёта в приложении: Muslim World League.
  return CalculationMethod.MuslimWorldLeague();
}

export function getPrayerSchedule(coords, date = new Date()) {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = getCalculationParams();
  const times = new PrayerTimes(coordinates, date, params);

  return PRAYERS.map((prayer) => ({
    ...prayer,
    time: times[prayer.key],
  }));
}

export function getActivePrayerKey(schedule, now = new Date()) {
  const passedPrayer = [...schedule]
    .reverse()
    .find((prayer) => now >= prayer.time);

  // До Фаджра активным остаётся Иша предыдущего дня.
  return passedPrayer?.key || 'isha';
}

export function getNextPrayer(schedule, coords, now = new Date()) {
  const nextToday = schedule.find((prayer) => prayer.time > now);

  if (nextToday) {
    return nextToday;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getPrayerSchedule(coords, tomorrow)[0];
}

export function getPrayerState(coords, now = new Date()) {
  const schedule = getPrayerSchedule(coords, now);

  return {
    schedule,
    activePrayerKey: getActivePrayerKey(schedule, now),
    nextPrayer: getNextPrayer(schedule, coords, now),
  };
}

export function formatPrayerTime(date) {
  if (!date) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
