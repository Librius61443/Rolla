import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/styles/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { MapReadyContext } from './src/contexts/MapReadyContext';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [mapIsReady, setMapIsReady] = useState(false);

  useEffect(() => {
    // Hide native splash screen immediately
    SplashScreen.hideAsync();
  }, []);

  // App is ready when map is ready (or after timeout as fallback)
  useEffect(() => {
    if (mapIsReady) {
      setAppIsReady(true);
    }
    // Fallback timeout in case map takes too long
    const timeout = setTimeout(() => {
      if (!appIsReady) {
        setAppIsReady(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [mapIsReady, appIsReady]);

  const handleMapReady = useCallback(() => {
    setMapIsReady(true);
  }, []);

  const handleLoadingFinish = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <MapReadyContext.Provider value={handleMapReady}>
            {/* Always render AppNavigator so map loads in background */}
            <View style={{ flex: 1 }}>
              <AppNavigator />
            </View>
            {/* Loading screen overlays on top */}
            {isLoading && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
                <LoadingScreen onFinish={handleLoadingFinish} isReady={appIsReady} />
              </View>
            )}
          </MapReadyContext.Provider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}