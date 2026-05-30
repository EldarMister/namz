import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import {
  buildPrayerWidgetData,
  PRAYER_WIDGET_NAME,
  readWidgetSettings,
} from '../utils/prayerWidget';
import { PrayerTimesWidget } from './PrayerTimesWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== PRAYER_WIDGET_NAME) {
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
    case 'WIDGET_CLICK': {
      const settings = await readWidgetSettings();
      const widgetData = buildPrayerWidgetData(settings);
      props.renderWidget(<PrayerTimesWidget {...widgetData} />);
      break;
    }

    case 'WIDGET_DELETED':
    default:
      break;
  }
}
