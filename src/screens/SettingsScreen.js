import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLanguageLabel, getPrayerName, LANGUAGES, t } from '../constants/i18n';
import {
  getCityName,
  getRegionById,
  getRegionForCity,
  getRegionName,
  KYRGYZSTAN_REGIONS,
} from '../constants/kyrgyzstanCities';
import { PRAYERS } from '../constants/prayers';
import { COLORS, FONTS } from '../constants/theme';
import { BUILT_IN_WALLPAPERS, useAppSettings } from '../context/AppSettingsContext';
import {
  clearAllScheduledNotificationsForTesting,
  getNotificationDebugState,
  openAzanBatterySettings,
  openAzanExactAlarmSettings,
  sendTestAzanNotification,
  triggerPrayerTimeTestInTenSeconds,
} from '../utils/notifications';

const HIDDEN_TEST_PANEL_TAPS = 7;
const HIDDEN_TEST_PANEL_WINDOW_MS = 6000;
const QA_PANEL_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_PANEL === '1';

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

function NotificationRow({ language, prayer, value, onValueChange }) {
  return (
    <View style={styles.notificationRow}>
      <Text style={styles.rowText}>{getPrayerName(language, prayer.key)}</Text>
      <GoldSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function NavigationRow({ title, value, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.generalRow}>
      <View style={styles.generalLeft}>
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
  );
}

function GeneralSwitchRow({ title, value, onValueChange }) {
  return (
    <View style={styles.generalSwitchRow}>
      <Text style={styles.generalTextLarge}>{title}</Text>
      <GoldSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SelectionRow({ title, value, selected, showChevron = true, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.selectionRow}>
      <Text
        style={[styles.selectionText, selected && styles.selectionTextSelected]}
        numberOfLines={2}
      >
        {title}
      </Text>

      <View style={styles.generalRight}>
        {value && (
          <Text style={styles.selectionValue} numberOfLines={1}>
            {value}
          </Text>
        )}
        {selected ? (
          <MaterialCommunityIcons name="check" size={24} color={COLORS.accent} />
        ) : showChevron ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.accent} />
        ) : (
          <View style={styles.selectionIconSpacer} />
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const [page, setPage] = useState('settings');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [testPanelVisible, setTestPanelVisible] = useState(false);
  const [testPanelBusy, setTestPanelBusy] = useState(false);
  const [testPanelStatus, setTestPanelStatus] = useState('');
  const [notificationDebugState, setNotificationDebugState] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const citiesScrollRef = useRef(null);
  const regionsScrollRef = useRef(null);
  const settingsScrollRef = useRef(null);
  const hiddenTestTapRef = useRef({ count: 0, lastTapAt: 0 });
  const wallpaperScrollRef = useRef(null);
  const {
    selectedWallpaperSource,
    settings,
    selectBuiltInWallpaper,
    selectCustomWallpaper,
    setGeneralOption,
    setLanguage,
    setPrayerNotification,
    setSelectedCity,
  } = useAppSettings();
  const language = settings.language;

  const selectedRegion = useMemo(
    () =>
      selectedRegionId
        ? getRegionById(selectedRegionId)
        : getRegionForCity(settings.selectedCityId),
    [selectedRegionId, settings.selectedCityId]
  );

  const wallpaperLabel = useMemo(() => {
    if (settings.wallpaper.type === 'custom') {
      return t(language, 'customPhoto');
    }

    const selectedWallpaper = BUILT_IN_WALLPAPERS.find(
      (wallpaper) => wallpaper.id === settings.wallpaper.id
    );

    return t(language, selectedWallpaper?.labelKey || BUILT_IN_WALLPAPERS[0].labelKey);
  }, [language, settings.wallpaper]);

  const scrollCurrentPageToTop = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const refs = {
        cities: citiesScrollRef,
        regions: regionsScrollRef,
        settings: settingsScrollRef,
        wallpapers: wallpaperScrollRef,
      };
      const ref = refs[page] || settingsScrollRef;
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

  function chooseLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setLanguageModalVisible(false);
  }

  function openRegionSelection() {
    setSelectedRegionId(getRegionForCity(settings.selectedCityId).id);
    setPage('regions');
  }

  function openCitySelection(regionId) {
    setSelectedRegionId(regionId);
    setPage('cities');
  }

  function chooseCity(cityId) {
    setSelectedCity(cityId);
    setPage('settings');
  }

  const refreshTestPanelState = useCallback(async () => {
    const nextState = await getNotificationDebugState();
    setNotificationDebugState(nextState);
  }, []);

  function openTestPanel() {
    setTestPanelVisible(true);
    setTestPanelStatus('');
    refreshTestPanelState().catch(() => {
      setTestPanelStatus('Не удалось прочитать состояние уведомлений.');
    });
  }

  function handleHiddenTestPanelTap() {
    if (!QA_PANEL_ENABLED) {
      return;
    }

    const nowMs = Date.now();
    const tapState = hiddenTestTapRef.current;
    const count =
      nowMs - tapState.lastTapAt < HIDDEN_TEST_PANEL_WINDOW_MS ? tapState.count + 1 : 1;

    hiddenTestTapRef.current = {
      count,
      lastTapAt: nowMs,
    };

    if (count >= HIDDEN_TEST_PANEL_TAPS) {
      hiddenTestTapRef.current = { count: 0, lastTapAt: 0 };
      openTestPanel();
    }
  }

  async function runTestPanelAction(action) {
    setTestPanelBusy(true);

    try {
      const result = await action();
      setTestPanelStatus(result.message);
      await refreshTestPanelState();
    } catch (error) {
      setTestPanelStatus(error?.message || 'Действие не выполнено.');
    } finally {
      setTestPanelBusy(false);
    }
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
            <Pressable onPress={handleHiddenTestPanelTap}>
              <Text style={styles.title}>{t(language, 'settings')}</Text>
            </Pressable>

            <SectionTitle>{t(language, 'notifications')}</SectionTitle>
            <SettingsCard>
              {PRAYERS.map((prayer) => (
                <NotificationRow
                  key={prayer.key}
                  language={language}
                  prayer={prayer}
                  value={settings.notifications[prayer.key]}
                  onValueChange={(enabled) => setPrayerNotification(prayer.key, enabled)}
                />
              ))}
            </SettingsCard>

            <SectionTitle>{t(language, 'general')}</SectionTitle>
            <SettingsCard>
              <NavigationRow
                title={t(language, 'city')}
                value={getCityName(settings.selectedCityId, language)}
                onPress={openRegionSelection}
              />
              <NavigationRow
                title={t(language, 'homeWallpaper')}
                value={wallpaperLabel}
                onPress={() => setPage('wallpapers')}
              />
              <NavigationRow
                title={t(language, 'language')}
                value={getLanguageLabel(language)}
                onPress={() => setLanguageModalVisible(true)}
              />
              <NavigationRow
                title={t(language, 'notificationSound')}
                value={t(language, 'azan1')}
              />
              <GeneralSwitchRow
                title={t(language, 'showIshraq')}
                value={settings.showIshraq}
                onValueChange={(enabled) => setGeneralOption('showIshraq', enabled)}
              />
              <GeneralSwitchRow
                title={t(language, 'showTahajjud')}
                value={settings.showTahajjud}
                onValueChange={(enabled) => setGeneralOption('showTahajjud', enabled)}
              />
            </SettingsCard>
          </ScrollView>
        ) : page === 'wallpapers' ? (
          <ScrollView
            ref={wallpaperScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.wallpaperContent}
          >
            <View style={styles.subHeader}>
              <Pressable onPress={() => setPage('settings')} style={styles.backButton}>
                <MaterialCommunityIcons name="chevron-left" size={34} color={COLORS.accent} />
              </Pressable>
              <Text style={styles.title}>{t(language, 'wallpaper')}</Text>
              <View style={styles.backButtonSpacer} />
            </View>

            <SectionTitle>{t(language, 'builtInWallpapers')}</SectionTitle>
            <SettingsCard>
              {BUILT_IN_WALLPAPERS.map((wallpaper) => {
                const selected =
                  settings.wallpaper.type === 'builtin' && settings.wallpaper.id === wallpaper.id;

                return (
                  <Pressable
                    key={wallpaper.id}
                    onPress={() => selectWallpaper(wallpaper.id)}
                    style={styles.wallpaperRow}
                  >
                    <Image source={wallpaper.source} style={styles.wallpaperPreview} />
                    <Text style={styles.wallpaperText}>{t(language, wallpaper.labelKey)}</Text>
                    {selected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={28}
                        color={COLORS.accent}
                      />
                    )}
                  </Pressable>
                );
              })}
            </SettingsCard>

            <SectionTitle>{t(language, 'gallery')}</SectionTitle>
            <SettingsCard>
              <Pressable onPress={pickCustomWallpaper} style={styles.galleryRow}>
                <View style={styles.galleryIconWrap}>
                  <MaterialCommunityIcons name="image-plus" size={32} color={COLORS.accent} />
                </View>
                <Text style={styles.wallpaperText}>{t(language, 'choosePhoto')}</Text>
                {settings.wallpaper.type === 'custom' && (
                  <MaterialCommunityIcons name="check" size={28} color={COLORS.accent} />
                )}
              </Pressable>
            </SettingsCard>
          </ScrollView>
        ) : page === 'regions' ? (
          <View style={styles.selectionPage}>
            <View style={styles.subHeader}>
              <Pressable onPress={() => setPage('settings')} style={styles.backButton}>
                <MaterialCommunityIcons name="chevron-left" size={34} color={COLORS.accent} />
              </Pressable>
              <Text style={styles.title}>{t(language, 'selectRegion')}</Text>
              <View style={styles.backButtonSpacer} />
            </View>

            <SectionTitle>{t(language, 'region')}</SectionTitle>
            <View style={styles.selectionCard}>
              <ScrollView
                ref={regionsScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.selectionListContent}
              >
                {KYRGYZSTAN_REGIONS.map((region) => (
                  <SelectionRow
                    key={region.id}
                    title={getRegionName(region, language)}
                    onPress={() => openCitySelection(region.id)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.selectionPage}>
            <View style={styles.subHeader}>
              <Pressable onPress={() => setPage('regions')} style={styles.backButton}>
                <MaterialCommunityIcons name="chevron-left" size={34} color={COLORS.accent} />
              </Pressable>
              <Text style={styles.cityTitle} numberOfLines={2}>
                {getRegionName(selectedRegion, language)}
              </Text>
              <View style={styles.backButtonSpacer} />
            </View>

            <SectionTitle>{t(language, 'selectCity')}</SectionTitle>
            <View style={styles.selectionCard}>
              <ScrollView
                ref={citiesScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.selectionListContent}
              >
                {selectedRegion.cities.map((city) => (
                  <SelectionRow
                    key={city.id}
                    title={getCityName(city, language)}
                    selected={city.id === settings.selectedCityId}
                    showChevron={false}
                    onPress={() => chooseCity(city.id)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
        transparent
        visible={languageModalVisible}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={styles.languageModal}>
            <Text style={styles.modalTitle}>{t(language, 'selectLanguage')}</Text>

            {LANGUAGES.map((item) => {
              const selected = item.key === language;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => chooseLanguage(item.key)}
                  style={[styles.languageOption, selected && styles.languageOptionSelected]}
                >
                  <Text style={[styles.languageOptionText, selected && styles.languageOptionTextSelected]}>
                    {item.label}
                  </Text>
                  {selected && (
                    <MaterialCommunityIcons name="check" size={24} color={COLORS.accent} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setTestPanelVisible(false)}
        transparent
        visible={QA_PANEL_ENABLED && testPanelVisible}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTestPanelVisible(false)}>
          <Pressable style={styles.testPanel}>
            <View style={styles.testPanelHeader}>
              <Text style={styles.testPanelTitle}>QA</Text>
              <Pressable onPress={() => setTestPanelVisible(false)} style={styles.testPanelClose}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>

            <Text style={styles.testPanelMeta}>
              Платформа: {notificationDebugState?.platform || '-'}
            </Text>
            <Text style={styles.testPanelMeta}>
              Разрешение: {notificationDebugState?.granted ? 'есть' : 'нет'}
            </Text>
            <Text style={styles.testPanelMeta}>
              Запланировано: {notificationDebugState?.scheduledCount ?? '-'}
            </Text>
            <Text style={styles.testPanelMeta}>
              Канал: {notificationDebugState?.azanChannelId || '-'}
            </Text>
            <Text style={styles.testPanelMeta}>
              Звук канала: {notificationDebugState?.azanChannelSound || '-'}
            </Text>
            <Text style={styles.testPanelMeta}>
              Exact alarm: {notificationDebugState?.exactAlarmMode || '-'}
            </Text>
            <Text style={styles.testPanelMeta}>
              Battery optimization: {notificationDebugState?.batteryOptimizationEnabled ? 'включена' : 'ок'}
            </Text>

            <Pressable
              disabled={testPanelBusy}
              onPress={() => runTestPanelAction(() => sendTestAzanNotification(2))}
              style={[styles.testPanelButton, testPanelBusy && styles.testPanelButtonDisabled]}
            >
              <Text style={styles.testPanelButtonText}>Отправить тест сейчас</Text>
            </Pressable>

            <Pressable
              disabled={testPanelBusy}
              onPress={() => runTestPanelAction(triggerPrayerTimeTestInTenSeconds)}
              style={[styles.testPanelButton, testPanelBusy && styles.testPanelButtonDisabled]}
            >
              <Text style={styles.testPanelButtonText}>Триггер намаза через 10 секунд</Text>
            </Pressable>

            <Pressable
              disabled={testPanelBusy}
              onPress={() => runTestPanelAction(async () => {
                await openAzanExactAlarmSettings();
                return { message: 'Откройте разрешение точных будильников.' };
              })}
              style={[styles.testPanelButtonGhost, testPanelBusy && styles.testPanelButtonDisabled]}
            >
              <Text style={styles.testPanelButtonGhostText}>Разрешить точные будильники</Text>
            </Pressable>

            <Pressable
              disabled={testPanelBusy}
              onPress={() => runTestPanelAction(async () => {
                await openAzanBatterySettings();
                return { message: 'Откройте настройки батареи и отключите оптимизацию.' };
              })}
              style={[styles.testPanelButtonGhost, testPanelBusy && styles.testPanelButtonDisabled]}
            >
              <Text style={styles.testPanelButtonGhostText}>Отключить экономию батареи</Text>
            </Pressable>

            <Pressable
              disabled={testPanelBusy}
              onPress={() => runTestPanelAction(clearAllScheduledNotificationsForTesting)}
              style={[styles.testPanelButtonGhost, testPanelBusy && styles.testPanelButtonDisabled]}
            >
              <Text style={styles.testPanelButtonGhostText}>Очистить все уведомления</Text>
            </Pressable>

            {!!testPanelStatus && (
              <Text style={styles.testPanelStatus}>{testPanelStatus}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  cityTitle: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 31,
    lineHeight: 34,
    marginBottom: 14,
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.text,
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
  rowText: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 22,
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
    maxWidth: 108,
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
  selectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: 5,
  },
  selectionText: {
    color: COLORS.text,
    flex: 1,
    fontFamily: FONTS.display,
    fontSize: 21,
    lineHeight: 24,
    paddingRight: 14,
  },
  selectionTextSelected: {
    color: COLORS.accent,
  },
  selectionValue: {
    color: COLORS.muted,
    fontFamily: FONTS.semibold,
    fontSize: 14,
    marginRight: 4,
  },
  selectionIconSpacer: {
    width: 24,
  },
  selectionPage: {
    flex: 1,
    paddingBottom: 118,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  selectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    maxHeight: 560,
    minHeight: 260,
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
  selectionListContent: {
    paddingBottom: 22,
    paddingTop: 6,
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  languageModal: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  testPanel: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    width: '100%',
  },
  testPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  testPanelTitle: {
    color: COLORS.text,
    fontFamily: FONTS.semibold,
    fontSize: 20,
  },
  testPanelClose: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  testPanelMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 5,
  },
  testPanelButton: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  testPanelButtonText: {
    color: '#14100A',
    fontFamily: FONTS.semibold,
    fontSize: 15,
  },
  testPanelButtonGhost: {
    alignItems: 'center',
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  testPanelButtonGhostText: {
    color: COLORS.text,
    fontFamily: FONTS.semibold,
    fontSize: 15,
  },
  testPanelButtonDisabled: {
    opacity: 0.55,
  },
  testPanelStatus: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },
  modalTitle: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 28,
    marginBottom: 14,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 430,
  },
  languageOption: {
    alignItems: 'center',
    borderColor: COLORS.divider,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  languageOptionSelected: {
    borderColor: COLORS.accent,
  },
  languageOptionText: {
    color: COLORS.text,
    fontFamily: FONTS.display,
    fontSize: 22,
  },
  languageOptionTextSelected: {
    color: COLORS.accent,
  },
});
