import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import haversine from 'haversine';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import { getCurrentCoordinates } from '../../location/CurrentLocation';
import { styles } from '../../styles/homeStyles';
import RentalItem from '../components/RentalItem';


export default function HomeScreen() {
  const [logs, setLogs] = useState([ ]);
  const [rentals, setRentals] = useState([]);
  const [loadingDistances, setLoadingDistances] = useState(false);
  const [region, setRegion] = useState(() => ({
    latitude: 43.6532,
    longitude: -79.3832,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  }));
    


    const fetchLogs = async (key) => {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          // If you saved JSON data in CalendarScreen, parse it here
          const parsed = JSON.parse(value);
          console.log('Retrieved value:', parsed);
          return parsed;
        }
      } catch (error) {
        console.error('Error retrieving data:', error);
      }
    };

    const storeData = async (key, value) => {
      try {
        await AsyncStorage.setItem(key, value);
        console.log('Data stored successfully!');
      } catch (error) {
        console.error('Error storing data:', error);
      }
    };



    useFocusEffect(
      useCallback(() => {
        loadMockData(); // load mock data on focus for testing
      }, [])
    );
    
    const myDate = new Date(); // Or a specific date like new Date("2025-09-22")
    const dayOfWeekIndex = myDate.getDay();

    // Read data from retrieveData and display logs
    const mapHeight = Math.round(Dimensions.get('window').height * 0.42);
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Charging Stations</Text>
                <TouchableOpacity onPress={async () => {
                  // load mock data into storage and refresh UI
                  await loadMockData();
                  const raw = await AsyncStorage.getItem('rentals');
                  console.log('Raw rentals JSON after mock load:', raw);
                }} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#0a84ff', fontWeight: '600' }}>Refresh</Text>
                </TouchableOpacity>
            </View>

              {loadingDistances ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#0a84ff" />
                  <Text style={{ marginTop: 8, color: '#666' }}>Calculating distances...</Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  {/* Centered map area */}
                  <View style={{ alignItems: 'center', marginVertical: 12 }}>
                    <MapView
                      style={{ width: '100%', height: mapHeight, borderRadius: 12 }}
                      initialRegion={region}
                      region={region}
                      onRegionChangeComplete={(r) => setRegion(r)}
                    >
                    </MapView>
                  </View>
                </View>
              )}

        </View>
    );
}