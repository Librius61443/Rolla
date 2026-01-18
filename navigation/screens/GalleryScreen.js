import React, { useState, useCallback } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, Modal, Text, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function GalleryScreen() {
    const [photos, setPhotos] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const stored = await AsyncStorage.getItem('app_gallery');
                if (stored) setPhotos(JSON.parse(stored));
            };
            load();
        }, [])
    );

    const deletePhoto = async (uri) => {
        const updated = photos.filter(p => p !== uri);
        await AsyncStorage.setItem('app_gallery', JSON.stringify(updated));
        setPhotos(updated);
        setSelectedImage(null);
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={photos}
                numColumns={3}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.imageBox} onPress={() => setSelectedImage(item)}>
                        <Image source={{ uri: item }} style={styles.thumbnail} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="images-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>Your gallery is empty</Text>
                    </View>
                }
            />

            <Modal visible={!!selectedImage} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close" size={35} color="white" />
                    </TouchableOpacity>
                    
                    <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                    
                    <TouchableOpacity style={styles.deleteCircle} onPress={() => deletePhoto(selectedImage)}>
                        <Ionicons name="trash" size={30} color="white" />
                        <Text style={{color:'white', fontWeight:'bold'}}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    imageBox: { width: width / 3, height: width / 3, padding: 1 },
    thumbnail: { flex: 1 },
    emptyContainer: { alignItems: 'center', marginTop: 150 },
    emptyText: { color: '#999', fontSize: 18, marginTop: 10 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    fullImage: { width: '100%', height: '70%' },
    closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    deleteCircle: { position: 'absolute', bottom: 50, alignSelf: 'center', alignItems: 'center' }
});