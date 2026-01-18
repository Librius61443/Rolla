import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LogForm from '../components/LogForm';
import LogItem from '../components/LogItem';

export default function SavedPinsScreen({ navigation, route }) {
    const [pins, setPins] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [editingPin, setEditingPin] = useState(null);

    const categories = [
        { id: 'ramps', label: 'Ramps and Entrances' },
        { id: 'elevators', label: 'Elevators and Lifts' },
        { id: 'washrooms', label: 'Accessible Washrooms' },
        { id: 'parking', label: 'Designated Parking' },
    ];

    // Load saved pins whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const fetchPins = async () => {
                const stored = await AsyncStorage.getItem('saved_pins');
                if (stored) setPins(JSON.parse(stored));
            };
            fetchPins();
        }, [])
    );

    // Integrated handleSave logic
    const handleSave = async (formData) => {
        let updatedPins;
        const capturedPhoto = route.params?.capturedPhoto;

        if (editingPin) {
            // EDIT LOGIC
            updatedPins = pins.map(p => p.id === editingPin.id ? { 
                ...p, 
                ...formData,
                photo: capturedPhoto || p.photo 
            } : p);
        } else {
            // NEW PIN LOGIC
            const capturedCoords = route.params?.currentCoords;
            if (!capturedCoords && !capturedPhoto) {
                 Alert.alert("Missing Info", "Please select a location on the map or take a photo first.");
                 return;
            }

            const newPin = {
                id: Date.now().toString(),
                categoryId: activeCategory,
                coords: capturedCoords,
                ...formData,
                photo: capturedPhoto, 
                date: new Date().toLocaleDateString()
            };
            updatedPins = [newPin, ...pins];
        }

        await AsyncStorage.setItem('saved_pins', JSON.stringify(updatedPins));
        setPins(updatedPins);
        
        // Reset states and clear navigation params
        navigation.setParams({ capturedPhoto: null, currentCoords: null }); 
        setEditingPin(null);
        setActiveCategory(null);
    };

    const deletePin = async (id) => {
        Alert.alert("Delete Pin", "Are you sure you want to remove this report?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                const filtered = pins.filter(p => p.id !== id);
                setPins(filtered);
                await AsyncStorage.setItem('saved_pins', JSON.stringify(filtered));
            }}
        ]);
    };

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

                {isExpanded && (
                    <LogForm 
                        onSave={handleSave}
                        onCancel={() => { setActiveCategory(null); setEditingPin(null); }}
                        initialData={editingPin}
                    />
                )}

                {categoryPins.map(pin => (
                    <LogItem 
                        key={pin.id}
                        item={pin}
                        onDelete={deletePin}
                        setOnEdit={() => {
                            setEditingPin(pin);
                            setActiveCategory(item.id);
                        }}
                    />
                ))}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderCategory}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Reviewing saved accessibility reports.</Text>
                        {route.params?.capturedPhoto && (
                            <View style={styles.photoAlert}>
                                <Text style={styles.photoAlertText}>📸 Photo attached to next save</Text>
                            </View>
                        )}
                    </View>
                }
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    listContent: { paddingBottom: 100 },
    categoryContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 10 },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    categoryLabel: { fontSize: 18, fontWeight: '600', color: '#2d3436' },
    addBtn: { backgroundColor: '#007bff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    closeBtn: { backgroundColor: '#636e72' },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
    header: { padding: 20, backgroundColor: '#f8f9fa' },
    headerText: { textAlign: 'center', color: '#636e72' },
    photoAlert: { marginTop: 10, backgroundColor: '#e3f2fd', padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#bbdefb' },
    photoAlertText: { textAlign: 'center', color: '#1976d2', fontWeight: 'bold', fontSize: 12 }
});