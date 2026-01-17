import haversine from 'haversine';
import { useEffect, useState } from 'react';
import { Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { getCurrentCoordinates } from '../../location/CurrentLocation';
import { styles } from '../../styles/homeStyles';
export default function RentalItem({ item, onDelete }) {
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function computeDistance() {
            try {
                // If parent already calculated distance, use it to avoid extra location requests
                if (typeof item.distance === 'number') {
                    if (mounted) setDistance(item.distance);
                    return;
                }
                const coords = await getCurrentCoordinates();
                if (!coords || !item) return;
                if (typeof item.x_coordinate === 'number' && typeof item.y_coordinate === 'number') {
                    const d = haversine(coords, { latitude: item.x_coordinate, longitude: item.y_coordinate });
                    if (mounted) setDistance(d);
                } else {
                    // If coordinates are strings, try to coerce
                    const lat = Number(item.x_coordinate);
                    const lng = Number(item.y_coordinate);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const d = haversine(coords, { latitude: lat, longitude: lng });
                        if (mounted) setDistance(d);
                    }
                }
            } catch (e) {
                console.error('Error computing distance', e);
            }
        }
        computeDistance();
        return () => { mounted = false; };
    }, [item]);

    const renderRightActions = () => (
        <TouchableOpacity
            style={styles.deleteBox}
            onPress={() => onDelete(item.id)}
        >
            <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
    );

    function openMap(lat, lng) {
        const label = 'EV Charging Station';
        const url =
            Platform.select({
            ios: `maps:0,0?q=${label}@${lat},${lng}`,
            android: `geo:0,0?q=${lat},${lng}(${label})`,
            }) || '';

        Linking.openURL(url);
    }

    return (
        <Swipeable renderRightActions={renderRightActions}>

                <View style={styles.logItem}>                    

                    <View style={{ flexDirection: 'column', flex: 1 }}>
                        <Text style={styles.exercise}>{item.location}</Text>
                        <Text style={styles.meta}>{item.waitTime === 0 ? 'Available' : `${item.waitTime}m`} · {distance ? `${distance.toFixed(2)} km` : '0'}</Text>
                        {/* <Text style={styles.meta}>{item.range} km</Text> */}
                    </View>

                    <TouchableOpacity
                        style={{ paddingVertical: 6, paddingHorizontal: 15 }}
                        onPress={() => {
                            // Could open details or booking flow; placeholder for now
                            console.log('Open rental', item.id);
                            openMap(item.x_coordinate, item.y_coordinate);
                        }}
                    >
                        <Text style={{ color: '#0a84ff', fontWeight: '600' }}>View</Text>
                    </TouchableOpacity>
                </View>
        </Swipeable>
    );
}
