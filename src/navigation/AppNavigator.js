/**
 * App Navigator
 * Main navigation configuration
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/MapScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import { useMapReadyCallback } from '../contexts/MapReadyContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../styles/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const onMapReady = useMapReadyCallback();
  const { isLoggedIn, loading } = useAuth();
  const { colors } = useTheme();
  const [hasSeenLogin, setHasSeenLogin] = useState(false);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Determine initial route - show login if not logged in and hasn't seen login yet
  const initialRoute = isLoggedIn || hasSeenLogin ? 'Map' : 'Login';

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
        }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Map">
          {(props) => <MapScreen {...props} onMapReady={onMapReady} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Login"
          options={{ animation: 'slide_from_bottom' }}
        >
          {(props) => <LoginScreen {...props} onSkip={() => setHasSeenLogin(true)} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
