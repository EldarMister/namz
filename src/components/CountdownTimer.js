import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../constants/theme';

function getRemainingTime(targetDate) {
  if (!targetDate) {
    return '--:--:--';
  }

  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
}

export default function CountdownTimer({ nextPrayer, onElapsed }) {
  const [tick, setTick] = useState(0);
  const handledTargetRef = useRef(null);
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

  useEffect(() => {
    const targetTime = nextPrayer?.time?.getTime();

    if (!targetTime || Date.now() < targetTime || handledTargetRef.current === targetTime) {
      return;
    }

    handledTargetRef.current = targetTime;
    onElapsed?.();
  }, [nextPrayer?.time, onElapsed, tick]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>ДО СЛЕДУЮЩЕГО НАМАЗА</Text>
      <Text style={[styles.timer, !hasTime && styles.placeholderTimer]}>{remainingTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 26,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    marginTop: 12,
    width: '76%',
  },
  label: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 14,
    marginBottom: 4,
  },
  timer: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 48,
    lineHeight: 52,
  },
  placeholderTimer: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 38,
    lineHeight: 46,
  },
});
