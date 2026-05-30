export const DEFAULT_LANGUAGE = 'ky';

export const LANGUAGES = [
  {
    key: 'ky',
    label: 'Кыргызча',
  },
  {
    key: 'ru',
    label: 'Русский',
  },
];

const TRANSLATIONS = {
  ky: {
    asr: 'Аср',
    azan1: 'Азан 1',
    builtInWallpapers: 'ДАЯР ФОНДОР',
    choosePhoto: 'Сүрөт тандоо',
    city: 'Шаар',
    compass: 'Компас',
    countdownLabel: 'КИЙИНКИ НАМАЗГА ЧЕЙИН',
    customPhoto: 'Өз сүрөтү',
    gallery: 'ГАЛЕРЕЯ',
    general: 'ЖАЛПЫ',
    home: 'Башкы',
    homeWallpaper: 'Башкы беттин фону',
    language: 'Тил',
    locationDenied: 'GPS уруксатын бериңиз',
    locationLoading: 'Жайгашкан жер аныкталууда...',
    locationUnavailable: 'Жайгашкан жер жеткиликсиз',
    next: 'Кийинки',
    nextPrayerIn: 'Кийинки намазга чейин',
    nightMosque: 'Түнкү мечит',
    sunsetMosque: 'Күн баткан мечит',
    notifications: 'КАБАРЛАМАЛАР',
    notificationSound: 'Кабарлама үнү',
    prayerFallback: 'намаз',
    pullUp: 'Жогору тартыңыз',
    region: 'Облус',
    selectRegion: 'Облусту тандоо',
    selectLanguage: 'Тилди тандоо',
    selectCity: 'Шаарды тандоо',
    settings: 'Жөндөөлөр',
    showIshraq: 'Ишракты көрсөтүү',
    showTahajjud: 'Тахажжудду көрсөтүү',
    soon: 'Жакында',
    currentLocation: 'Учурдагы жайгашуу',
    wallpaper: 'Фон',
  },
  ru: {
    asr: 'Аср',
    azan1: 'Азан 1',
    builtInWallpapers: 'ГОТОВЫЕ ФОНЫ',
    choosePhoto: 'Выбрать фото',
    city: 'Город',
    compass: 'Компас',
    countdownLabel: 'ДО СЛЕДУЮЩЕГО НАМАЗА',
    customPhoto: 'Свое фото',
    gallery: 'ГАЛЕРЕЯ',
    general: 'ОБЩЕЕ',
    home: 'Главный',
    homeWallpaper: 'Фон главной страницы',
    language: 'Язык',
    locationDenied: 'Разрешите доступ к GPS',
    locationLoading: 'Определяем местоположение...',
    locationUnavailable: 'Местоположение недоступно',
    next: 'Следующий',
    nextPrayerIn: 'До следующего намаза',
    nightMosque: 'Ночная мечеть',
    sunsetMosque: 'Мечеть на закате',
    notifications: 'УВЕДОМЛЕНИЯ',
    notificationSound: 'Звук уведомлений',
    prayerFallback: 'намаз',
    pullUp: 'Потяните вверх',
    region: 'Область',
    selectRegion: 'Выберите область',
    selectLanguage: 'Выберите язык',
    selectCity: 'Выберите город',
    settings: 'Настройки',
    showIshraq: 'Показать Ишрак',
    showTahajjud: 'Показать Тахаджуд',
    soon: 'Скоро',
    currentLocation: 'Текущее местоположение',
    wallpaper: 'Фон',
  },
};

const PRAYER_NAMES = {
  ky: {
    fajr: 'Багымдат',
    sunrise: 'Күн чыгыш',
    ishraq: 'Ишрак',
    dhuhr: 'Бешим',
    asr: 'Аср',
    maghrib: 'Шам',
    isha: 'Куптан',
    tahajjud: 'Тахажжуд',
  },
  ru: {
    fajr: 'Фаджр',
    sunrise: 'Восход',
    ishraq: 'Ишрак',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша',
    tahajjud: 'Тахаджуд',
  },
};

export function normalizeLanguage(language) {
  return LANGUAGES.some((item) => item.key === language) ? language : DEFAULT_LANGUAGE;
}

export function t(language, key) {
  const normalizedLanguage = normalizeLanguage(language);
  return TRANSLATIONS[normalizedLanguage][key] || TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
}

export function getLanguageLabel(language) {
  const normalizedLanguage = normalizeLanguage(language);
  return LANGUAGES.find((item) => item.key === normalizedLanguage)?.label || LANGUAGES[0].label;
}

export function getPrayerName(language, prayerKey) {
  const normalizedLanguage = normalizeLanguage(language);
  return PRAYER_NAMES[normalizedLanguage][prayerKey] || PRAYER_NAMES[DEFAULT_LANGUAGE][prayerKey] || prayerKey;
}
