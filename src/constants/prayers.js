export const PRAYERS = [
  {
    key: 'fajr',
    name: 'Фаджр',
    icon: 'moon-waning-crescent',
  },
  {
    key: 'sunrise',
    name: 'Восход',
    icon: 'weather-sunset-up',
  },
  {
    key: 'dhuhr',
    name: 'Зухр',
    icon: 'white-balance-sunny',
  },
  {
    key: 'asr',
    name: 'Аср',
    icon: 'weather-partly-cloudy',
  },
  {
    key: 'maghrib',
    name: 'Магриб',
    icon: 'weather-sunset-down',
  },
  {
    key: 'isha',
    name: 'Иша',
    icon: 'weather-night',
  },
];

export const DEFAULT_NOTIFICATION_PREFS = PRAYERS.reduce((acc, prayer) => {
  acc[prayer.key] = true;
  return acc;
}, {});
