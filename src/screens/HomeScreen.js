import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CountdownTimer from '../components/CountdownTimer';
import PrayerCard from '../components/PrayerCard';
import { PRAYERS } from '../constants/prayers';
import { COLORS, FONTS } from '../constants/theme';
import { useAppSettings } from '../context/AppSettingsContext';
import { UNKNOWN_LOCATION, getCurrentPrayerLocation } from '../utils/location';
import {
  getActivePrayerKey,
  getNextPrayer,
  getPrayerSchedule,
} from '../utils/prayerTimes';
import { syncPrayerNotifications } from '../utils/notifications';

function getDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function HomeScreen() {
  const { height } = useWindowDimensions();
  const { selectedWallpaperSource, settings } = useAppSettings();
  const [location, setLocation] = useState(UNKNOWN_LOCATION);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      const nextLocation = await getCurrentPrayerLocation();

      if (isMounted) {
        setLocation(nextLocation);
      }
    }

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const refreshPrayerState = useCallback(() => {
    setNow(new Date());
  }, []);

  const dayKey = getDayKey(now);

  const dayDate = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12),
    [dayKey]
  );

  const hasLocation = Boolean(location.coords);
  const placeholderSchedule = useMemo(
    () => PRAYERS.map((prayer) => ({ ...prayer, time: null })),
    []
  );

  const schedule = useMemo(
    () =>
      hasLocation
        ? getPrayerSchedule(location.coords, dayDate)
        : placeholderSchedule,
    [dayDate, hasLocation, location.coords, placeholderSchedule]
  );

  const activePrayerKey = useMemo(
    () => (hasLocation ? getActivePrayerKey(schedule, now) : null),
    [hasLocation, schedule, now]
  );

  const nextPrayer = useMemo(
    () => (hasLocation ? getNextPrayer(schedule, location.coords, now) : null),
    [hasLocation, schedule, location.coords, now]
  );

  useEffect(() => {
    const syncedSchedule = hasLocation ? schedule : [];
    const syncedNotifications = hasLocation ? settings.notifications : {};

    syncPrayerNotifications(syncedSchedule, syncedNotifications).catch(() => {});
  }, [hasLocation, schedule, settings.notifications]);

  const locationLabel = useMemo(() => {
    if (location.status === 'loading') {
      return 'Определяем местоположение...';
    }

    if (location.status === 'denied') {
      return 'Разрешите доступ к GPS';
    }

    if (location.status === 'unavailable') {
      return 'Местоположение недоступно';
    }

    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }

    return location.city || location.country || 'Текущее местоположение';
  }, [location]);

  const isCompact = height < 780;
  const headerTop = Math.max(46, Math.min(64, height * 0.075));
  const cardsGap = isCompact
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: bottomPadding,
              paddingTop: headerTop,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={28} color={COLORS.text} />
              <Text
                style={[styles.locationText, !hasLocation && styles.locationPendingText]}
                numberOfLines={1}
              >
                {locationLabel}
              </Text>
            </View>
          </View>

          <View style={{ height: cardsGap }} />

          <View style={styles.cardsWrap}>
            <PrayerCard
              prayers={schedule}
              activePrayerKey={activePrayerKey}
            />
            <CountdownTimer nextPrayer={nextPrayer} onElapsed={refreshPrayerState} />
          </View>
        </ScrollView>
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
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: '86%',
  },
  locationText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 25,
    marginLeft: 8,
  },
  locationPendingText: {
    color: COLORS.muted,
    fontSize: 20,
  },
  cardsWrap: {
    marginTop: 0,
  },
});
