/**
 * Global Theme Configuration
 * Central place for all app colors, styling, and theme context
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Animated, StatusBar, Platform, useColorScheme } from 'react-native';

// Dark theme colors
export const darkColors = {
  primary: '#2a1a3a',
  secondary: '#252525',
  tertiary: '#3a475a',
  accent: '#7789ff',
  accessibilityColor: '#ffffff',
  accentDark: '#2554ff',
  handleColor: '#666666',
  text: '#ffffff',
  textMuted: '#8e93cb',
  textDark: '#2a1a3a',
  border: '#1e1f43',
  cardBg: '#3b3b3b',
  inputBg: '#3b3b3b',
  error: '#ff4757',
  success: '#2ed573',
    warning: '#ffa502',
  overlay: 'rgba(6, 3, 3, 0.7)',
};

// Light theme colors
export const lightColors = {
  primary: '#ffffff',
  secondary: '#eef1f4',
  tertiary: '#4b6781',
  accent: '#3355FF',
  accentDark: '#3634a3',
  accessibilityColor: '#3355FF',
  handleColor: '#999999',
  text: '#1c1c1e',
  textMuted: '#8e8e93',
  textDark: '#1c1c1e',
  border: '#d1d1d6',
  cardBg: '#ffffff',
  inputBg: '#dde0e5',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ff9500',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

// Dark map theme
export const darkMapTheme = {
  primary: '#0a0a0a',
  secondary: '#1a1a1a',
  accent: '#3355FF',
  accentDark: '#2244DD',
  accentGlow: 'rgba(51, 85, 255, 0.5)',
  building: '#222a50',
  buildingOpacity: 1,
  skyLight: '#0a0a15',
  skyDark: '#050510',
  roadColor: '#222a50',
  groundColor: '#17192d',
  waterColor: '#1a2a55',
  parkColor: '#0f2a1a',
  border: '#3355FF',
  chevronColor: '#18e8ff',
  chevronGlow: 'rgba(24, 190, 255, 0.7)',
  chevronOutline: '#ffffff',
  uiGreyCircle: '#2a2a2a',
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
  // Road label colors
  highwayLabel: '#ffa502',
  highwayLabelHalo: '#1a1520',
  primaryLabel: '#7789ff',
  primaryLabelHalo: '#101525',
  secondaryLabel: '#2ed573',
  secondaryLabelHalo: '#0f1a1a',
  minorLabel: '#8e93cb',
  minorLabelHalo: '#12101a',
  // UI colors - reference darkColors for consistency
  uiAccent: darkColors.accent,
  uiPrimary: darkColors.secondary,
};

// Light map theme
export const lightMapTheme = {
  primary: lightColors.primary,
  secondary: '#ffffff',
  accent: lightColors.accent,
  accentDark: lightColors.accentDark,
  accentGlow: 'rgba(88, 86, 214, 0.35)',
  building: '#bac7ff',
  buildingOpacity: 1,
  skyLight: '#87ceeb',
  skyDark: '#4a90c2',
  roadColor: '#bac7ff',
  groundColor: '#f4f7ff',
  waterColor: '#0c0d0e',
  parkColor: '#81c784',
  border: lightColors.border,
  chevronColor: '#1856ff',
  chevronGlow: 'rgba(24, 86, 255, 0.35)',
  chevronOutline: '#1a2d66',
  uiGreyCircle: '#ffffff',
  mapStyle: 'mapbox://styles/mapbox/light-v11',
  // Road label colors
  highwayLabel: '#cc5500',
  highwayLabelHalo: '#fff8e8',
  primaryLabel: '#2244cc',
  primaryLabelHalo: '#e8f0ff',
  secondaryLabel: '#117755',
  secondaryLabelHalo: '#e8fff4',
  minorLabel: '#4b6781',
  minorLabelHalo: '#ffffff',
  // UI colors - reference lightColors for consistency
  uiAccent: lightColors.accent,
  uiPrimary: lightColors.secondary,
};

// Legacy exports for backwards compatibility
export const colors = darkColors;
export const mapTheme = darkMapTheme;

/**
 * Theme Context
 */
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'dark', 'light', or 'system'
  
  // Handle null/undefined systemColorScheme - default to dark
  const effectiveSystemScheme = systemColorScheme ?? 'dark';
  
  const animatedValue = useRef(new Animated.Value(effectiveSystemScheme === 'dark' ? 1 : 0)).current;

  // Determine if we should use dark theme
  const isDark = themeMode === 'system' 
    ? effectiveSystemScheme === 'dark' 
    : themeMode === 'dark';

  // Set initial status bar on mount
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(isDark ? darkColors.primary : lightColors.primary);
    }
  }, []);

  // Update when system theme changes (only if in system mode)
  useEffect(() => {
    if (themeMode === 'system') {
      const toDark = effectiveSystemScheme === 'dark';
      StatusBar.setBarStyle(toDark ? 'light-content' : 'dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(toDark ? darkColors.primary : lightColors.primary);
      }
      Animated.timing(animatedValue, {
        toValue: toDark ? 1 : 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [effectiveSystemScheme, themeMode]);

  const setTheme = (mode) => {
    setThemeMode(mode);
    const toDark = mode === 'system' 
      ? effectiveSystemScheme === 'dark' 
      : mode === 'dark';
    
    StatusBar.setBarStyle(toDark ? 'light-content' : 'dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(toDark ? darkColors.primary : lightColors.primary);
    }

    Animated.timing(animatedValue, {
      toValue: toDark ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const currentColors = isDark ? darkColors : lightColors;
  const currentMapTheme = isDark ? darkMapTheme : lightMapTheme;

  return (
    <ThemeContext.Provider value={{
      isDark,
      themeMode,
      setTheme,
      colors: currentColors,
      mapTheme: currentMapTheme,
      animatedValue,
      darkColors,
      lightColors,
      darkMapTheme,
      lightMapTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Generate CSS for Mapbox WebView
 */
export const createMapStyle = (theme = darkMapTheme) => `
  * { margin: 0; padding: 0; }
  html, body, #map { height: 100%; width: 100%; }
  body { background: ${theme.primary}; }
  .mapboxgl-popup { max-width: 200px; }
  .mapboxgl-popup-content { 
    padding: 12px; 
    background: ${theme.secondary}; 
    color: ${theme.accent}; 
    border-radius: 8px; 
    font-weight: 500; 
    border: 1px solid ${theme.border};
  }
  .mapboxgl-popup-anchor-top .mapboxgl-popup-tip { border-bottom-color: ${theme.secondary}; }
  .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip { border-top-color: ${theme.secondary}; }
  .mapboxgl-popup-anchor-left .mapboxgl-popup-tip { border-right-color: ${theme.secondary}; }
  .mapboxgl-popup-anchor-right .mapboxgl-popup-tip { border-left-color: ${theme.secondary}; }
  .mapboxgl-ctrl-logo { display: none !important; }
  .mapboxgl-compact { display: none !important; }
  .mapboxgl-ctrl-group {
    background: ${theme.secondary};
    border: 1px solid ${theme.border};
  }
  .mapboxgl-ctrl button {
    background: ${theme.secondary};
    color: ${theme.accent};
  }
  .mapboxgl-ctrl button:hover {
    background: ${theme.accent};
    color: ${theme.primary};
  }
`;
