import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS, FONTS } from '../constants/theme';
import { useAppSettings } from '../context/AppSettingsContext';

export default function CompassScreen() {
  const { selectedWallpaperSource } = useAppSettings();

  return (
    <ImageBackground
      source={selectedWallpaperSource}
      imageStyle={styles.backgroundImage}
      resizeMode="stretch"
      style={styles.background}
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.text}>Скоро</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  safeArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 110,
  },
  text: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 48,
  },
});
