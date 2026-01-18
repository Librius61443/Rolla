/**
 * CameraCapture Component
 * Fullscreen camera view for capturing accessibility feature photos
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraCapture({ visible, onCapture, onClose, featureType }) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  
  // Animation for smooth transition
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Request permission when component becomes visible
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);

  // Handle visibility animation
  useEffect(() => {
    if (visible) {
      // Fade in black background immediately
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      contentAnim.setValue(0);
      setCameraReady(false);
    }
  }, [visible]);

  // Reset state when closing
  useEffect(() => {
    if (!visible) {
      setCapturedImage(null);
      setIsCapturing(false);
      setCameraReady(false);
    }
  }, [visible]);

  // Handle camera ready - fade in content
  const handleCameraReady = () => {
    setCameraReady(true);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  if (!visible) return null;

  // Permission loading
  if (!permission) {
    return (
      <Animated.View style={[styles.container, styles.blackBg, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </Animated.View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Animated.View style={[styles.container, styles.blackBg, { opacity: fadeAnim }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.permissionTitle, { color: '#ffffff' }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: 'rgba(255,255,255,0.7)' }]}>
            We need camera access to let you take photos of accessibility features.
          </Text>
          <Pressable
            style={[styles.permissionButton, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: '#ffffff' }]}>
              Grant Permission
            </Text>
          </Pressable>
          <Pressable
            style={[styles.cancelButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: 'rgba(255,255,255,0.7)' }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
      }
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const confirmPicture = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
  };

  // Feature type labels for display
  const featureLabels = {
    elevator: 'Elevator',
    ramp: 'Ramp',
    accessible_table: 'Accessible Table',
    wheelchair_entrance: 'Wheelchair Entrance',
    accessible_parking: 'Accessible Parking',
    accessible_restroom: 'Accessible Restroom',
    braille_signage: 'Braille Signage',
    audio_signals: 'Audio Signals',
    lowered_counter: 'Lowered Counter',
    automatic_doors: 'Automatic Doors',
    tactile_paving: 'Tactile Paving',
    service_animal: 'Service Animal Area',
  };

  // Show preview if image captured
  if (capturedImage) {
    return (
      <Animated.View style={[styles.container, styles.blackBg, { opacity: fadeAnim }]}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        
        {/* Header */}
        <View style={[styles.previewHeader, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Text style={styles.previewTitle}>
            {featureLabels[featureType] || 'Accessibility Feature'}
          </Text>
          <Text style={styles.previewSubtitle}>
            Does this photo clearly show the feature?
          </Text>
        </View>
        
        {/* Actions */}
        <View style={[styles.previewActions, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Pressable
            style={[styles.previewButton, styles.retakeButton]}
            onPress={retakePicture}
          >
            <Ionicons name="refresh" size={28} color="#ffffff" />
            <Text style={styles.previewButtonText}>Retake</Text>
          </Pressable>
          
          <Pressable
            style={[styles.previewButton, styles.confirmButton, { backgroundColor: colors.accent }]}
            onPress={confirmPicture}
          >
            <Ionicons name="checkmark" size={28} color="#ffffff" />
            <Text style={styles.previewButtonText}>Use Photo</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, styles.blackBg, { opacity: fadeAnim }]}>
      {/* Loading indicator while camera initializes */}
      {!cameraReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Opening camera...</Text>
        </View>
      )}
      
      <Animated.View style={[styles.cameraContainer, { opacity: contentAnim }]}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={handleCameraReady}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                Take a photo of the {featureLabels[featureType]?.toLowerCase() || 'feature'}
              </Text>
            </View>
            <Pressable style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse-outline" size={28} color="#ffffff" />
            </Pressable>
          </View>

          {/* Guide overlay */}
          <View style={styles.guideContainer}>
            <View style={[styles.guideBox, { borderColor: colors.accent }]} />
            <Text style={styles.guideText}>
              Center the {featureLabels[featureType]?.toLowerCase() || 'feature'} in frame
            </Text>
          </View>

          {/* Capture button */}
          <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Pressable
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={takePicture}
              disabled={isCapturing || !cameraReady}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </Pressable>
          </View>
        </CameraView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 200,
  },
  blackBg: {
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    paddingVertical: 30,
    paddingBottom: 50,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  preview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  previewTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
