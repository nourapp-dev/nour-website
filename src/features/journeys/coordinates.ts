export function validCoordinates(
  latitude: unknown,
  longitude: unknown,
): boolean {
  if (
    latitude === null ||
    longitude === null ||
    latitude === undefined ||
    longitude === undefined ||
    latitude === "" ||
    longitude === ""
  )
    return false;
  const lat = Number(latitude),
    lon = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
