import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import Reanimated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCityName } from '../constants/kyrgyzstanCities';
import { FONTS } from '../constants/theme';
import { useAppSettings } from '../context/AppSettingsContext';
import { normalizeDegrees, useQibla } from '../hooks/useQibla';

const COMPASS_SIZE = 326;
const SENSOR_INTERVAL_MS = 16;
const MAGNETOMETER_VECTOR_SMOOTHING = 0.38;
const HEADING_NOISE_FLOOR = 0.22;
const MAGNETIC_FIELD_MIN_UT = 25;
const MAGNETIC_FIELD_MAX_UT = 70;
const MAGNETIC_FIELD_EXTREME_MIN_UT = 10;
const MAGNETIC_FIELD_EXTREME_MAX_UT = 120;
const ALIGNMENT_TOLERANCE_DEGREES = 3;
const ALIGNMENT_VIBRATION_MS = 85;
const ROTATION_ANIMATION_MS = 42;
const TICKS = Array.from({ length: 72 }, (_, index) => index * 5);
const DEGREE_LABELS = Array.from({ length: 12 }, (_, index) => index * 30);

type AppSettingsValue = {
  settings: {
    language: string;
    selectedCityId: string;
  };
};

function toDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

function getShortestRotation(current: number, target: number) {
  const delta = ((target - current + 540) % 360) - 180;
  return current + delta;
}

function getAngleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

function getAbsoluteAngleDelta(from: number, to: number) {
  return Math.abs(getAngleDelta(from, to));
}

function getHeadingSmoothing(delta: number) {
  const absDelta = Math.abs(delta);

  if (absDelta > 80) {
    return 0.95;
  }

  if (absDelta > 35) {
    return 0.78;
  }

  if (absDelta > 12) {
    return 0.58;
  }

  if (absDelta > 4) {
    return 0.42;
  }

  return 0.3;
}

function getHeadingFromMagnetometer({ x, y }: { x: number; y: number }) {
  return normalizeDegrees(toDegrees(Math.atan2(y, x)) - 90);
}

function getMagneticFieldMagnitude({ x, y, z }: { x: number; y: number; z: number }) {
  return Math.sqrt(x * x + y * y + z * z);
}

function isMagneticFieldReliable(magnitude: number) {
  return magnitude >= MAGNETIC_FIELD_MIN_UT && magnitude <= MAGNETIC_FIELD_MAX_UT;
}

function isMagneticFieldUsable(magnitude: number) {
  return magnitude >= MAGNETIC_FIELD_EXTREME_MIN_UT && magnitude <= MAGNETIC_FIELD_EXTREME_MAX_UT;
}

function getMaxHeadingStep(accuracy: number | null) {
  if (accuracy === 0 || accuracy === 1) {
    return 18;
  }

  if (accuracy === 2) {
    return 30;
  }

  return 48;
}

function animateRotation(value: SharedValue<number>, rotationRef: { current: number }, target: number) {
  const nextRotation = getShortestRotation(rotationRef.current, target);
  const delta = getAngleDelta(rotationRef.current, nextRotation);

  if (Math.abs(delta) < 0.35) {
    return;
  }

  rotationRef.current = nextRotation;
  value.value = withTiming(nextRotation, {
    duration: ROTATION_ANIMATION_MS,
    easing: Easing.linear,
  });
}

function getDegreeLabel(degree: number) {
  if (degree === 0) {
    return '0°';
  }

  if (degree === 90) {
    return 'E';
  }

  if (degree === 180) {
    return 'S';
  }

  if (degree === 270) {
    return 'W';
  }

  return `${degree}°`;
}

function KaabaMarker() {
  return (
    <View style={styles.kaabaMarker}>
      <View style={styles.kaabaGoldBand} />
      <View style={styles.kaabaSide} />
    </View>
  );
}

