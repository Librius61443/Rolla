import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import haversine from 'haversine';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentCoordinates } from '../../location/CurrentLocation';
import { styles } from '../../styles/homeStyles';
import RentalItem from '../components/RentalItem';


export default function HomeScreen() {
  const [logs, setLogs] = useState([ ]);
  const [rentals, setRentals] = useState([]);
  const [loadingDistances, setLoadingDistances] = useState(false);
    


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

    // compute distances & sort list by nearest-first
    const computeDistancesAndSort = async (list) => {
      try {
        const coords = await getCurrentCoordinates();
        if (!coords) return list;
        const withDistances = list.map(r => {
          const lat = Number(r.x_coordinate ?? r.latitude ?? r.lat);
          const lng = Number(r.y_coordinate ?? r.longitude ?? r.lng);
          if (isNaN(lat) || isNaN(lng)) return { ...r, distance: Infinity };
          const d = haversine(coords, { latitude: lat, longitude: lng });
          return { ...r, distance: d };
        });
        withDistances.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        return withDistances;
      } catch (e) {
        console.error('Error computing distances for rentals', e);
        return list;
      }
    };

    // write mock/sample rentals to storage and update state immediately
    const loadMockData = async () => {
      const sample = [
        {
          id: `mock_${Date.now()}_1`,
          location: 'EV Connect Charging Station',
          x_coordinate: 43.66232345247009,
          y_coordinate:  -79.39016061994363,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_2`,
          location: 'ChargePoint Charging Station',
          x_coordinate: 43.66963715501481,
          y_coordinate: -79.40364088304214,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_3`,
          location: 'ChargePoint Charging Station',
          x_coordinate: 43.68931461428657,
          y_coordinate: -79.39548696817799,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_4`,
          location: 'EVlink Charging Station',
          x_coordinate: 43.63830362973651,
          y_coordinate: -79.4128907052947,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_5`,
          location: 'SWTCH Charging Station',
          x_coordinate: 43.69197166314119,
          y_coordinate:  -79.50759405691727,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_6`,
          location: 'EV Connect Charging Station',
          x_coordinate: 43.72999565936787,
          y_coordinate:   -79.3336069479928,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_7`,
          location: 'ChargePoint Charging Station',
          x_coordinate: 43.79123364628218, 
          y_coordinate:  -79.531605668295,
          waitTime: 30,
        },
        {
          id: `mock_${Date.now()}_8`,
          location: 'SWITCH Charging Station',
          x_coordinate: 43.649849985772796, 
          y_coordinate: -79.37950023065872, 
          waitTime: 0,
        }
      ];
      try {
        setLoadingDistances(true);
        // compute distances and sort before persisting/state
        const sorted = await computeDistancesAndSort(sample);
        await AsyncStorage.setItem('rentals', JSON.stringify(sorted));
        setRentals(sorted);
        console.log('Loaded mock rentals into AsyncStorage and state.');
      } catch (e) {
        console.error('Failed to load mock rentals', e);
      } finally {
        setLoadingDistances(false);
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
              ) : rentals.length > 0 && (
                <View>
                  <FlatList
                    data={rentals}
                    keyExtractor={(item, index) => item.id ?? index.toString()}
                    renderItem={({ item }) => (
                      <View>
                        <RentalItem
                          item={item}
                          onDelete={(id) => {
                            const updated = rentals.filter((r) => r.id !== id);
                            setRentals(updated);
                            storeData('rentals', JSON.stringify(updated));
                          }}
                        />
                      </View>
                    )}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No rentals available.</Text>}
                  />
                </View>
              )}

        </View>
    );
}