import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, Alert } from 'react-native';
import { styles } from '../../styles/homeStyles';
import LogForm from '../components/LogForm';
import LogItem from '../components/LogItem';

export default function SavedPinsScreen({ navigation, route }) {
    // Standardized accessibility categories for crowdsourcing
    const [categories] = useState([
        {id: 'ramps', label: 'Ramps and Entrances'},
        {id: 'elevators', label: 'Elevators and Lifts'},
        {id: 'washrooms', label: 'Accessible Washrooms'},
        {id: 'parking', label: 'Designated Parking'},
    ]);

    const [pins, setPins] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);

    // Sync local state with device storage
    useFocusEffect(
        useCallback(() => {
            async function fetchSavedLocations() {
                try {
                    const stored = await AsyncStorage.getItem('saved_pins');
                    if (stored) {
                        setPins(JSON.parse(stored));
                    }
                } catch (error) {
                    console.error('Data retrieval error:', error);
                }
            }
            fetchSavedLocations();
        }, [])
    );

    // Process and store the new accessibility report
    const handleSaveReport = async (formData) => {
        const capturedCoords = route.params?.currentCoords;

        if (!capturedCoords) {
            Alert.alert(
                "Location Required", 
                "Please select a spot on the map before submitting a report."
            );
            return;
        }

        const reportEntry = {
            id: Date.now().toString(),
            categoryId: activeCategory,
            coords: capturedCoords,      
            exercise: formData.exercise, // Label: Location Name
            reps: formData.reps,         // Label: Observation/Description
            weight: formData.weight,     // Label: Accessibility Rating
            timestamp: new Date().toLocaleDateString()
        };

        try {
            const updatedList = [reportEntry, ...pins];
            await AsyncStorage.setItem('saved_pins', JSON.stringify(updatedList));
            setPins(updatedList);
            setActiveCategory(null);
            
            // Reset navigation state to prevent duplicate entries
            navigation.setParams({ currentCoords: null });
            
            Alert.alert("Report Filed", "Your accessibility update has been pinned to the map.");
        } catch (error) {
            Alert.alert("Submission Error", "We could not save your report at this time.");
        }
    };

    const removeReport = async (id) => {
        const filteredList = pins.filter(p => p.id !== id);
        setPins(filteredList);
        await AsyncStorage.setItem('saved_pins', JSON.stringify(filteredList));
    };

    const groupedReports = categories.reduce((acc, cat) => {
        acc[cat.id] = pins.filter(p => p.categoryId === cat.id);
        return acc;
    }, {});

    return (
        <View style={styles.container}>
            {/* Context-aware notification bar */}
            {route.params?.currentCoords ? (
                <View style={{ backgroundColor: '#27ae60', padding: 15 }}>
                    <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                        Location captured. Choose a category to describe the accessibility.
                    </Text>
                </View>
            ) : (
                <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }}>
                    <Text style={{ color: '#6c757d', textAlign: 'center' }}>
                        Reviewing your saved accessibility reports.
                    </Text>
                </View>
            )}

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ marginBottom: 12, backgroundColor: '#ffffff' }}>
                        <View style={styles.logItemRow}>
                            <Text style={[styles.exercise, { fontSize: 17, color: '#212529', fontWeight: '500' }]}>
                                {item.label}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.addButton, 
                                    { backgroundColor: activeCategory === item.id ? '#adb5bd' : '#007bff' }
                                ]}
                                onPress={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
                            >
                                <Text style={styles.addButtonText}>
                                    {activeCategory === item.id ? 'Cancel' : 'Add Report'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {activeCategory === item.id && (
                            <LogForm
                                onCancel={() => setActiveCategory(null)}
                                onSave={handleSaveReport}
                                placeholderExercise="Business or Landmark Name"
                                placeholderReps="Describe the current accessibility status"
                                placeholderWeight="Rating from 1 to 5"
                            />
                        )}

                        <FlatList
                            data={groupedReports[item.id]}
                            keyExtractor={(pin) => pin.id}
                            renderItem={({ item: pin }) => (
                                <LogItem 
                                    item={pin} 
                                    checkBox={false} 
                                    onDelete={() => removeReport(pin.id)}
                                    setOnEdit={() => navigation.navigate('Home', { 
                                        targetCoords: pin.coords 
                                    })}
                                    onEdit={true}
                                />
                            )}
                            ListEmptyComponent={
                                !activeCategory && (
                                    <Text style={{ marginLeft: 20, color: '#ced4da', paddingBottom: 15 }}>
                                        No recent reports for {item.label}.
                                    </Text>
                                )
                            }
                        />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        </View>
    );
}