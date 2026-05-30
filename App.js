import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { t } from './src/constants/i18n';
import { COLORS, FONTS } from './src/constants/theme';
import { AppSettingsProvider, useAppSettings } from './src/context/AppSettingsContext';
import CompassScreen from './src/screens/CompassScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

enableScreens(true);

const Tab = createBottomTabNavigator();

function getTabIcon(routeName) {
  if (routeName === 'Home') {
    return 'home';
  }

  if (routeName === 'Compass') {
    return 'compass-outline';
  }

  return 'cog-outline';
}

function getTabLabel(routeName, language) {
  if (routeName === 'Home') {
    return t(language, 'home');
  }

  if (routeName === 'Compass') {
    return t(language, 'compass');
  }

  return t(language, 'settings');
}

function AppTabs() {
  const { height } = useWindowDimensions();
  const { isReady, settings } = useAppSettings();
  const isCompact = height < 780;

  if (!isReady) {
    return <View style={styles.loading} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" translucent />
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={getTabIcon(route.name)}
              size={focused ? (isCompact ? 28 : 30) : isCompact ? 25 : 27}
              color={color}
            />
          ),
          tabBarLabel: getTabLabel(route.name, settings.language),
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: [
            styles.tabBar,
            {
              bottom: isCompact ? 16 : 22,
              height: isCompact ? 70 : 76,
              paddingBottom: isCompact ? 8 : 10,
              paddingTop: isCompact ? 5 : 7,
            },
          ],
          tabBarItemStyle: styles.tabItem,
          tabBarHideOnKeyboard: true,
          sceneStyle: styles.scene,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Compass" component={CompassScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    [FONTS.regular]: Inter_400Regular,
    [FONTS.semibold]: Inter_600SemiBold,
    [FONTS.display]: CormorantGaramond_600SemiBold,
    ...MaterialCommunityIcons.font,
  });

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AppTabs />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    backgroundColor: '#000000',
    flex: 1,
  },
  scene: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 0,
    elevation: 0,
    left: '7%',
    position: 'absolute',
    right: '7%',
    shadowOpacity: 0,
  },
  tabItem: {
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
});
