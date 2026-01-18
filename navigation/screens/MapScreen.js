import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

// Fix: Correct path to location folder
import { getCurrentCoordinates } from '../../location/CurrentLocation';
import { customStyleJson } from '../../styles/mapStyles';

export default function MapScreen({ navigation }) {
    const [initialRegion, setInitialRegion] = useState(null);
    const [savedPins, setSavedPins] = useState([]);

    useEffect(() => {
        (async () => {
            const coords = await getCurrentCoordinates();
            if (coords) {
                setInitialRegion({
                    ...coords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const loadMarkers = async () => {
                const data = await AsyncStorage.getItem('saved_pins');
                if (data) setSavedPins(JSON.parse(data));
            };
            loadMarkers();
        }, [])
    );

    const handleLongPress = (e) => {
        const coords = e.nativeEvent.coordinate;
        Alert.alert(
            "New Accessibility Report",
            "Document a feature or obstacle at this location?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Create Report", 
                    // Fix: Must match the string in MainContainer.js
                    onPress: () => navigation.navigate('Saved Reports', { currentCoords: coords }) 
                }
            ]
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                provider='google'
                style={{ flex: 1 }}
                initialRegion={initialRegion}
                customMapStyle={customStyleJson}
                onLongPress={handleLongPress}
            >
                {savedPins.map((pin) => (
                    <Marker 
                        key={pin.id} 
                        coordinate={pin.coords}
                        pinColor={pin.categoryId === 'ramps' ? '#007bff' : '#e74c3c'}
                    >
                        <Callout>
                            <View style={{ padding: 10, maxWidth: 200 }}>
                                <Text style={{ fontWeight: 'bold' }}>{pin.exercise}</Text>
                                <Text>{pin.reps}</Text>
                                <Text style={{ color: '#007bff' }}>Rating: {pin.weight}/5</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
}