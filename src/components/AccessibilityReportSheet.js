/**
 * AccessibilityReportSheet Component
 * Pull-up sheet for reporting accessibility features on the map
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CameraCapture from './CameraCapture';
import { createReport, summarizeImage } from '../services/api';
import { getCurrentCoordinates } from '../services/location';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Snap points as translateY values (0 = top, SCREEN_HEIGHT = hidden)
const SNAP_TOP = SCREEN_HEIGHT * 0.08;
const SNAP_MIDDLE = SCREEN_HEIGHT * 0.5;
const SNAP_BOTTOM = SCREEN_HEIGHT;

const ACCESSIBILITY_ITEMS = [
  { id: 'elevator', icon: 'arrow-up-circle', label: 'Elevator' },
  { id: 'ramp', icon: 'trending-up', label: 'Ramp' },
  { id: 'accessible_table', icon: 'cafe', label: 'Accessible Table' },
  { id: 'wheelchair_entrance', icon: 'enter', label: 'Wheelchair Entrance' },
  { id: 'accessible_parking', icon: 'car', label: 'Accessible Parking' },
  { id: 'accessible_restroom', icon: 'water', label: 'Accessible Restroom' },
  { id: 'braille_signage', icon: 'hand-left', label: 'Braille Signage' },
  { id: 'audio_signals', icon: 'volume-high', label: 'Audio Signals' },
  { id: 'lowered_counter', icon: 'remove', label: 'Lowered Counter' },
  { id: 'automatic_doors', icon: 'log-in', label: 'Auto Doors' },
  { id: 'tactile_paving', icon: 'footsteps', label: 'Tactile Paving' },
  { id: 'service_animal', icon: 'paw', label: 'Service Animal OK' },
];

export default function AccessibilityReportSheet({ visible, onClose, onReport }) {
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values for each item
  const itemAnimations = useRef(
    ACCESSIBILITY_ITEMS.reduce((acc, item) => {
      acc[item.id] = new Animated.Value(0);
      return acc;
    }, {})
  ).current;
  
  // Use ref to track current position without causing re-renders
  const currentPosition = useRef(SNAP_BOTTOM);
  const dragStartPosition = useRef(SNAP_MIDDLE);

  // Animate to a specific Y position
  const animateTo = (toValue, onComplete) => {
    currentPosition.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      damping: 25,
      stiffness: 200,
      mass: 0.8,
    }).start(onComplete);
  };

  // Handle closing with animation
  const handleClose = () => {
    // Reset all item animations
    Object.keys(itemAnimations).forEach(key => {
      itemAnimations[key].setValue(0);
    });
    setSelectedItem(null);
    animateTo(SNAP_BOTTOM, () => {
      onClose();
    });
  };

  // Handle visibility
  useEffect(() => {
    if (visible) {
      // Reset animations when opening
      Object.keys(itemAnimations).forEach(key => {
        itemAnimations[key].setValue(0);
      });
      setSelectedItem(null);
      animateTo(SNAP_MIDDLE);
    }
  }, [visible]);

  // PanResponder for drag gestures
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      dragStartPosition.current = currentPosition.current;
    },
    onPanResponderMove: (_, gesture) => {
      const newY = dragStartPosition.current + gesture.dy;
      const clampedY = Math.max(SNAP_TOP, Math.min(SNAP_BOTTOM, newY));
      translateY.setValue(clampedY);
    },
    onPanResponderRelease: (_, gesture) => {
      const currentY = dragStartPosition.current + gesture.dy;
      const velocity = gesture.vy;
      
      // Determine target snap point
      let targetSnap;
      
      if (Math.abs(velocity) > 0.5) {
        // Fast swipe - use velocity direction
        if (velocity < 0) {
          // Swiping up
          if (currentY > SNAP_MIDDLE) {
            targetSnap = SNAP_MIDDLE;
          } else {
            targetSnap = SNAP_TOP;
          }
        } else {
          // Swiping down
          if (currentY < SNAP_MIDDLE) {
            targetSnap = SNAP_MIDDLE;
          } else {
            targetSnap = SNAP_BOTTOM;
          }
        }
      } else {
        // Slow drag - snap to nearest
        const distTop = Math.abs(currentY - SNAP_TOP);
        const distMiddle = Math.abs(currentY - SNAP_MIDDLE);
        const distBottom = Math.abs(currentY - SNAP_BOTTOM);
        
        if (distTop <= distMiddle && distTop <= distBottom) {
          targetSnap = SNAP_TOP;
        } else if (distMiddle <= distTop && distMiddle <= distBottom) {
          targetSnap = SNAP_MIDDLE;
        } else {
          targetSnap = SNAP_BOTTOM;
        }
      }
      
      // Animate to target
      if (targetSnap === SNAP_BOTTOM) {
        animateTo(SNAP_BOTTOM, onClose);
      } else {
        animateTo(targetSnap);
      }
    },
  }), [onClose]);

  const handleItemPress = (item) => {
    const newSelection = item.id === selectedItem ? null : item.id;
    
    // Animate out the previously selected item
    if (selectedItem && selectedItem !== item.id) {
      Animated.timing(itemAnimations[selectedItem], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    
    // Animate the new selection
    Animated.timing(itemAnimations[item.id], {
      toValue: newSelection === item.id ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    setSelectedItem(newSelection);
  };

  const handleSubmit = () => {
    if (selectedItem) {
      // Show camera to capture photo
      setShowCamera(true);
    }
  };

  const handlePhotoCapture = async (photoUri) => {
    setShowCamera(false);
    setIsSubmitting(true);

    try {
      // Get current location
      const location = await getCurrentCoordinates();
      
      if (!location) {
        Alert.alert('Error', 'Unable to get your location. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Create optimistic report immediately for better UX
      const optimisticReport = {
        _id: `temp-${Date.now()}`, // Temporary ID
        type: selectedItem,
        location: {
          longitude: location.longitude,
          latitude: location.latitude,
        },
        photoUrl: photoUri,
        status: 'pending',
        confirmations: [],
        createdAt: new Date().toISOString(),
        isOptimistic: true, // Flag for optimistic update
      };

      // Notify parent immediately with optimistic report
      if (onReport) {
        onReport(optimisticReport);
      }

      // Close the sheet immediately for snappy UX
      setIsSubmitting(false);
      setSelectedItem(null);
      handleClose();

      // Show success message IMMEDIATELY for better UX
      Alert.alert(
        'Thank You!', 
        'Your accessibility report has been submitted!',
        [{ text: 'OK' }]
      );

      // Submit report to backend in the background
      try {
        let summary = "";

        const aiResult = await summarizeImage(photoUri);

        console.log("AI RESULT:", aiResult);

      if (!aiResult?.is_relevant) {
        console.log("Blocked: Not accessibility-related");
        return;
      }

      if ((aiResult?.confidence ?? 0) < 80) {
        console.log("Blocked: Low confidence", aiResult.confidence);
        return;
      }

      // ✅ Only reaches here if confidence >= 80 AND relevant
      console.log("Uploading report — confidence OK");

      await createReport(
        selectedItem,
        location.longitude,
        location.latitude,
        photoUri,
        aiResult // optional: pass AI data later
      );

  // Optional: if you don't want to modify createReport backend yet,
  // just ignore passing summary and only use it locally.

        // Update with real report data (parent will refresh)
        if (onReport && result) {
          onReport(result);
        }
        
        // Refresh user data to update points and stats
        if (refreshUser) {
          console.log('Refreshing user after report creation...');
          await refreshUser();
        }
      } catch (submitError) {
        console.error('Error submitting report:', submitError);
        Alert.alert('Error', 'Failed to submit report. The marker will be removed.');
        // Notify parent to remove optimistic report
        if (onReport) {
          onReport({ _id: optimisticReport._id, removed: true });
        }
      }
    } catch (error) {
      console.error('Error preparing report:', error);
      Alert.alert('Error', 'Failed to prepare report. Please try again.');
      setIsSubmitting(false);
      setSelectedItem(null);
      handleClose();
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  // Split items into rows of 3
  const rows = [];
  for (let i = 0; i < ACCESSIBILITY_ITEMS.length; i += 3) {
    rows.push(ACCESSIBILITY_ITEMS.slice(i, i + 3));
  }

  if (!visible) return null;

  // Calculate footer opacity - only fade out when going to bottom
  const footerOpacity = translateY.interpolate({
    inputRange: [SNAP_TOP, SNAP_MIDDLE, SNAP_BOTTOM],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[
            styles.backdropInner,
            {
              opacity: translateY.interpolate({
                inputRange: [SNAP_TOP, SNAP_MIDDLE, SNAP_BOTTOM],
                outputRange: [0.7, 0.4, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.secondary,
            height: SCREEN_HEIGHT,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Extended touch area that goes above the sheet */}
        <View {...panResponder.panHandlers} style={styles.extendedTouchArea} />
        
        {/* Visible Drag Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.handleColor || '#888888' }]} />
        </View>

        {/* Items Grid */}
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item) => {
                const animValue = itemAnimations[item.id];
                const bgColor = animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.inputBg, colors.accent],
                });
                const iconColor = animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.accessibilityColor, colors.secondary],
                });
                const labelColor = animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.text, colors.accent],
                });
                
                return (
                  <View key={item.id} style={styles.itemContainer}>
                    <Pressable onPress={() => handleItemPress(item)}>
                      <Animated.View
                        style={[
                          styles.itemCircle,
                          { backgroundColor: bgColor },
                        ]}
                      >
                        <Animated.View>
                          <Ionicons
                            name={item.icon}
                            size={40}
                            color={selectedItem === item.id ? colors.secondary : colors.accessibilityColor}
                          />
                        </Animated.View>
                      </Animated.View>
                    </Pressable>
                    <Animated.Text
                      style={[
                        styles.itemLabel,
                        { color: labelColor },
                      ]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Animated.Text>
                  </View>
                );
              })}
              {/* Fill empty slots in last row */}
              {row.length < 3 &&
                Array(3 - row.length)
                  .fill(null)
                  .map((_, i) => (
                    <View key={`empty-${i}`} style={styles.emptySlot} />
                  ))}
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Fixed Submit Button - separate from sheet */}
      <Animated.View 
        style={[
          styles.fixedFooter, 
          { 
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.secondary,
            opacity: footerOpacity,
          }
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={!selectedItem || isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: selectedItem && !isSubmitting
                ? pressed
                  ? colors.accentDark
                  : colors.accent
                : colors.border,
            },
          ]}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text
                style={[
                  styles.submitText,
                  { color: colors.secondary },
                ]}
              >
                Submitting...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="camera"
                size={20}
                color={selectedItem ? colors.secondary : colors.textMuted}
              />
              <Text
                style={[
                  styles.submitText,
                  { color: selectedItem ? colors.secondary : colors.textMuted },
                ]}
              >
                Take Photo & Report
              </Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      {/* Camera Capture Modal */}
      <CameraCapture
        visible={showCamera}
        onCapture={handlePhotoCapture}
        onClose={handleCameraClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'visible',
  },
  extendedTouchArea: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  itemContainer: {
    width: '30%',
    alignItems: 'center',
  },
  itemCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  emptySlot: {
    width: '30%',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 102,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
