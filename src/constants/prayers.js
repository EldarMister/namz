import { getPrayerName } from './i18n';

export const PRAYERS = [
  {
    key: 'fajr',
    icon: 'moon-waning-crescent',
  },
  {
    key: 'sunrise',
    icon: 'weather-sunset-up',
  },
  {
    key: 'dhuhr',
    icon: 'white-balance-sunny',
  },
  {
    key: 'asr',
    icon: 'weather-partly-cloudy',
  },
  {
    key: 'maghrib',
    icon: 'weather-sunset-down',
  },
  {
    key: 'isha',
    icon: 'weather-night',
  },
];

export const ISHRAQ_PRAYER = {
  key: 'ishraq',
};

export const TAHAJJUD_PRAYER = {
  key: 'tahajjud',
};

export function getDisplayPrayerDefinitions(options = {}, language) {
  const prayers = [];

  for (const prayer of PRAYERS) {
    prayers.push(prayer);

    if (prayer.key === 'sunrise' && options.showIshraq) {
      prayers.push(ISHRAQ_PRAYER);
    }

    if (prayer.key === 'isha' && options.showTahajjud) {
      prayers.push(TAHAJJUD_PRAYER);
    }
  }

  return prayers.map((prayer) => ({
    ...prayer,
    name: getPrayerName(language, prayer.key),
  }));
}

export const DEFAULT_NOTIFICATION_PREFS = PRAYERS.reduce((acc, prayer) => {
  acc[prayer.key] = true;
  return acc;
}, {});
