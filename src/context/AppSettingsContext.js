import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_NOTIFICATION_PREFS } from '../constants/prayers';

const STORAGE_KEY = '@namaz_app_settings';

export const BUILT_IN_WALLPAPERS = [
  {
    id: 'mosque-night',
    label: 'Ночная мечеть',
    source: require('../assets/wallpapers/mosque-night.jpg'),
  },
];

const DEFAULT_SETTINGS = {
  wallpaper: {
    type: 'builtin',
    id: 'mosque-night',
    uri: null,
  },
  notifications: DEFAULT_NOTIFICATION_PREFS,
  showIshraq: true,
  showTahajjud: true,
};

const AppSettingsContext = createContext(null);

function mergeSettings(savedSettings) {
  return {
    ...DEFAULT_SETTINGS,
    wallpaper: {
      ...DEFAULT_SETTINGS.wallpaper,
      ...savedSettings?.wallpaper,
    },
    notifications: {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...savedSettings?.notifications,
    },
    showIshraq: savedSettings?.showIshraq ?? DEFAULT_SETTINGS.showIshraq,
    showTahajjud: savedSettings?.showTahajjud ?? DEFAULT_SETTINGS.showTahajjud,
  };
}

async function persistSettings(nextSettings) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
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
      setPrayerNotification,
    }),
    [
      isReady,
      selectBuiltInWallpaper,
      selectCustomWallpaper,
      setGeneralOption,
      selectedWallpaperSource,
      setPrayerNotification,
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
