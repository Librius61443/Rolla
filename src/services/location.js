/**
 * Location Service
 * Handles device location permissions and coordinates
 */

import * as Location from 'expo-location';

/**
 * Get current device coordinates
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export async function getCurrentCoordinates() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Watch position changes
 * @param {Function} callback - Called with new coordinates
 * @returns {Promise<Location.LocationSubscription>}
 */
export async function watchPosition(callback) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    console.warn('Location permission denied');
    return null;
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10,
    },
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  );
}
