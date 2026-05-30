import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
} from 'adhan';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

import {
  DEFAULT_CITY_ID,
  getCityById,
  KYRGYZSTAN_TIME_ZONE,
} from '../constants/kyrgyzstanCities';
import { getDisplayPrayerDefinitions } from '../constants/prayers';

export const DEFAULT_METHOD = 'KG_MUFTIYAT';
export const PRAYER_TIME_ZONE = KYRGYZSTAN_TIME_ZONE;
export const FAJR_ANGLE = 18;
export const ISHA_ANGLE = 15;
export const ISHRAQ_OFFSET_MINUTES = 13;
export const TAHAJJUD_OFFSET_MINUTES = -108;

function getTimeZoneParts(date) {
  const zonedDate = toZonedTime(date, PRAYER_TIME_ZONE);

  return {
    day: zonedDate.getDate(),
    month: zonedDate.getMonth() + 1,
    year: zonedDate.getFullYear(),
  };
}

export function getPrayerDateKey(date = new Date()) {
  return formatInTimeZone(date, PRAYER_TIME_ZONE, 'yyyy-MM-dd');
}

export function getPrayerDate(date = new Date(), dayOffset = 0) {
  const parts = getTimeZoneParts(date);
  return new Date(parts.year, parts.month - 1, parts.day + dayOffset, 12);
}

export function getCalculationParams() {
  const params = CalculationMethod.Other();

  // Метод КМДБ Кыргызстана: углы 18/15, Ханафи и региональный ихтият.
  params.fajrAngle = FAJR_ANGLE;
  params.ishaAngle = ISHA_ANGLE;
  params.maghribAngle = 0;
  params.adjustments.fajr = 1;
  params.adjustments.sunrise = 0;
  params.adjustments.dhuhr = 0;
  params.adjustments.asr = 0;
  params.adjustments.maghrib = 3;
  params.adjustments.isha = 6;
  params.madhab = Madhab.Hanafi;
  params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

  return params;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getPrayerTime(prayerKey, times) {
  if (prayerKey === 'ishraq') {
    return addMinutes(times.sunrise, ISHRAQ_OFFSET_MINUTES);
  }

  if (prayerKey === 'tahajjud') {
    return addMinutes(times.fajr, TAHAJJUD_OFFSET_MINUTES);
  }

  return times[prayerKey];
}

function calculateAdhanPrayerTimes(cityId = DEFAULT_CITY_ID, date = new Date(), dayOffset = 0) {
  const city = getCityById(cityId);
  const coordinates = new Coordinates(city.latitude, city.longitude);
  const params = getCalculationParams();
  const calculationDate = getPrayerDate(date, dayOffset);

  return new PrayerTimes(coordinates, calculationDate, params);
}

function mapPrayerTimes(times) {
  return {
    fajr: times.fajr,
    shuruq: times.sunrise,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function getPrayerTimes(cityId = DEFAULT_CITY_ID, date = new Date()) {
  return mapPrayerTimes(calculateAdhanPrayerTimes(cityId, date));
}

function getPrayerScheduleForDay(cityId = DEFAULT_CITY_ID, date = new Date(), options = {}, dayOffset = 0) {
  const rawTimes = calculateAdhanPrayerTimes(cityId, date, dayOffset);
  const times = mapPrayerTimes(rawTimes);

  return getDisplayPrayerDefinitions(options, options.language).map((prayer) => ({
    ...prayer,
    time: getPrayerTime(prayer.key, times),
  }));
}

export function getPrayerSchedule(cityId = DEFAULT_CITY_ID, date = new Date(), options = {}) {
  return getPrayerScheduleForDay(cityId, date, options);
}

export function getActivePrayerKey(schedule, now = new Date()) {
  const passedPrayer = [...schedule]
    .reverse()
    .find((prayer) => prayer.time && now >= prayer.time);

  // До Фаджра активным остаётся Иша предыдущего дня.
  return passedPrayer?.key || 'isha';
}

export function getNextPrayer(schedule, cityId = DEFAULT_CITY_ID, now = new Date(), options = {}) {
  const nextToday = schedule.find((prayer) => prayer.time && prayer.time > now);

  if (nextToday) {
    return nextToday;
  }

  return getPrayerScheduleForDay(cityId, now, options, 1)[0];
}

export function getPrayerState(cityId = DEFAULT_CITY_ID, now = new Date(), options = {}) {
  const schedule = getPrayerSchedule(cityId, now, options);

  return {
    schedule,
    activePrayerKey: getActivePrayerKey(schedule, now),
    nextPrayer: getNextPrayer(schedule, cityId, now, options),
  };
}

export function formatPrayerTime(date) {
  if (!date) {
    return '--:--';
  }

  return formatInTimeZone(date, PRAYER_TIME_ZONE, 'HH:mm');
}
