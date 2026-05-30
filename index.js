import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';
import { registerAzanBackgroundEvents } from './src/utils/notifications';

registerAzanBackgroundEvents();
registerRootComponent(App);

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');

  registerWidgetTaskHandler(widgetTaskHandler);
}
