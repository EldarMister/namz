import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CountdownTimer from '../components/CountdownTimer';
import HeroCountdown from '../components/HeroCountdown';
import PrayerCard from '../components/PrayerCard';
import { t } from '../constants/i18n';
import { getCityById, getCityName } from '../constants/kyrgyzstanCities';
import { PRAYERS, getDisplayPrayerDefinitions } from '../constants/prayers';
import { COLORS, FONTS } from '../constants/theme';
import { useAppSettings } from '../context/AppSettingsContext';
import { syncPrayerNotifications } from '../utils/notifications';
import { updatePrayerWidget } from '../utils/prayerWidget';
import {
  getActivePrayerKey,
  getPrayerDate,
  getPrayerDateKey,
  getPrayerSchedule,
} from '../utils/prayerTimes';

const NOTIFICATION_SCHEDULE_DAYS = 14;

export default function HomeScreen() {
  const { height } = useWindowDimensions();
  const { selectedWallpaperSource, settings } = useAppSettings();
  const [now, setNow] = useState(new Date());
  const [homeMode, setHomeMode] = useState('timer');
  const language = settings.language;
  const selectedCity = useMemo(
    () => getCityById(settings.selectedCityId),
    [settings.selectedCityId]
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const refreshPrayerState = useCallback(() => {
    setNow(new Date());
  }, []);

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 18 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2,
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dy) < 44) {
            return;
          }

          setHomeMode((currentMode) => (currentMode === 'timer' ? 'schedule' : 'timer'));
        },
      }),
    []
  );

  const dayKey = getPrayerDateKey(now);
  const dayDate = useMemo(() => getPrayerDate(now), [dayKey]);
  const tomorrowDate = useMemo(() => getPrayerDate(now, 1), [dayKey]);
  const scheduleOptions = useMemo(
    () => ({
      language,
      showIshraq: settings.showIshraq,
      showTahajjud: settings.showTahajjud,
    }),
    [language, settings.showIshraq, settings.showTahajjud]
  );
  const displayPrayerDefinitions = useMemo(
    () => getDisplayPrayerDefinitions(scheduleOptions, language),
    [language, scheduleOptions]
  );
  const placeholderSchedule = useMemo(
    () => displayPrayerDefinitions.map((prayer) => ({ ...prayer, time: null })),
    [displayPrayerDefinitions]
  );

  const schedule = useMemo(
    () =>
      selectedCity
        ? getPrayerSchedule(selectedCity.id, dayDate, scheduleOptions)
        : placeholderSchedule,
    [dayDate, placeholderSchedule, scheduleOptions, selectedCity]
  );

  const tomorrowSchedule = useMemo(
    () =>
      selectedCity
        ? getPrayerSchedule(selectedCity.id, tomorrowDate, scheduleOptions)
        : [],
    [scheduleOptions, selectedCity, tomorrowDate]
  );
  const notificationSchedule = useMemo(() => {
    if (!selectedCity) {
      return [];
    }

    const plannedPrayers = [];
    const notificationOptions = { language };
    const baseDate = new Date();
    const minNotificationTime = baseDate.getTime() + 30 * 1000;

    for (let dayOffset = 0; dayOffset < NOTIFICATION_SCHEDULE_DAYS; dayOffset += 1) {
      const notificationDate = getPrayerDate(baseDate, dayOffset);
      const notificationDateKey = getPrayerDateKey(notificationDate);
      const daySchedule = getPrayerSchedule(selectedCity.id, notificationDate, notificationOptions);

      for (const prayer of daySchedule) {
        const notificationEnabledPrayer = PRAYERS.some((item) => item.key === prayer.key);

        if (!notificationEnabledPrayer || !prayer.time || prayer.time.getTime() <= minNotificationTime) {
          continue;
        }

        plannedPrayers.push({
          ...prayer,
          notificationKey: `${notificationDateKey}:${prayer.key}`,
        });
      }
    }

    return plannedPrayers;
  }, [dayKey, language, selectedCity]);

  const activePrayerKey = useMemo(
    () => (selectedCity ? getActivePrayerKey(schedule, now) : null),
    [selectedCity, schedule, now]
  );

  const nextPrayer = useMemo(() => {
    if (!selectedCity) {
      return null;
    }

    const nextToday = schedule.find((prayer) => prayer.time && prayer.time > now);
    return nextToday || tomorrowSchedule[0] || null;
  }, [now, schedule, selectedCity, tomorrowSchedule]);

  useEffect(() => {
    const syncedSchedule = selectedCity ? notificationSchedule : [];
    const syncedNotifications = selectedCity ? settings.notifications : {};

    syncPrayerNotifications(syncedSchedule, syncedNotifications).catch(() => {});
  }, [notificationSchedule, selectedCity, settings.notifications]);

  useEffect(() => {
    if (selectedCity) {
      updatePrayerWidget(settings).catch(() => {});
    }
  }, [dayKey, selectedCity, settings]);

  const locationLabel = useMemo(() => {
    const cityName = getCityName(selectedCity, language);
    return cityName ? `${cityName}, Кыргызстан` : t(language, 'currentLocation');
  }, [language, selectedCity]);

  const isCompact = height < 780;
  const headerTop = Math.max(28, Math.min(42, height * 0.05));
  const hasExtraPrayerRows = schedule.length > PRAYERS.length;
  const cardsGap = hasExtraPrayerRows
    ? isCompact
      ? Math.max(96, Math.min(114, height * 0.15))
      : Math.max(150, Math.min(180, height * 0.2))
    : isCompact
      ? Math.max(144, Math.min(160, height * 0.205))
      : Math.max(205, Math.min(235, height * 0.26));
  const bottomPadding = isCompact ? 108 : 128;

  return (
    <ImageBackground
      source={selectedWallpaperSource}
      imageStyle={styles.backgroundImage}
      resizeMode="stretch"
      style={styles.background}
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <View
          {...swipeResponder.panHandlers}
          style={[
            styles.content,
            {
              paddingBottom: bottomPadding,
              paddingTop: headerTop,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={28} color={COLORS.text} />
              <Text
                style={styles.locationText}
                numberOfLines={1}
              >
                {getCityName(selectedCity, language) || t(language, 'currentLocation')}
              </Text>
            </View>
          </View>

          {homeMode === 'timer' ? (
            <View style={styles.heroWrap}>
              <HeroCountdown language={language} nextPrayer={nextPrayer} />
              <View style={styles.pullHintWrap}>
                <Text style={styles.pullHint}>{t(language, 'pullUp')}</Text>
                <View style={styles.pullHandle} />
              </View>
            </View>
          ) : (
            <>
              <View style={{ height: cardsGap }} />

              <View style={styles.cardsWrap}>
                <PrayerCard
                  prayers={schedule}
                  activePrayerKey={activePrayerKey}
                />
                <CountdownTimer
                  label={t(language, 'countdownLabel')}
                  nextPrayer={nextPrayer}
                  onElapsed={refreshPrayerState}
                />
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: '82%',
  },
  locationText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 18,
    marginLeft: 8,
    textAlign: 'center',
  },
  locationPendingText: {
    color: COLORS.muted,
    fontSize: 20,
  },
  cardsWrap: {
    marginTop: 0,
  },
  heroWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 58,
  },
  pullHintWrap: {
    alignItems: 'center',
    bottom: 16,
    position: 'absolute',
  },
  pullHint: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 12,
  },
  pullHandle: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 3,
    height: 5,
    width: 72,
  },
});
