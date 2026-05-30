import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

type PrayerTimesWidgetProps = {
  city: string;
  label: string;
  prayerName: string;
  relativeTime: string;
  time: string;
  updatedAt: string;
};

export function PrayerTimesWidget({
  city,
  label,
  prayerName,
  relativeTime,
  time,
  updatedAt,
}: PrayerTimesWidgetProps) {
  return (
    <FlexWidget
      style={{
        backgroundColor: '#090909',
        borderRadius: 18,
        height: 'match_parent',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        width: 'match_parent',
      }}
    >
      <TextWidget
        text={label.toUpperCase()}
        style={{
          color: '#C9A84C',
          fontSize: 11,
          fontWeight: '600',
        }}
      />

      <FlexWidget
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <TextWidget
          text={prayerName}
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '700',
          }}
        />
        <TextWidget
          text={time}
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '700',
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <TextWidget
          text={relativeTime}
          style={{
            color: '#B8B8B8',
            fontSize: 13,
          }}
        />
        <TextWidget
          text={city}
          style={{
            color: '#777777',
            fontSize: 12,
          }}
        />
      </FlexWidget>

      <TextWidget
        text={`Обновлено ${updatedAt}`}
        style={{
          color: '#555555',
          fontSize: 10,
          marginTop: 6,
        }}
      />
    </FlexWidget>
  );
}
