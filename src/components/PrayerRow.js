import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../constants/theme';
import { formatPrayerTime } from '../utils/prayerTimes';

export default function PrayerRow({ prayer, isActive, isDense }) {
  const hasTime = Boolean(prayer.time);

  return (
    <View style={[styles.container, isDense && styles.denseContainer, isActive && styles.activeContainer]}>
      <View style={[styles.content, isDense && styles.denseContent]}>
        <Text style={[styles.name, isDense && styles.denseName, isActive && styles.activeText]}>
          {prayer.name}
        </Text>

        <Text style={[styles.time, isDense && styles.denseTime, !hasTime && styles.placeholderTime, isActive && styles.activeText]}>
          {formatPrayerTime(prayer.time)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  denseContainer: {
    minHeight: 36,
  },
  activeContainer: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    borderRadius: 16,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 42,
  },
  denseContent: {
    minHeight: 34,
  },
  name: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 21,
  },
  denseName: {
    fontSize: 19,
  },
  time: {
    color: COLORS.text,
    fontFamily: FONTS.semibold,
    fontSize: 25,
    textAlign: 'right',
    width: 88,
  },
  denseTime: {
    fontSize: 22,
  },
  placeholderTime: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 22,
  },
  activeText: {
    color: COLORS.accent,
  },
});
