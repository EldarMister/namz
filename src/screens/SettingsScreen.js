import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PRAYERS } from '../constants/prayers';
import { COLORS, FONTS } from '../constants/theme';
import { BUILT_IN_WALLPAPERS, useAppSettings } from '../context/AppSettingsContext';

function GoldSwitch({ value, onValueChange }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.switchTrack, !value && styles.switchTrackOff]}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
    </Pressable>
  );
}

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SettingsCard({ children }) {
  return <View style={styles.settingsCard}>{children}</View>;
}

function Divider({ inset = 74 }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

function NotificationRow({ prayer, value, onValueChange, isLast }) {
  return (
    <View>
      <View style={styles.notificationRow}>
        <View style={styles.rowLeft}>
          <MaterialCommunityIcons name={prayer.icon} size={34} color={COLORS.accent} />
          <Text style={styles.rowText}>{prayer.name}</Text>
        </View>
        <GoldSwitch value={value} onValueChange={onValueChange} />
      </View>
      {!isLast && <Divider />}
    </View>
  );
}

function NavigationRow({ icon, title, value, onPress, isLast }) {
  return (
    <View>
      <Pressable onPress={onPress} style={styles.generalRow}>
        <View style={styles.generalLeft}>
          <MaterialCommunityIcons name={icon} size={26} color={COLORS.accent} />
          <Text style={styles.generalText} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.generalRight}>
          <Text style={styles.generalValue} numberOfLines={1}>
            {value}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.accent} />
        </View>
      </Pressable>
      {!isLast && <Divider />}
    </View>
  );
}

function GeneralSwitchRow({ title, value, onValueChange, isLast }) {
  return (
    <View>
      <View style={styles.generalSwitchRow}>
        <Text style={styles.generalTextLarge}>{title}</Text>
        <GoldSwitch value={value} onValueChange={onValueChange} />
      </View>
      {!isLast && <Divider inset={0} />}
    </View>
  );
}

