/**
 * MapScreen
 * Main map view with 2D/3D toggle and theme support
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapboxMap from '../components/MapboxMap';
import MenuButton from '../components/MenuButton';
import AccessibilityReportSheet from '../components/AccessibilityReportSheet';
import { useTheme } from '../styles/theme';

export default function MapScreen({ onMapReady }) {
  const [is3D, setIs3D] = useState(true);
  const [showAccessibilitySheet, setShowAccessibilitySheet] = useState(false);
  const { isDark, colors, mapTheme } = useTheme();

  const toggleView = () => {
    setIs3D(!is3D);
  };

  const handleAccessibilityReport = (itemId) => {
    // TODO: Handle the accessibility report - save to database, add marker to map, etc.
    console.log('Accessibility feature reported:', itemId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MapboxMap is3D={is3D} onMapReady={onMapReady} />
      
      {/* Menu Button */}
      <MenuButton />
      
      {/* 2D/3D Toggle Button */}
      <Pressable
        onPress={toggleView}
        style={({ pressed }) => [
          styles.toggleButton,
          {
            backgroundColor: pressed ? colors.accent : mapTheme.uiGreyCircle,
            shadowOpacity: pressed ? 0.8 : 0.3,
            shadowRadius: pressed ? 14 : 8,
            elevation: pressed ? 10 : 5,
          }
        ]}
      >
        {({ pressed }) => (
          <Ionicons
            name={is3D ? 'layers-outline' : 'layers'}
            size={30}
            color={pressed ? colors.secondary : colors.accent}
          />
        )}
      </Pressable>

      {/* Add Accessibility Report Button */}
      <Pressable
        onPress={() => setShowAccessibilitySheet(true)}
        style={({ pressed }) => [
          styles.addButton,
          {
            backgroundColor: pressed ? colors.accent : mapTheme.uiGreyCircle,
            shadowOpacity: pressed ? 0.8 : 0.3,
            shadowRadius: pressed ? 14 : 8,
            elevation: pressed ? 10 : 5,
          }
        ]}
      >
        {({ pressed }) => (
          <Ionicons
            name="add"
            size={32}
            color={pressed ? colors.secondary : colors.accent}
          />
        )}
      </Pressable>

      {/* Accessibility Report Sheet */}
      <AccessibilityReportSheet
        visible={showAccessibilitySheet}
        onClose={() => setShowAccessibilitySheet(false)}
        onReport={handleAccessibilityReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
  },
  addButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
    width: 80,
    height: 80,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
  },
});
