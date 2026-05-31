import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

type PrayerTimesWidgetProps = {
  city: string;
  countdownText: string;
  iconVariant: string;
  prayerSummary: string;
};

const MOON_SVG = `
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="22" cy="22" r="16" stroke="rgba(255,255,255,0.62)" stroke-width="2.4"/>
  <path d="M25.8 11.8C22.4 14.1 20.2 18 20.2 22.4C20.2 26.7 22.3 30.5 25.6 32.8C19.7 32.2 15.1 27.3 15.1 21.2C15.1 15.4 19.7 12.1 25.8 11.8Z" fill="rgba(255,255,255,0.72)"/>
</svg>`;

const SUN_SVG = `
<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="22" cy="22" r="15.5" stroke="rgba(255,255,255,0.62)" stroke-width="2.4"/>
  <circle cx="22" cy="22" r="6.2" fill="rgba(255,255,255,0.76)"/>
  <path d="M22 10V6M22 38V34M34 22H38M6 22H10M30.5 13.5L33.4 10.6M10.6 33.4L13.5 30.5M30.5 30.5L33.4 33.4M10.6 10.6L13.5 13.5" stroke="rgba(255,255,255,0.72)" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

function PrayerIcon({ variant }: { variant: string }) {
  return (
    <SvgWidget
      svg={variant === 'moon' ? MOON_SVG : SUN_SVG}
      style={{
        height: 44,
        width: 44,
      }}
    />
  );
}

export function PrayerTimesWidget({
  city,
  countdownText,
  iconVariant,
  prayerSummary,
}: PrayerTimesWidgetProps) {
  return (
    <FlexWidget
      style={{
        alignItems: 'center',
        backgroundColor: '#7A7974',
        borderRadius: 20,
        flexDirection: 'row',
        height: 'match_parent',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 10,
        width: 'match_parent',
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          maxLines={1}
          text={prayerSummary}
          truncate="END"
          style={{
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: '400',
          }}
        />

        <TextWidget
          maxLines={1}
          text={countdownText}
          style={{
            color: '#FFFFFF',
            fontSize: 28,
            fontWeight: '800',
            marginTop: -1,
          }}
        />

        <TextWidget
          maxLines={1}
          text={city}
          truncate="END"
          style={{
            color: '#FFFFFF',
            fontSize: 19,
            fontWeight: '400',
            marginTop: 3,
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          alignItems: 'center',
          height: 'match_parent',
          justifyContent: 'center',
          marginLeft: 10,
          width: 48,
        }}
      >
        <PrayerIcon variant={iconVariant} />
      </FlexWidget>
    </FlexWidget>
  );
}
