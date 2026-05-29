import { StyleSheet, View } from 'react-native';

import { COLORS } from '../constants/theme';
import PrayerRow from './PrayerRow';

export default function PrayerCard({ prayers, activePrayerKey }) {
  return (
    <View style={styles.card}>
      {prayers.map((prayer, index) => (
        <PrayerRow
          key={prayer.key}
          prayer={prayer}
          isActive={prayer.key === activePrayerKey}
          isLast={index === prayers.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 10,
    width: '76%',
  },
});
