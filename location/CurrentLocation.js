import * as Location from 'expo-location';

export async function getCurrentCoordinates() {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Permission denied');
    return null;
  }

  // Get current position
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  // Return coordinates
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
