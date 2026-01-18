import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LogForm({ onSave, onCancel, initialData, placeholderExercise }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [quality, setQuality] = useState(0);

    // Sync form with initialData when Editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.exercise);
            setDescription(initialData.reps);
            setQuality(parseInt(initialData.weight) || 0);
        }
    }, [initialData]);

    const handleSave = () => {
        if (!name || quality === 0) {
            alert("Please provide a name and quality rating.");
            return;
        }

        onSave({ 
            exercise: name, 
            reps: description, 
            weight: quality.toString() 
        });

        // Clear fields
        setName('');
        setDescription('');
        setQuality(0);
    };

    return (
        <View style={styles.formContainer}>
            <Text style={styles.headerLabel}>
                {initialData ? "Edit Accessibility Report" : "New Accessibility Report"}
            </Text>
            
            <TextInput 
                style={styles.input} 
                placeholder={placeholderExercise || "Location Name"} 
                value={name} 
                onChangeText={setName} 
            />

            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Describe the accessibility status..." 
                multiline
                numberOfLines={3}
                value={description} 
                onChangeText={setDescription} 
            />
            
            <View style={styles.qualitySection}>
                <Text style={styles.label}>Accessibility Quality:</Text>
                <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity 
                            key={star} 
                            onPress={() => setQuality(star)}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name={star <= quality ? "star" : "star-outline"} 
                                size={36} 
                                color={star <= quality ? "#f1c40f" : "#bdc3c7"} 
                                style={styles.starIcon}
                            />
                        </TouchableOpacity>
                    ))}
                    {quality > 0 && <Text style={styles.ratingText}>{quality}/5</Text>}
                </View>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Save Report</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f2f6' },
    headerLabel: { fontSize: 14, fontWeight: '700', color: '#2f3542', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: '#f1f2f6', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16, color: '#2f3542' },
    textArea: { height: 80, textAlignVertical: 'top' },
    qualitySection: { marginVertical: 10 },
    label: { fontSize: 15, fontWeight: '600', color: '#57606f', marginBottom: 8 },
    starRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    starIcon: { marginRight: 8 },
    ratingText: { fontSize: 18, fontWeight: 'bold', color: '#f1c40f', marginLeft: 5 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    saveBtn: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, flex: 2, marginLeft: 10, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    cancelBtn: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 8, flex: 1, marginRight: 10, alignItems: 'center' },
    cancelText: { color: '#57606f', fontWeight: '600' }
});