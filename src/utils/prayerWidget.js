import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Platform } from 'react-native';

import { DEFAULT_LANGUAGE, normalizeLanguage } from '../constants/i18n';
import { DEFAULT_CITY_ID, getCityName, normalizeCityId } from '../constants/kyrgyzstanCities';
import { APP_SETTINGS_STORAGE_KEY } from '../constants/storageKeys';
import { formatPrayerTime, getNextPrayer, getPrayerSchedule } from './prayerTimes';

export const PRAYER_WIDGET_NAME = 'PrayerTimes';

const DEFAULT_WIDGET_SETTINGS = {
  language: DEFAULT_LANGUAGE,
  selectedCityId: DEFAULT_CITY_ID,
  showIshraq: true,
  showTahajjud: true,
};

function minutesUntil(date, now) {
  if (!date) {
    return 0;
  }

  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 60000));
}

function formatCountdown(minutes) {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return `${hours}:${String(restMinutes).padStart(2, '0')}`;
}

function formatRelativeTime(language, minutes) {
  if (minutes <= 0) {
    return language === 'ru' ? 'сейчас' : 'азыр';
  }

  if (minutes < 60) {
    return language === 'ru' ? `через ${minutes} мин` : `${minutes} мүнөттөн кийин`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (language === 'ru') {
    return restMinutes ? `через ${hours} ч ${restMinutes} мин` : `через ${hours} ч`;
  }

  return restMinutes ? `${hours} с ${restMinutes} мүнөттөн кийин` : `${hours} сааттан кийин`;
}

function getWidgetIconVariant(prayerKey) {
  if (['fajr', 'maghrib', 'isha', 'tahajjud'].includes(prayerKey)) {
    return 'moon';
  }

  return 'sun';
}

export function normalizeWidgetSettings(settings = {}) {
  return {
    language: normalizeLanguage(settings.language),
    selectedCityId: normalizeCityId(settings.selectedCityId),
    showIshraq: settings.showIshraq ?? DEFAULT_WIDGET_SETTINGS.showIshraq,
    showTahajjud: settings.showTahajjud ?? DEFAULT_WIDGET_SETTINGS.showTahajjud,
  };
}

export async function readWidgetSettings() {
  const rawValue = await AsyncStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  const savedSettings = rawValue ? JSON.parse(rawValue) : null;

  return normalizeWidgetSettings(savedSettings || DEFAULT_WIDGET_SETTINGS);
}

export function buildPrayerWidgetData(settings = DEFAULT_WIDGET_SETTINGS, now = new Date()) {
  const widgetSettings = normalizeWidgetSettings(settings);
  const scheduleOptions = {
    language: widgetSettings.language,
    showIshraq: widgetSettings.showIshraq,
    showTahajjud: widgetSettings.showTahajjud,
  };
  const schedule = getPrayerSchedule(widgetSettings.selectedCityId, now, scheduleOptions);
  const nextPrayer = getNextPrayer(schedule, widgetSettings.selectedCityId, now, scheduleOptions);
  const minutes = minutesUntil(nextPrayer?.time, now);
  const prayerTime = formatPrayerTime(nextPrayer?.time);
  const prayerName = nextPrayer?.name || '';

  return {
    city: getCityName(widgetSettings.selectedCityId, widgetSettings.language),
    countdownText: formatCountdown(minutes),
    iconVariant: getWidgetIconVariant(nextPrayer?.key),
    label: widgetSettings.language === 'ru' ? 'Следующий намаз' : 'Кийинки намаз',
    prayerName,
    prayerSummary: `${prayerName} • ${prayerTime}`,
    relativeTime: formatRelativeTime(widgetSettings.language, minutes),
    time: prayerTime,
    updatedAt: formatPrayerTime(now),
  };
}

export async function updatePrayerWidget(settings) {
  if (Platform.OS !== 'android') {
    return;
  }

  const { requestWidgetUpdate } = require('react-native-android-widget');
  const { PrayerTimesWidget } = require('../widgets/PrayerTimesWidget');
  const widgetData = buildPrayerWidgetData(settings || (await readWidgetSettings()));

  await requestWidgetUpdate({
    widgetName: PRAYER_WIDGET_NAME,
    renderWidget: () => <PrayerTimesWidget {...widgetData} />,
    widgetNotFound: () => {},
  });
}
