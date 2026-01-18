/**
 * App Navigator
 * Main navigation configuration
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/MapScreen';
import { useMapReadyCallback } from '../contexts/MapReadyContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const onMapReady = useMapReadyCallback();

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Map">
          {(props) => <MapScreen {...props} onMapReady={onMapReady} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
