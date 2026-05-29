import * as Location from 'expo-location';

export const UNKNOWN_LOCATION = {
  city: null,
  country: null,
  coords: null,
  status: 'loading',
};

export async function getCurrentPrayerLocation() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      return {
        ...UNKNOWN_LOCATION,
        status: 'denied',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    const places = await Location.reverseGeocodeAsync(coords);
    const place = places[0] || {};

    // Reverse geocoding по-разному заполняет поля на iOS и Android.
    const city = place.city || place.subregion || place.district || place.name || place.region;
    const country = place.country || null;

    return {
      city: city || null,
      country,
      coords,
      status: 'granted',
    };
  } catch {
    return {
      ...UNKNOWN_LOCATION,
      status: 'unavailable',
    };
  }
}