export default function CompassScreen() {
  const { settings } = useAppSettings() as AppSettingsValue;
  const {
    coords,
    finalHexAngle,
    selectedCity,
  } = useQibla(settings.selectedCityId, 0);
  const [sensorAvailable, setSensorAvailable] = useState(Platform.OS !== 'web');
  const [isAligned, setIsAligned] = useState(false);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const dialRotation = useSharedValue(0);
  const arrowRotation = useSharedValue(0);
  const dialRotationRef = useRef(0);
  const arrowRotationRef = useRef(0);
  const headingRef = useRef(0);
  const qiblaBearingRef = useRef(finalHexAngle);
  const magnetometerVectorRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const trueHeadingCorrectionRef = useRef(0);
  const lastMagnetometerHeadingRef = useRef<number | null>(null);
  const magnetometerAvailableRef = useRef(false);
  const needsCalibrationRef = useRef(false);
  const alignedRef = useRef(false);

  function setCalibrationState(nextNeedsCalibration: boolean) {
    if (needsCalibrationRef.current === nextNeedsCalibration) {
      return;
    }

    needsCalibrationRef.current = nextNeedsCalibration;
    setNeedsCalibration(nextNeedsCalibration);
  }

  function updateAlignment(arrowAngle: number) {
    const nextAligned = getAbsoluteAngleDelta(arrowAngle, 0) <= ALIGNMENT_TOLERANCE_DEGREES;

    if (nextAligned === alignedRef.current) {
      return;
    }

    alignedRef.current = nextAligned;
    setIsAligned(nextAligned);

    if (nextAligned && Platform.OS !== 'web') {
      Vibration.vibrate(ALIGNMENT_VIBRATION_MS);
    }
  }

  function updateCompassRotations(nextHeading: number) {
    const qiblaBearing = qiblaBearingRef.current;
    const dialTarget = normalizeDegrees(-nextHeading);
    const arrowTarget = normalizeDegrees(qiblaBearing - nextHeading);

    animateRotation(dialRotation, dialRotationRef, dialTarget);
    animateRotation(arrowRotation, arrowRotationRef, arrowTarget);
    updateAlignment(arrowTarget);
  }

  function updateTrueHeadingCorrection(magneticHeading: number, trueHeading: number) {
    const currentCorrection = trueHeadingCorrectionRef.current;
    const targetCorrection = normalizeDegrees(trueHeading - magneticHeading);
    const correctionDelta = getAngleDelta(currentCorrection, targetCorrection);

    trueHeadingCorrectionRef.current = normalizeDegrees(currentCorrection + correctionDelta * 0.24);
  }

  function applyFilteredHeading(nextHeading: number, accuracy: number | null) {
    const currentHeading = headingRef.current;
    const delta = getAngleDelta(currentHeading, nextHeading);
    const absDelta = Math.abs(delta);

    if (absDelta < HEADING_NOISE_FLOOR) {
      return;
    }

    const smoothing = getHeadingSmoothing(delta);
    const maxStep = getMaxHeadingStep(accuracy);
    const filteredDelta = Math.sign(delta) * Math.min(absDelta * smoothing, maxStep);
    const smoothedHeading = normalizeDegrees(currentHeading + filteredDelta);

    headingRef.current = smoothedHeading;
    updateCompassRotations(smoothedHeading);
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      setSensorAvailable(false);
      return undefined;
    }

    let magnetometerSubscription: { remove: () => void } | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function subscribe() {
      const [magnetometerAvailable, locationPermission] = await Promise.all([
        Magnetometer.isAvailableAsync(),
        Location.requestForegroundPermissionsAsync(),
      ]);

      if (!isMounted) {
        return;
      }

      setSensorAvailable(magnetometerAvailable);
      magnetometerAvailableRef.current = magnetometerAvailable;

      if (locationPermission.status === 'granted') {
        headingSubscription = await Location.watchHeadingAsync((nextHeading) => {
          const headingValue =
            nextHeading.trueHeading >= 0 ? nextHeading.trueHeading : nextHeading.magHeading;

          if (!Number.isFinite(headingValue) || headingValue < 0) {
            return;
          }

          setCalibrationState(nextHeading.accuracy <= 1);
          const normalizedHeading = normalizeDegrees(headingValue);

          if (nextHeading.trueHeading >= 0 && nextHeading.magHeading >= 0) {
            updateTrueHeadingCorrection(
              normalizeDegrees(nextHeading.magHeading),
              normalizeDegrees(nextHeading.trueHeading)
            );
          }

          if (!magnetometerAvailableRef.current || lastMagnetometerHeadingRef.current === null) {
            applyFilteredHeading(normalizedHeading, nextHeading.accuracy);
          }
        });
      }

      if (!magnetometerAvailable) {
        return;
      }

      Magnetometer.setUpdateInterval(SENSOR_INTERVAL_MS);
      magnetometerSubscription = Magnetometer.addListener((data) => {
        const previousVector = magnetometerVectorRef.current;
        const smoothedVector = previousVector
          ? {
              x:
                previousVector.x +
                (data.x - previousVector.x) * MAGNETOMETER_VECTOR_SMOOTHING,
              y:
                previousVector.y +
                (data.y - previousVector.y) * MAGNETOMETER_VECTOR_SMOOTHING,
              z:
                previousVector.z +
                (data.z - previousVector.z) * MAGNETOMETER_VECTOR_SMOOTHING,
            }
          : { x: data.x, y: data.y, z: data.z };

        magnetometerVectorRef.current = smoothedVector;

        const fieldMagnitude = getMagneticFieldMagnitude(smoothedVector);
        const reliableField = isMagneticFieldReliable(fieldMagnitude);

        setCalibrationState(!reliableField);

        if (!isMagneticFieldUsable(fieldMagnitude)) {
          return;
        }

        const magneticHeading = getHeadingFromMagnetometer(smoothedVector);
        lastMagnetometerHeadingRef.current = magneticHeading;
        const correctedHeading = normalizeDegrees(
          magneticHeading + trueHeadingCorrectionRef.current
        );

        applyFilteredHeading(correctedHeading, reliableField ? 3 : 1);
      });
    }

    subscribe().catch(() => {
      if (isMounted) {
        setSensorAvailable(false);
      }
    });

    return () => {
      isMounted = false;
      headingSubscription?.remove();
      magnetometerSubscription?.remove();
    };
  }, []);

  const sourceLabel =
    coords.source === 'gps' ? 'GPS' : getCityName(selectedCity, settings.language);
  const roundedBearing = Math.round(finalHexAngle);

  useEffect(() => {
    qiblaBearingRef.current = finalHexAngle;
    updateCompassRotations(headingRef.current);
  }, [finalHexAngle]);

  const dialAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRotation.value}deg` }],
  }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
  }));

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topChevron}>
          <View
            style={[
              styles.chevronLeg,
              styles.chevronLeft,
              isAligned && styles.chevronLegAligned,
            ]}
          />
          <View
            style={[
              styles.chevronLeg,
              styles.chevronRight,
              isAligned && styles.chevronLegAligned,
            ]}
          />
          <View
            style={[
              styles.chevronJoint,
              isAligned && styles.chevronLegAligned,
            ]}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.degreeTitle}>{roundedBearing}°</Text>
          <Text
            style={[
              styles.locationText,
              !needsCalibration && styles.locationTextWithoutBanner,
            ]}
          >
            Кибла: {roundedBearing}° · {sourceLabel}
          </Text>

          {needsCalibration && (
            <View style={styles.calibrationBanner}>
              <Text style={styles.calibrationText}>
                Покрутите телефон в воздухе по траектории восьмерки для калибровки компаса
              </Text>
            </View>
          )}

          <View style={styles.compassBox}>
            <View style={styles.outerHalo} />

            <Reanimated.View style={[styles.dial, dialAnimatedStyle]}>
              {TICKS.map((degree) => (
                <View
                  key={degree}
                  style={[
                    styles.tick,
                    degree % 30 === 0 && styles.majorTick,
                    {
                      transform: [
                        { rotate: `${degree}deg` },
                        { translateY: -COMPASS_SIZE * 0.448 },
                      ],
                    },
                  ]}
                />
              ))}

              {DEGREE_LABELS.map((degree) => (
                <Text
                  key={degree}
                  style={[
                    styles.degreeLabel,
                    (degree === 0 || degree === 90 || degree === 180 || degree === 270) &&
                      styles.cardinalLabel,
                    {
                      transform: [
                        { rotate: `${degree}deg` },
                        { translateY: -COMPASS_SIZE * 0.365 },
                        { rotate: `${-degree}deg` },
                      ],
                    },
                  ]}
                >
                  {getDegreeLabel(degree)}
                </Text>
              ))}
            </Reanimated.View>

            <LinearGradient
              colors={['#102A8C', '#1764FF', '#24D8EF']}
              end={{ x: 0.86, y: 0.9 }}
              start={{ x: 0.16, y: 0.08 }}
              style={styles.blueRing}
            />
            <View style={styles.blueRingShade} />
            <View style={styles.centerCore} />

            <Reanimated.View style={[styles.qiblaPointer, arrowAnimatedStyle]}>
              <View style={styles.qiblaLine} />
              <View style={styles.qiblaDot} />
              <KaabaMarker />
            </Reanimated.View>

            <View style={styles.centerPin} />
          </View>

          <Text style={styles.statusText}>
            {sensorAvailable
              ? isAligned
                ? 'Направление Киблы найдено'
                : 'Поверните телефон до совпадения стрелки с верхней меткой'
              : 'Датчик компаса недоступен'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  safeArea: {
    alignItems: 'center',
    flex: 1,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topChevron: {
    height: 42,
    marginTop: 4,
    width: 122,
  },
  chevronLeg: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 5,
    height: 10,
    position: 'absolute',
    top: 10,
    width: 72,
  },
  chevronJoint: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 5,
    height: 10,
    left: 55,
    position: 'absolute',
    top: 7,
    width: 12,
  },
  chevronLegAligned: {
    backgroundColor: '#FF453A',
    shadowColor: '#FF453A',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  chevronLeft: {
    left: -8,
    top: 17,
    transform: [{ rotate: '-22deg' }],
  },
  chevronRight: {
    right: -8,
    top: 17,
    transform: [{ rotate: '22deg' }],
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 170,
    width: '100%',
  },
  degreeTitle: {
    color: '#F5F7FA',
    fontFamily: FONTS.regular,
    fontSize: 30,
    letterSpacing: 0,
    marginBottom: 5,
  },
  locationText: {
    color: 'rgba(245, 247, 250, 0.48)',
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 14,
  },
  locationTextWithoutBanner: {
    marginBottom: 36,
  },
  calibrationBanner: {
    backgroundColor: 'rgba(18, 18, 18, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 22,
    maxWidth: 310,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  calibrationText: {
    color: 'rgba(245, 247, 250, 0.76)',
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  compassBox: {
    alignItems: 'center',
    height: COMPASS_SIZE,
    justifyContent: 'center',
    width: COMPASS_SIZE,
  },
  outerHalo: {
    backgroundColor: '#262626',
    borderRadius: COMPASS_SIZE / 2,
    height: COMPASS_SIZE,
    position: 'absolute',
    width: COMPASS_SIZE,
  },
  dial: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 1,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: COMPASS_SIZE,
  },
  tick: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 1,
    height: 8,
    position: 'absolute',
    width: 2,
  },
  majorTick: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    height: 26,
    width: 2,
  },
  degreeLabel: {
    color: 'rgba(255, 255, 255, 0.52)',
    fontFamily: FONTS.regular,
    fontSize: 12,
    position: 'absolute',
  },
  cardinalLabel: {
    color: 'rgba(255, 255, 255, 0.84)',
    fontFamily: FONTS.semibold,
    fontSize: 19,
  },
  blueRing: {
    borderRadius: 102,
    height: 204,
    position: 'absolute',
    width: 204,
  },
  blueRingShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(100, 221, 255, 0.18)',
    borderRadius: 102,
    borderWidth: 1,
    height: 204,
    position: 'absolute',
    shadowColor: '#21BFFF',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 16,
    width: 204,
  },
  centerCore: {
    backgroundColor: '#434D55',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 68,
    borderWidth: 1,
    height: 136,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    width: 136,
  },
  qiblaPointer: {
    alignItems: 'center',
    height: COMPASS_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: COMPASS_SIZE,
  },
  qiblaLine: {
    backgroundColor: '#FF453A',
    borderRadius: 3,
    height: 132,
    position: 'absolute',
    top: 50,
    width: 5,
  },
  qiblaDot: {
    backgroundColor: '#FF453A',
    borderRadius: 10,
    height: 20,
    position: 'absolute',
    width: 20,
  },
  kaabaMarker: {
    backgroundColor: '#1C1C1E',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 4,
    borderWidth: 1,
    height: 34,
    left: COMPASS_SIZE / 2 - 17,
    overflow: 'hidden',
    position: 'absolute',
    top: 24,
    width: 34,
  },
  kaabaGoldBand: {
    backgroundColor: '#D7B95F',
    height: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 8,
  },
  kaabaSide: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
  },
  centerPin: {
    backgroundColor: '#FF453A',
    borderRadius: 9,
    height: 18,
    position: 'absolute',
    width: 18,
  },
  statusText: {
    color: 'rgba(245, 247, 250, 0.42)',
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 32,
    textAlign: 'center',
  },
});
