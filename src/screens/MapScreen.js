/**
 * MapScreen
 * Main map view with 2D/3D toggle
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapboxMap from '../components/MapboxMap';
import { mapTheme } from '../styles/theme';

export default function MapScreen() {
  const [is3D, setIs3D] = useState(true);

  const toggleView = () => {
    setIs3D(!is3D);
  };

  return (
    <View style={styles.container}>
      <MapboxMap is3D={is3D} theme={mapTheme} />
      
      {/* 2D/3D Toggle Button */}
      <Pressable
        onPress={toggleView}
        style={({ pressed }) => [
          styles.toggleButton,
          {
            backgroundColor: pressed ? mapTheme.accent : mapTheme.uiGreyCircle,
            shadowOpacity: pressed ? 0.8 : 0.3,
            shadowRadius: pressed ? 14 : 8,
            elevation: pressed ? 10 : 5,
          }
        ]}
      >
        {({ pressed }) => (
          <Ionicons
            name={is3D ? 'layers-outline' : 'layers'}
            size={50}
            color={pressed ? mapTheme.primary : mapTheme.accent}
          />
        )}
      </Pressable>
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
    bottom: 40,
    right: 20,
    zIndex: 10,
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
  },
});
