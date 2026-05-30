import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    let isMounted = true;

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

      setGpsCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'gps',
      });
    }

    resolveGpsLocation().catch(() => {});

    return () => {
      isMounted = false;
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
