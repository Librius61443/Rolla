import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LogForm from '../components/LogForm';
import LogItem from '../components/LogItem';

export default function SavedPinsScreen({ navigation, route }) {
    const [pins, setPins] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [editingPin, setEditingPin] = useState(null); // This is key for specific editing

    const categories = [
        { id: 'ramps', label: 'Ramps and Entrances' },
        { id: 'elevators', label: 'Elevators and Lifts' },
        { id: 'washrooms', label: 'Accessible Washrooms' },
        { id: 'parking', label: 'Designated Parking' },
    ];

    useFocusEffect(
        useCallback(() => {
            const fetchPins = async () => {
                const stored = await AsyncStorage.getItem('saved_pins');
                if (stored) setPins(JSON.parse(stored));
            };
            fetchPins();
        }, [])
    );

    const handleSave = async (formData) => {
        let updatedPins;
        if (editingPin) {
            // Edit existing pin
            updatedPins = pins.map(p => p.id === editingPin.id ? { ...p, ...formData } : p);
        } else {
            // Create new pin
            const newPin = {
                id: Date.now().toString(),
                categoryId: activeCategory,
                coords: route.params?.currentCoords,
                ...formData,
                date: new Date().toLocaleDateString()
            };
            updatedPins = [newPin, ...pins];
        }

        await AsyncStorage.setItem('saved_pins', JSON.stringify(updatedPins));
        setPins(updatedPins);
        setEditingPin(null);
        setActiveCategory(null);
        navigation.setParams({ currentCoords: null });
    };

    const deletePin = async (id) => {
        const filtered = pins.filter(p => p.id !== id);
        setPins(filtered);
        await AsyncStorage.setItem('saved_pins', JSON.stringify(filtered));
    };

    // This renders each category and its associated pins
    const renderCategory = ({ item }) => {
        const categoryPins = pins.filter(p => p.categoryId === item.id);
        const isExpanded = activeCategory === item.id;

        return (
            <View style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                    <Text style={styles.categoryLabel}>{item.label}</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            setActiveCategory(isExpanded ? null : item.id);
                            setEditingPin(null);
                        }}
                        style={[styles.addBtn, isExpanded && styles.closeBtn]}
                    >
                        <Text style={styles.addBtnText}>{isExpanded ? 'Close' : 'Add Report'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Show Form if category is active */}
                {isExpanded && (
                    <LogForm 
                        onSave={handleSave}
                        onCancel={() => { setActiveCategory(null); setEditingPin(null); }}
                        initialData={editingPin} // Passes existing report to form
                    />
                )}

                {categoryPins.map(pin => (
                    <LogItem 
                        key={pin.id}
                        item={pin}
                        onDelete={deletePin}
                        setOnEdit={() => {
                            setEditingPin(pin); // Load specific pin
                            setActiveCategory(item.id); // Open the correct category
                        }}
                    />
                ))}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderCategory}
                contentContainerStyle={{ paddingBottom: 100 }} // Prevents getting stuck at bottom
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Reviewing saved accessibility reports.</Text>
                    </View>
                }
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    categoryContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 10 },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    categoryLabel: { fontSize: 18, fontWeight: '600', color: '#2d3436' },
    addBtn: { backgroundColor: '#007bff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    closeBtn: { backgroundColor: '#636e72' },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
    header: { padding: 20, backgroundColor: '#f8f9fa', marginBottom: 10 },
    headerText: { textAlign: 'center', color: '#636e72' }
});