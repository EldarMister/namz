import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../constants/theme';
import { formatPrayerTime } from '../utils/prayerTimes';

export default function PrayerRow({ prayer, isActive, isLast }) {
  const hasTime = Boolean(prayer.time);

  return (
    <View style={[styles.container, isActive && styles.activeContainer]}>
      <View style={styles.content}>
        <View style={styles.prayerIconWrap}>
          <MaterialCommunityIcons
            name={prayer.icon}
            size={28}
            color={COLORS.accent}
          />
        </View>

        <Text style={[styles.name, isActive && styles.activeText]}>{prayer.name}</Text>

        <Text style={[styles.time, !hasTime && styles.placeholderTime, isActive && styles.activeText]}>
          {formatPrayerTime(prayer.time)}
        </Text>
      </View>

      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
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
  prayerIconWrap: {
    alignItems: 'center',
    width: 52,
  },
  name: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 21,
  },
  time: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 28,
    textAlign: 'right',
    width: 88,
  },
  placeholderTime: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 22,
  },
  activeText: {
    color: COLORS.accent,
  },
  divider: {
    backgroundColor: COLORS.divider,
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
});