export default function SettingsScreen() {
  const [page, setPage] = useState('settings');
  const settingsScrollRef = useRef(null);
  const wallpaperScrollRef = useRef(null);
  const {
    selectedWallpaperSource,
    settings,
    selectBuiltInWallpaper,
    selectCustomWallpaper,
    setGeneralOption,
    setPrayerNotification,
  } = useAppSettings();

  const wallpaperLabel = useMemo(() => {
    if (settings.wallpaper.type === 'custom') {
      return 'Свое фото';
    }

    return (
      BUILT_IN_WALLPAPERS.find((wallpaper) => wallpaper.id === settings.wallpaper.id)?.label ||
      'Ночная мечеть'
    );
  }, [settings.wallpaper]);

  const scrollCurrentPageToTop = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const ref = page === 'settings' ? settingsScrollRef : wallpaperScrollRef;
      ref.current?.scrollTo({ y: 0, animated: false });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [page]);

  useEffect(scrollCurrentPageToTop, [scrollCurrentPageToTop]);
  useFocusEffect(scrollCurrentPageToTop);

  async function pickCustomWallpaper() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.82,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      selectCustomWallpaper(result.assets[0].uri);
      setPage('settings');
    }
  }

  function selectWallpaper(wallpaperId) {
    selectBuiltInWallpaper(wallpaperId);
    setPage('settings');
  }

  return (
    <ImageBackground
      source={selectedWallpaperSource}
      imageStyle={styles.backgroundImage}
      resizeMode="stretch"
      style={styles.background}
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {page === 'settings' ? (
          <ScrollView
            ref={settingsScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Text style={styles.title}>Настройки</Text>

            <SectionTitle>УВЕДОМЛЕНИЯ</SectionTitle>
            <SettingsCard>
              {PRAYERS.map((prayer, index) => (
                <NotificationRow
                  key={prayer.key}
                  prayer={prayer}
                  value={settings.notifications[prayer.key]}
                  onValueChange={(enabled) => setPrayerNotification(prayer.key, enabled)}
                  isLast={index === PRAYERS.length - 1}
                />
              ))}
            </SettingsCard>

            <SectionTitle>ОБЩЕЕ</SectionTitle>
            <SettingsCard>
              <NavigationRow
                icon="image-outline"
                title="Фон главной страницы"
                value={wallpaperLabel}
                onPress={() => setPage('wallpapers')}
              />
              <NavigationRow icon="web" title="Язык" value="Русский" />
              <NavigationRow icon="volume-high" title="Звук уведомлений" value="Азан 1" />
              <GeneralSwitchRow
                title="Показать Ишрак"
                value={settings.showIshraq}
                onValueChange={(enabled) => setGeneralOption('showIshraq', enabled)}
              />
              <GeneralSwitchRow
                title="Показать Тахаджуд"
                value={settings.showTahajjud}
                onValueChange={(enabled) => setGeneralOption('showTahajjud', enabled)}
                isLast
              />
            </SettingsCard>
          </ScrollView>
        ) : (
          <ScrollView
            ref={wallpaperScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.wallpaperContent}
          >
            <View style={styles.subHeader}>
              <Pressable onPress={() => setPage('settings')} style={styles.backButton}>
                <MaterialCommunityIcons name="chevron-left" size={34} color={COLORS.accent} />
              </Pressable>
              <Text style={styles.title}>Фон</Text>
              <View style={styles.backButtonSpacer} />
            </View>

            <SectionTitle>ГОТОВЫЕ ФОНЫ</SectionTitle>
            <SettingsCard>
              {BUILT_IN_WALLPAPERS.map((wallpaper, index) => {
                const selected =
                  settings.wallpaper.type === 'builtin' && settings.wallpaper.id === wallpaper.id;

                return (
                  <View key={wallpaper.id}>
                    <Pressable
                      onPress={() => selectWallpaper(wallpaper.id)}
                      style={styles.wallpaperRow}
                    >
                      <Image source={wallpaper.source} style={styles.wallpaperPreview} />
                      <Text style={styles.wallpaperText}>{wallpaper.label}</Text>
                      {selected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={28}
                          color={COLORS.accent}
                        />
                      )}
                    </Pressable>
                    {index !== BUILT_IN_WALLPAPERS.length - 1 && <Divider inset={82} />}
                  </View>
                );
              })}
            </SettingsCard>

            <SectionTitle>ГАЛЕРЕЯ</SectionTitle>
            <SettingsCard>
              <Pressable onPress={pickCustomWallpaper} style={styles.galleryRow}>
                <View style={styles.galleryIconWrap}>
                  <MaterialCommunityIcons name="image-plus" size={32} color={COLORS.accent} />
                </View>
                <Text style={styles.wallpaperText}>Выбрать фото</Text>
                {settings.wallpaper.type === 'custom' && (
                  <MaterialCommunityIcons name="check" size={28} color={COLORS.accent} />
                )}
              </Pressable>
            </SettingsCard>
          </ScrollView>
        )}
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
    flex: 1,
  },
  content: {
    paddingBottom: 124,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 46,
    marginBottom: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.accent,
    fontFamily: FONTS.display,
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 9,
    marginLeft: 6,
    marginTop: 0,
  },
  settingsCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  notificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  rowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  rowText: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 22,
    marginLeft: 22,
  },
  divider: {
    backgroundColor: COLORS.divider,
    height: StyleSheet.hairlineWidth,
  },
  switchTrack: {
    backgroundColor: COLORS.accent,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 18,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 54,
  },
  switchTrackOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  switchThumb: {
    backgroundColor: COLORS.text,
    borderRadius: 14,
    height: 24,
    transform: [{ translateX: 0 }],
    width: 24,
  },
  switchThumbOn: {
    transform: [{ translateX: 24 }],
  },
  generalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 37,
  },
  generalLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    minWidth: 0,
  },
  generalText: {
    color: COLORS.text,
    flexShrink: 1,
    fontFamily: FONTS.display,
    fontSize: 16,
    marginLeft: 12,
  },
  generalRight: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  generalValue: {
    color: COLORS.muted,
    fontFamily: FONTS.display,
    fontSize: 15,
    maxWidth: 94,
    textAlign: 'right',
  },
  generalSwitchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 37,
  },
  generalTextLarge: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 20,
  },
  wallpaperContent: {
    paddingBottom: 124,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  subHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backButtonSpacer: {
    width: 44,
  },
  wallpaperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 82,
  },
  wallpaperPreview: {
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 58,
    width: 58,
  },
  wallpaperText: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 23,
    marginLeft: 20,
  },
  galleryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 74,
  },
  galleryIconWrap: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
});
