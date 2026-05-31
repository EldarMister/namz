import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getCityById } from '../constants/kyrgyzstanCities';

const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

type LocationSource = 'gps' | 'city';

type QiblaCoords = {
  latitude: number;
  longitude: number;
  source: LocationSource;
};

function toRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

function getDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

export function calculateQiblaBearing(currentLatitude: number, currentLongitude: number) {
  const dLng = (KAABA_COORDS.longitude - currentLongitude) * Math.PI / 180;
  const lat1 = currentLatitude * Math.PI / 180;
  const lat2 = KAABA_COORDS.latitude * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;

  return normalizeDegrees(bearing);
}

export function useQibla(selectedCityId: string, magneticHeading: number) {
  const selectedCity = useMemo(() => getCityById(selectedCityId), [selectedCityId]);
  const [gpsCoords, setGpsCoords] = useState<QiblaCoords | null>(null);
  const gpsCoordsRef = useRef<QiblaCoords | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    function updateGpsCoords(position: Location.LocationObject) {
      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'gps' as const,
      };
      const previousCoords = gpsCoordsRef.current;

      if (previousCoords && getDistanceMeters(previousCoords, nextCoords) < 15) {
        return;
      }

      gpsCoordsRef.current = nextCoords;
      setGpsCoords(nextCoords);
    }

    async function resolveGpsLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!isMounted) {
        return;
      }

      updateGpsCoords(position);

      subscription = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 15,
        timeInterval: 10000,
      }, (nextPosition) => {
        if (isMounted) {
          updateGpsCoords(nextPosition);
        }
      });
    }

    resolveGpsLocation().catch(() => {});

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  const coords = useMemo<QiblaCoords>(
    () =>
      gpsCoords || {
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
        source: 'city',
      },
    [gpsCoords, selectedCity.latitude, selectedCity.longitude]
  );

  const finalHexAngle = useMemo(
    () => calculateQiblaBearing(coords.latitude, coords.longitude),
    [coords.latitude, coords.longitude]
  );
  const arrowAngle = useMemo(
    () => normalizeDegrees(finalHexAngle - magneticHeading),
    [finalHexAngle, magneticHeading]
  );
  const dialAngle = useMemo(
    () => normalizeDegrees(-magneticHeading),
    [magneticHeading]
  );

  return {
    arrowAngle,
    coords,
    dialAngle,
    finalHexAngle,
    selectedCity,
  };
}
