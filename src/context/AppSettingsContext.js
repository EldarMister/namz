import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_LANGUAGE, normalizeLanguage } from '../constants/i18n';
import { DEFAULT_CITY_ID, normalizeCityId } from '../constants/kyrgyzstanCities';
import { DEFAULT_NOTIFICATION_PREFS } from '../constants/prayers';
import { APP_SETTINGS_STORAGE_KEY } from '../constants/storageKeys';

const SETTINGS_VERSION = 3;
const DEFAULT_WALLPAPER_ID = 'sunset-mosque';

export const BUILT_IN_WALLPAPERS = [
  {
    id: 'sunset-mosque',
    labelKey: 'sunsetMosque',
    source: require('../assets/wallpapers/sunset-mosque.jpg'),
  },
  {
    id: 'mosque-night',
    labelKey: 'nightMosque',
    source: require('../assets/wallpapers/mosque-night.jpg'),
  },
];

const DEFAULT_SETTINGS = {
  settingsVersion: SETTINGS_VERSION,
  language: DEFAULT_LANGUAGE,
  wallpaper: {
    type: 'builtin',
    id: DEFAULT_WALLPAPER_ID,
    uri: null,
  },
  notifications: DEFAULT_NOTIFICATION_PREFS,
  selectedCityId: DEFAULT_CITY_ID,
  showIshraq: true,
  showTahajjud: true,
};

const AppSettingsContext = createContext(null);

function mergeWallpaper(savedWallpaper, { migrateDefaultWallpaper = false } = {}) {
  if (savedWallpaper?.type === 'custom' && savedWallpaper.uri) {
    return savedWallpaper;
  }

  const shouldUseDefaultWallpaper =
    !savedWallpaper?.id ||
    (migrateDefaultWallpaper && savedWallpaper.id === 'mosque-night');

  return {
    ...DEFAULT_SETTINGS.wallpaper,
    ...savedWallpaper,
    id: shouldUseDefaultWallpaper ? DEFAULT_WALLPAPER_ID : savedWallpaper.id,
    uri: null,
  };
}

function mergeSettings(savedSettings) {
  // Старые сборки использовали ночную мечеть как дефолт. Один раз переводим
  // такие сохранённые настройки на новый фон, но не ломаем ручной выбор дальше.
  const migrateDefaultWallpaper = !savedSettings?.settingsVersion;

  return {
    ...DEFAULT_SETTINGS,
    settingsVersion: SETTINGS_VERSION,
    wallpaper: mergeWallpaper(savedSettings?.wallpaper, { migrateDefaultWallpaper }),
    notifications: {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...savedSettings?.notifications,
    },
    language: normalizeLanguage(savedSettings?.language),
    selectedCityId: normalizeCityId(savedSettings?.selectedCityId),
    showIshraq: savedSettings?.showIshraq ?? DEFAULT_SETTINGS.showIshraq,
    showTahajjud: savedSettings?.showTahajjud ?? DEFAULT_SETTINGS.showTahajjud,
  };
}

async function persistSettings(nextSettings) {
  await AsyncStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const rawValue = await AsyncStorage.getItem(APP_SETTINGS_STORAGE_KEY);
        const parsedValue = rawValue ? JSON.parse(rawValue) : null;

        if (isMounted) {
          setSettings(mergeSettings(parsedValue));
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = useCallback((recipe) => {
    setSettings((currentSettings) => {
      const nextSettings = recipe(currentSettings);
      persistSettings(nextSettings).catch(() => {});
      return nextSettings;
    });
  }, []);

  const selectBuiltInWallpaper = useCallback(
    (wallpaperId) => {
      updateSettings((currentSettings) => ({
        ...currentSettings,
        wallpaper: {
          type: 'builtin',
          id: wallpaperId,
          uri: null,
        },
      }));
    },
    [updateSettings]
  );

  const selectCustomWallpaper = useCallback(
    (uri) => {
      updateSettings((currentSettings) => ({
        ...currentSettings,
        wallpaper: {
          type: 'custom',
          id: null,
          uri,
        },
      }));
    },
    [updateSettings]
  );

  const setPrayerNotification = useCallback(
    (prayerKey, enabled) => {
      updateSettings((currentSettings) => ({
        ...currentSettings,
        notifications: {
          ...currentSettings.notifications,
          [prayerKey]: enabled,
        },
      }));
    },
    [updateSettings]
  );

  const setLanguage = useCallback(
    (language) => {
      updateSettings((currentSettings) => ({
        ...currentSettings,
        language: normalizeLanguage(language),
      }));
    },
    [updateSettings]
  );

  const setSelectedCity = useCallback(
    (cityId) => {
      updateSettings((currentSettings) => ({
        ...currentSettings,
        selectedCityId: normalizeCityId(cityId),
      }));
    },
    [updateSettings]
  );

  const setGeneralOption = useCallback(
    (optionKey, enabled) => {
      updateSettings((currentSettings) => ({
        ...currentSettings,
        [optionKey]: enabled,
      }));
    },
    [updateSettings]
  );

  const selectedWallpaperSource = useMemo(() => {
    if (settings.wallpaper.type === 'custom' && settings.wallpaper.uri) {
      return { uri: settings.wallpaper.uri };
    }

    return (
      BUILT_IN_WALLPAPERS.find((wallpaper) => wallpaper.id === settings.wallpaper.id)?.source ||
      BUILT_IN_WALLPAPERS[0].source
    );
  }, [settings.wallpaper]);

  const value = useMemo(
    () => ({
      settings,
      isReady,
      selectedWallpaperSource,
      selectBuiltInWallpaper,
      selectCustomWallpaper,
      setGeneralOption,
      setLanguage,
      setPrayerNotification,
      setSelectedCity,
    }),
    [
      isReady,
      selectBuiltInWallpaper,
      selectCustomWallpaper,
      selectedWallpaperSource,
      setGeneralOption,
      setLanguage,
      setPrayerNotification,
      setSelectedCity,
      settings,
    ]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }

  return context;
}
