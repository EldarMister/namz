export const KYRGYZSTAN_TIME_ZONE = 'Asia/Bishkek';
export const KYRGYZSTAN_UTC_OFFSET = 6;
export const DEFAULT_CITY_ID = 'bishkek';

export const KYRGYZSTAN_REGIONS = [
  {
    id: 'republican',
    names: {
      ky: 'Республикалык маанидеги шаарлар',
      ru: 'Города республиканского значения',
    },
    cities: [
      {
        id: 'bishkek',
        latitude: 42.8746,
        longitude: 74.5698,
        names: { ky: 'Бишкек', ru: 'Бишкек' },
      },
      {
        id: 'osh',
        latitude: 40.514,
        longitude: 72.8161,
        names: { ky: 'Ош', ru: 'Ош' },
      },
    ],
  },
  {
    id: 'chuy',
    names: {
      ky: 'Чүй облусу',
      ru: 'Чуйская область',
    },
    cities: [
      { id: 'tokmok', latitude: 42.8419, longitude: 75.3015, names: { ky: 'Токмок', ru: 'Токмок' } },
      { id: 'kara-balta', latitude: 42.8167, longitude: 73.85, names: { ky: 'Кара-Балта', ru: 'Кара-Балта' } },
      { id: 'kant', latitude: 42.891, longitude: 74.8512, names: { ky: 'Кант', ru: 'Кант' } },
      { id: 'shopokov', latitude: 42.8604, longitude: 74.3353, names: { ky: 'Шопоков', ru: 'Шопоков' } },
      { id: 'kemin', latitude: 42.7846, longitude: 75.6888, names: { ky: 'Кемин', ru: 'Кемин' } },
      { id: 'belovodskoe', latitude: 42.8307, longitude: 74.1117, names: { ky: 'Беловодское', ru: 'Беловодское' } },
      { id: 'sokuluk', latitude: 42.8759, longitude: 74.2936, names: { ky: 'Сокулук', ru: 'Сокулук' } },
    ],
  },
  {
    id: 'jalal-abad-region',
    names: {
      ky: 'Жалал-Абад облусу',
      ru: 'Джалал-Абадская область',
    },
    cities: [
      { id: 'jalal-abad', latitude: 40.9333, longitude: 73, names: { ky: 'Жалал-Абад', ru: 'Джалал-Абад' } },
      { id: 'suzak', latitude: 40.9, longitude: 72.9167, names: { ky: 'Сузак', ru: 'Сузак' } },
      { id: 'bazar-korgon', latitude: 41.0361, longitude: 72.7456, names: { ky: 'Базар-Коргон', ru: 'Базар-Коргон' } },
      { id: 'nooken', latitude: 41.0622, longitude: 72.4789, names: { ky: 'Ноокен', ru: 'Ноокен' } },
      { id: 'kochkor-ata', latitude: 41.1614, longitude: 72.4811, names: { ky: 'Кочкор-Ата', ru: 'Кочкор-Ата' } },
      { id: 'mailuu-suu', latitude: 41.2561, longitude: 72.4644, names: { ky: 'Майлуу-Суу', ru: 'Майлуу-Суу' } },
      { id: 'tash-kumyr', latitude: 41.3456, longitude: 72.2172, names: { ky: 'Таш-Кумыр', ru: 'Таш-Кумыр' } },
      { id: 'shamaldy-say', latitude: 41.3283, longitude: 72.1814, names: { ky: 'Шамалды-Сай', ru: 'Шамалды-Сай' } },
      { id: 'kara-kul', latitude: 41.6258, longitude: 72.6683, names: { ky: 'Кара-Куль', ru: 'Кара-Куль' } },
      { id: 'toktogul', latitude: 41.8708, longitude: 72.9406, names: { ky: 'Токтогул', ru: 'Токтогул' } },
      { id: 'kerben', latitude: 41.4939, longitude: 71.7578, names: { ky: 'Кербен', ru: 'Кербен' } },
      { id: 'ala-buka', latitude: 41.4064, longitude: 71.4642, names: { ky: 'Ала-Бука', ru: 'Ала-Бука' } },
      { id: 'kanysh-kyya', latitude: 41.7514, longitude: 71.0608, names: { ky: 'Каныш-Кыя', ru: 'Каныш-Кыя' } },
    ],
  },
  {
    id: 'osh-region',
    names: {
      ky: 'Ош облусу',
      ru: 'Ошская область',
    },
    cities: [
      { id: 'kara-suu', latitude: 40.7042, longitude: 72.8667, names: { ky: 'Кара-Суу', ru: 'Кара-Суу' } },
      { id: 'uzgen', latitude: 40.7694, longitude: 73.3008, names: { ky: 'Өзгөн', ru: 'Узген' } },
      { id: 'nookat', latitude: 40.2667, longitude: 72.6167, names: { ky: 'Ноокат', ru: 'Ноокат' } },
      { id: 'aravan', latitude: 40.5152, longitude: 72.4954, names: { ky: 'Араван', ru: 'Араван' } },
      { id: 'gulcha', latitude: 40.3208, longitude: 73.4356, names: { ky: 'Гүлчө', ru: 'Гульча' } },
      { id: 'daroot-korgon', latitude: 39.5539, longitude: 72.2111, names: { ky: 'Дароот-Коргон', ru: 'Дароот-Коргон' } },
    ],
  },
  {
    id: 'batken-region',
    names: {
      ky: 'Баткен облусу',
      ru: 'Баткенская область',
    },
    cities: [
      { id: 'batken', latitude: 40.0625, longitude: 70.8194, names: { ky: 'Баткен', ru: 'Баткен' } },
      { id: 'kyzyl-kiya', latitude: 40.2598, longitude: 72.1308, names: { ky: 'Кызыл-Кыя', ru: 'Кызыл-Кыя' } },
      { id: 'sulukta', latitude: 39.9333, longitude: 69.5667, names: { ky: 'Сүлүктү', ru: 'Сулюкта' } },
      { id: 'kadamjay', latitude: 40.1283, longitude: 71.7222, names: { ky: 'Кадамжай', ru: 'Кадамжай' } },
      { id: 'isfana', latitude: 39.8406, longitude: 69.5303, names: { ky: 'Исфана', ru: 'Исфана' } },
      { id: 'aidarken', latitude: 39.9372, longitude: 71.3436, names: { ky: 'Айдаркен', ru: 'Айдаркен' } },
    ],
  },
  {
    id: 'issyk-kul',
    names: {
      ky: 'Ысык-Көл облусу',
      ru: 'Иссык-Кульская область',
    },
    cities: [
      { id: 'karakol', latitude: 42.4907, longitude: 78.3936, names: { ky: 'Каракол', ru: 'Каракол' } },
      { id: 'balykchy', latitude: 42.4601, longitude: 76.1811, names: { ky: 'Балыкчы', ru: 'Балыкчы' } },
      { id: 'cholpon-ata', latitude: 42.6489, longitude: 77.08, names: { ky: 'Чолпон-Ата', ru: 'Чолпон-Ата' } },
      { id: 'bokonbaevo', latitude: 42.1106, longitude: 76.995, names: { ky: 'Бөкөнбаев', ru: 'Боконбаево' } },
      { id: 'tyup', latitude: 42.7269, longitude: 78.3647, names: { ky: 'Түп', ru: 'Тюп' } },
      { id: 'kyzyl-suu', latitude: 42.3422, longitude: 78.0039, names: { ky: 'Кызыл-Суу', ru: 'Кызыл-Суу' } },
    ],
  },
  {
    id: 'naryn-region',
    names: {
      ky: 'Нарын облусу',
      ru: 'Нарынская область',
    },
    cities: [
      { id: 'naryn', latitude: 41.4287, longitude: 75.9911, names: { ky: 'Нарын', ru: 'Нарын' } },
      { id: 'kochkor', latitude: 42.1817, longitude: 75.7622, names: { ky: 'Кочкор', ru: 'Кочкор' } },
      { id: 'at-bashy', latitude: 41.1714, longitude: 75.8011, names: { ky: 'Ат-Башы', ru: 'Ат-Баши' } },
      { id: 'chaek', latitude: 41.9214, longitude: 74.9511, names: { ky: 'Чаек', ru: 'Чаек' } },
      { id: 'baetovo', latitude: 41.2661, longitude: 74.9531, names: { ky: 'Баетов', ru: 'Баетово' } },
    ],
  },
  {
    id: 'talas-region',
    names: {
      ky: 'Талас облусу',
      ru: 'Таласская область',
    },
    cities: [
      { id: 'talas', latitude: 42.5228, longitude: 72.2427, names: { ky: 'Талас', ru: 'Талас' } },
      { id: 'bakai-ata', latitude: 42.4833, longitude: 71.7833, names: { ky: 'Бакай-Ата', ru: 'Бакай-Ата' } },
      { id: 'kyzyl-adyr', latitude: 42.6017, longitude: 71.5911, names: { ky: 'Кызыл-Адыр', ru: 'Кызыл-Адыр' } },
      { id: 'manas', latitude: 42.7269, longitude: 71.0511, names: { ky: 'Манас', ru: 'Манас' } },
    ],
  },
];

