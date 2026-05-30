import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '../constants/i18n';
import { COLORS, FONTS } from '../constants/theme';
import { getRemainingTime } from '../utils/countdown';
import { formatPrayerTime } from '../utils/prayerTimes';

export default function HeroCountdown({ language, nextPrayer }) {
  const [tick, setTick] = useState(0);
  const hasTime = Boolean(nextPrayer?.time);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((currentTick) => currentTick + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const remainingTime = useMemo(
    () => getRemainingTime(nextPrayer?.time),
    [nextPrayer?.time, tick]
  );

  const prayerName = nextPrayer?.name || t(language, 'prayerFallback');
  const prayerTime = formatPrayerTime(nextPrayer?.time);

  return (
    <View style={styles.container}>
      <View style={styles.nextRow}>
        <Text style={styles.nextLabel}>{t(language, 'next')}</Text>
        <Text style={styles.nextPrayer} numberOfLines={1}>
          {prayerName} · {prayerTime}
        </Text>
      </View>

      <Text style={[styles.timer, !hasTime && styles.placeholderTimer]}>{remainingTime}</Text>
      <Text style={styles.subtitle}>{t(language, 'nextPrayerIn')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  nextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: '92%',
  },
  nextLabel: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 24,
    marginRight: 8,
  },
  nextPrayer: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 24,
  },
  timer: {
    color: COLORS.text,
    fontFamily: FONTS.semibold,
    fontSize: 64,
    lineHeight: 78,
    marginTop: 10,
  },
  placeholderTimer: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 58,
    lineHeight: 76,
  },
  subtitle: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 24,
    marginTop: 2,
  },
});
