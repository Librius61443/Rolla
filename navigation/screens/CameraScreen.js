import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CameraScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('back');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const cameraRef = useRef(null);

    if (!permission?.granted) {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={{color: 'white', fontWeight: 'bold'}}>Grant Camera Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            setCapturedImage(photo);
            setPreviewVisible(true);
        }
    };

    const savePhoto = async () => {
        try {
            const stored = await AsyncStorage.getItem('app_gallery');
            const gallery = stored ? JSON.parse(stored) : [];
            const newGallery = [capturedImage.uri, ...gallery];
            await AsyncStorage.setItem('app_gallery', JSON.stringify(newGallery));
            setPreviewVisible(false);
            setCapturedImage(null);
            navigation.navigate('Gallery');
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    if (previewVisible && capturedImage) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedImage.uri }} style={styles.fullPreview} />
                <View style={styles.previewOverlay}>
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => setPreviewVisible(false)}>
                        <Ionicons name="refresh-outline" size={30} color="white" />
                        <Text style={styles.previewText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.savePhotoBtn} onPress={savePhoto}>
                        <Ionicons name="checkmark-circle-outline" size={30} color="white" />
                        <Text style={styles.previewText}>Keep Photo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
                <SafeAreaView style={styles.cameraUi}>
                    <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                        <Ionicons name="camera-reverse-outline" size={30} color="white" />
                    </TouchableOpacity>
                    <View style={styles.shutterContainer}>
                        <TouchableOpacity style={styles.shutter} onPress={takePicture} />
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    camera: { flex: 1 },
    cameraUi: { flex: 1, justifyContent: 'space-between', padding: 20 },
    flipBtn: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)', p: 10, borderRadius: 25, padding: 10 },
    shutterContainer: { alignSelf: 'center', marginBottom: 30 },
    shutter: { width: 75, height: 75, borderRadius: 40, backgroundColor: 'white', borderWidth: 6, borderColor: 'rgba(255,255,255,0.4)' },
    fullPreview: { flex: 1, resizeMode: 'cover' },
    previewOverlay: { position: 'absolute', bottom: 0, flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingBottom: 50, backgroundColor: 'rgba(0,0,0,0.6)', paddingTop: 20 },
    previewText: { color: 'white', fontWeight: 'bold', marginTop: 5 },
    retakeBtn: { alignItems: 'center' },
    savePhotoBtn: { alignItems: 'center' },
    permissionBtn: { alignSelf: 'center', marginTop: '50%', padding: 20, backgroundColor: '#007bff', borderRadius: 10 }
});