export const KYRGYZSTAN_CITIES = KYRGYZSTAN_REGIONS.flatMap((region) =>
  region.cities.map((city) => ({
    ...city,
    regionId: region.id,
  }))
);

export function normalizeCityId(cityId) {
  return KYRGYZSTAN_CITIES.some((city) => city.id === cityId) ? cityId : DEFAULT_CITY_ID;
}

export function getCityById(cityId) {
  const normalizedCityId = normalizeCityId(cityId);
  return KYRGYZSTAN_CITIES.find((city) => city.id === normalizedCityId) || KYRGYZSTAN_CITIES[0];
}

export function getRegionById(regionId) {
  return KYRGYZSTAN_REGIONS.find((region) => region.id === regionId) || KYRGYZSTAN_REGIONS[0];
}

export function getRegionForCity(cityId) {
  const city = getCityById(cityId);
  return getRegionById(city.regionId);
}

export function getCityName(cityOrId, language = 'ky') {
  const city = typeof cityOrId === 'string' ? getCityById(cityOrId) : cityOrId;
  return city?.names?.[language] || city?.names?.ky || city?.names?.ru || '';
}

export function getRegionName(regionOrId, language = 'ky') {
  const region = typeof regionOrId === 'string' ? getRegionById(regionOrId) : regionOrId;
  return region?.names?.[language] || region?.names?.ky || region?.names?.ru || '';
}
