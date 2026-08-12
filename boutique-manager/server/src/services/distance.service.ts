export interface Coordinates {
  latitude: number;
  longitude: number;
}

function isValidCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && value.longitude >= -180
    && value.longitude <= 180;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates): number | null {
  if (!isValidCoordinates(from) || !isValidCoordinates(to)) return null;
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const distance = 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
  return Math.round(distance * 10) / 10;
}
