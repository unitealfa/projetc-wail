import * as Location from 'expo-location';

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const results = await Location.geocodeAsync(address);
    const first = results[0];
    if (!first || !Number.isFinite(first.latitude) || !Number.isFinite(first.longitude)) return null;
    return { latitude: first.latitude, longitude: first.longitude };
  } catch {
    return null;
  }
}
