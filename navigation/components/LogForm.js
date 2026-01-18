import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LogForm({ onSave, onCancel, initialData, capturedPhoto }) {
    const [name, setName] = useState(initialData?.exercise || '');
    const [desc, setDesc] = useState(initialData?.reps || '');
    const [quality, setQuality] = useState(parseInt(initialData?.weight) || 0);
    const [photo, setPhoto] = useState(initialData?.photo || null);

    useEffect(() => {
        if (capturedPhoto) setPhoto(capturedPhoto);
    }, [capturedPhoto]);

    const pickFromLibrary = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) setPhoto(result.assets[0].uri);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Location Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Location name..." />

            <Text style={styles.label}>Details</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={desc} onChangeText={setDesc} multiline placeholder="Describe accessibility..." />

            <Text style={styles.label}>Quality</Text>
            <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setQuality(s)}>
                        <Ionicons name={s <= quality ? "star" : "star-outline"} size={35} color="#f1c40f" />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.photoContainer}>
                <TouchableOpacity onPress={pickFromLibrary} style={styles.photoBtn}>
                    <Ionicons name="image" size={24} color="#007bff" />
                    <Text style={styles.photoBtnText}>Library</Text>
                </TouchableOpacity>
                
                {photo ? (
                    <View style={styles.previewWrapper}>
                        <Image source={{ uri: photo }} style={styles.preview} />
                        <TouchableOpacity onPress={() => setPhoto(null)} style={styles.removePhoto}>
                            <Ionicons name="close-circle" size={24} color="#ff4757" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.noPhoto}>No photo selected</Text>
                )}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => onSave({ exercise: name, reps: desc, weight: quality.toString(), photo })} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save Report</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15, backgroundColor: '#fff' },
    label: { fontWeight: 'bold', marginBottom: 5 },
    input: { backgroundColor: '#f1f2f6', padding: 12, borderRadius: 8, marginBottom: 15 },
    starRow: { flexDirection: 'row', marginBottom: 20 },
    photoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10 },
    photoBtn: { alignItems: 'center', marginRight: 20 },
    photoBtnText: { color: '#007bff', fontSize: 12, fontWeight: 'bold' },
    previewWrapper: { position: 'relative' },
    preview: { width: 70, height: 70, borderRadius: 8 },
    removePhoto: { position: 'absolute', top: -10, right: -10, backgroundColor: 'white', borderRadius: 12 },
    noPhoto: { color: '#999', fontStyle: 'italic' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20 },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
    saveBtn: { flex: 2, backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
    saveBtnText: { color: 'white', fontWeight: 'bold' }
});