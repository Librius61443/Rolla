import React, { useState, useCallback, useEffect } from 'react';
import { View, Alert, Text, StyleSheet, Image, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentCoordinates } from '../../location/CurrentLocation';
import Ionicons from 'react-native-vector-icons/Ionicons';

const getCategoryColor = (category) => {
    switch (category) {
        case 'Ramps': return '#007bff';
        case 'Washrooms': return '#28a745';
        case 'Elevator': return '#fd7e14';
        case 'Auto-Doors': return '#6f42c1';
        default: return '#ff4444';
    }
};

export default function MapScreen({ navigation }) {
    const [region, setRegion] = useState(null);
    const [pins, setPins] = useState([]);

    useEffect(() => {
        (async () => {
            const coords = await getCurrentCoordinates();
            if (coords) setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        })();
    }, []);

    useFocusEffect(useCallback(() => {
        const load = async () => {
            const data = await AsyncStorage.getItem('saved_pins');
            if (data) setPins(JSON.parse(data));
        };
        load();
    }, []));

    const handleLongPress = (e) => {
        const coords = e.nativeEvent.coordinate;
        Alert.alert("New Report", "Document this location?", [
            { text: "Cancel" },
            { text: "Create", onPress: () => navigation.navigate('Saved Reports', { currentCoords: coords }) }
        ]);
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView 
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }} 
                region={region} 
                onLongPress={handleLongPress}
                showsUserLocation={true}
            >
                {pins.map(p => (
                    <Marker 
                        key={p.id} 
                        coordinate={p.coords} 
                        pinColor={getCategoryColor(p.section)}
                    >
                        <Callout onPress={() => navigation.navigate('Saved Reports', { editId: p.id })}>
                            <View style={styles.calloutContainer}>
                                {p.photo && (
                                    <Image 
                                        source={{ uri: p.photo }} 
                                        style={styles.calloutImage}
                                        onLoad={() => {}} 
                                    />
                                )}
                                <Text style={styles.calloutTitle}>{p.title || "Untitled"}</Text>
                                <Text style={[styles.calloutCategory, { color: getCategoryColor(p.section) }]}>
                                    {p.section}
                                </Text>
                                <View style={styles.starRow}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Ionicons 
                                            key={s} 
                                            name={s <= (p.rating || 0) ? "star" : "star-outline"} 
                                            size={12} 
                                            color="#FFD700" 
                                        />
                                    ))}
                                </View>
                                <Text style={styles.tapTip}>Tap to view full report</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    calloutContainer: { width: 180, padding: 5, alignItems: 'center', backgroundColor: 'white' },
    calloutImage: { width: 170, height: 100, borderRadius: 8, marginBottom: 8, backgroundColor: '#eee' },
    calloutTitle: { fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
    calloutCategory: { fontSize: 12, fontWeight: '600', marginVertical: 2 },
    starRow: { flexDirection: 'row', marginBottom: 4 },
    tapTip: { fontSize: 10, color: '#999', fontStyle: 'italic', marginTop: 4 }
});