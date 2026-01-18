import React, { useState, useCallback } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, 
    Alert, TextInput, ScrollView, KeyboardAvoidingView, 
    Platform, Image, Modal, SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

const SECTIONS = [
    { name: 'Ramps', icon: 'trending-up-outline', color: '#007bff' },
    { name: 'Washrooms', icon: 'woman-outline', color: '#28a745' },
    { name: 'Elevator', icon: 'business-outline', color: '#fd7e14' },
    { name: 'Auto-Doors', icon: 'exit-outline', color: '#6f42c1' }
];

export default function SavedPinsScreen({ navigation, route }) {
    const [savedPins, setSavedPins] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [rating, setRating] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [currentCoords, setCurrentCoords] = useState(null);

    const [appGallery, setAppGallery] = useState([]);
    const [showAppGallery, setShowAppGallery] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const syncData = async () => {
                const data = await AsyncStorage.getItem('saved_pins');
                const allPins = data ? JSON.parse(data) : [];
                setSavedPins(allPins);

                if (route.params?.editId) {
                    setIsFormVisible(false); // Only show list
                    navigation.setParams({ editId: null });
                }

                if (route.params?.currentCoords) {
                    resetFormState();
                    setCurrentCoords(route.params.currentCoords);
                    setIsFormVisible(true); 
                    navigation.setParams({ currentCoords: null });
                }
            };
            syncData();
        }, [route.params])
    );

    const openAppGallery = async () => {
        const data = await AsyncStorage.getItem('app_gallery');
        setAppGallery(data ? JSON.parse(data) : []);
        setShowAppGallery(true);
    };

    const handlePhonePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, 
            quality: 0.8,
        });
        if (!result.canceled) setSelectedPhoto(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!title.trim()) return Alert.alert("Error", "Title is required.");
        const finalCategory = customCategory.trim() !== "" ? customCategory : selectedSection;
        if (!finalCategory) return Alert.alert("Error", "Category required.");

        const reportData = {
            id: editingId || Date.now().toString(),
            title, description, section: finalCategory, rating,
            photo: selectedPhoto, coords: currentCoords,
            date: new Date().toLocaleDateString()
        };

        const updated = editingId 
            ? savedPins.map(p => p.id === editingId ? reportData : p)
            : [reportData, ...savedPins];

        await AsyncStorage.setItem('saved_pins', JSON.stringify(updated));
        setSavedPins(updated);
        resetFormState();
        setIsFormVisible(false);
    };

    const resetFormState = () => {
        setEditingId(null); setTitle(""); setDescription(""); setSelectedSection(""); 
        setCustomCategory(""); setRating(0); setSelectedPhoto(null); setCurrentCoords(null);
    };

    const startEdit = (item) => {
        setEditingId(item.id); setTitle(item.title); setDescription(item.description);
        const isDefault = SECTIONS.some(s => s.name === item.section);
        if (isDefault) { setSelectedSection(item.section); setCustomCategory(""); }
        else { setCustomCategory(item.section); setSelectedSection(""); }
        setRating(item.rating || 0); setSelectedPhoto(item.photo);
        setCurrentCoords(item.coords); setIsFormVisible(true);
    };

    const deleteReport = (id) => {
        Alert.alert("Delete", "Remove this report?", [
            { text: "Cancel" },
            { text: "Delete", style: 'destructive', onPress: async () => {
                const updated = savedPins.filter(p => p.id !== id);
                await AsyncStorage.setItem('saved_pins', JSON.stringify(updated));
                setSavedPins(updated);
            }}
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {isFormVisible ? (
                <KeyboardAvoidingView behavior="padding" style={{flex:1}}>
                    <ScrollView contentContainerStyle={styles.formScroll}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>{editingId ? "Edit" : "New Report"}</Text>
                            <TouchableOpacity onPress={() => setIsFormVisible(false)}><Ionicons name="close" size={28} /></TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Location Title</Text>
                        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

                        <Text style={styles.label}>Photo</Text>
                        {selectedPhoto ? (
                            <View style={styles.photoContainer}>
                                <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} resizeMode="cover" />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => setSelectedPhoto(null)}><Ionicons name="close-circle" size={32} color="red"/></TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.pickerRow}>
                                <TouchableOpacity style={styles.pickerBtn} onPress={handlePhonePick}><Ionicons name="images-outline" size={24} color="#007bff"/><Text style={styles.pickerText}>Phone</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.pickerBtn} onPress={openAppGallery}><Ionicons name="camera-outline" size={24} color="#007bff"/><Text style={styles.pickerText}>App Gallery</Text></TouchableOpacity>
                            </View>
                        )}

                        <Text style={styles.label}>Rating</Text>
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                    <Ionicons name={s <= rating ? "star" : "star-outline"} size={35} color={s <= rating ? "#FFD700" : "#ccc"} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.grid}>
                            {SECTIONS.map(s => (
                                <TouchableOpacity key={s.name} 
                                    style={[styles.catCard, selectedSection === s.name && !customCategory && { borderColor: s.color, borderWidth: 2 }]}
                                    onPress={() => { setSelectedSection(s.name); setCustomCategory(""); }}
                                >
                                    <Ionicons name={s.icon} size={22} color={s.color} />
                                    <Text style={{fontSize: 10, color: s.color, fontWeight:'bold'}}>{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Custom Category</Text>
                        <TextInput style={styles.input} value={customCategory} onChangeText={(t) => { setCustomCategory(t); if(t) setSelectedSection(""); }} placeholder="e.g. Tactile Paving" />

                        <Text style={styles.label}>Description</Text>
                        <TextInput style={[styles.input, {height: 80}]} multiline value={description} onChangeText={setDescription} />

                        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={{color: 'white', fontWeight: 'bold'}}>Save Report</Text></TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            ) : (
                <FlatList
                    data={savedPins}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={<Text style={styles.listHeader}>Your Reports</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.reportCard}>
                            <View style={styles.cardContent}>
                                {item.photo && <Image source={{ uri: item.photo }} style={styles.thumb} />}
                                <View style={{flex: 1, marginLeft: 12}}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardSubtitle}>{item.section} • {item.date}</Text>
                                    <View style={{flexDirection: 'row'}}>{[1,2,3,4,5].map(s => <Ionicons key={s} name={s <= (item.rating || 0) ? "star" : "star-outline"} size={14} color="#FFD700" />)}</View>
                                </View>
                                <TouchableOpacity onPress={() => startEdit(item)}><Ionicons name="pencil" size={20} color="#007bff" style={{marginRight:15}}/></TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteReport(item.id)}><Ionicons name="trash" size={20} color="#ff4444" /></TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            <Modal visible={showAppGallery} animationType="slide">
                <SafeAreaView style={{flex: 1}}>
                    <View style={styles.modalHeader}>
                        <Text style={{fontSize:18, fontWeight:'bold'}}>Select App Photo</Text>
                        <TouchableOpacity onPress={() => setShowAppGallery(false)}><Ionicons name="close" size={32}/></TouchableOpacity>
                    </View>
                    <FlatList data={appGallery} numColumns={4} renderItem={({ item }) => (
                        <TouchableOpacity style={styles.galItem} onPress={() => { setSelectedPhoto(item); setShowAppGallery(false); }}>
                            <Image source={{ uri: item }} style={styles.galImg} />
                        </TouchableOpacity>
                    )} />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    formScroll: { padding: 20 },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    formTitle: { fontSize: 22, fontWeight: 'bold' },
    label: { fontSize: 13, fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#666' },
    input: { backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    photoContainer: { width: '100%', height: 250, borderRadius: 10, overflow: 'hidden' },
    photoPreview: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'white', borderRadius: 20 },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    pickerBtn: { flex: 0.48, backgroundColor: 'white', padding: 15, borderRadius: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#007bff' },
    pickerText: { color: '#007bff', fontWeight: 'bold', marginTop: 5 },
    starContainer: { flexDirection: 'row', marginVertical: 5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    catCard: { width: '48%', backgroundColor: 'white', padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    saveBtn: { backgroundColor: '#007bff', padding: 18, borderRadius: 10, marginTop: 30, alignItems: 'center' },
    listHeader: { fontSize: 20, fontWeight: 'bold', margin: 15 },
    reportCard: { backgroundColor: 'white', padding: 15, marginHorizontal: 15, marginBottom: 10, borderRadius: 12, elevation: 2 },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    thumb: { width: 65, height: 65, borderRadius: 6 },
    cardTitle: { fontSize: 16, fontWeight: 'bold' },
    cardSubtitle: { fontSize: 12, color: '#666' },
    modalHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between' },
    galItem: { flex: 1/4, aspectRatio: 3/4, padding: 2 },
    galImg: { width: '100%', height: '100%', borderRadius: 4 }
});