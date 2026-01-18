/**
 * Global Theme Configuration
 * Central place for all app colors and styling
 */

export const colors = {
  // Primary palette
  primary: '#2a1a3a',        // Dark purple background
  secondary: '#3a2a4a',      // Medium purple
  tertiary: '#4a3a5a',       // Lighter purple
  
  // Accent colors
  accent: '#696cff',         // Purple-blue accent
  accentDark: '#2554ff',     // Darker accent
  accentPink: '#ff69b4',     // Hot pink (alternative)
  
  // Text colors
  text: '#ffffff',           // White text
  textMuted: '#b8a8c8',      // Muted purple text
  textDark: '#2a1a3a',       // Dark text for light backgrounds
  
  // UI colors
  border: '#5a4a6a',         // Purple border
  cardBg: '#3a2a4a',         // Card background
  inputBg: '#2a1a3a',        // Input background
  
  // Status colors
  error: '#ff4757',          // Red for errors/delete
  success: '#2ed573',        // Green for success
  warning: '#ffa502',        // Orange for warnings
};

/**
 * Map Theme Configuration
 */
export const mapTheme = {
  // Background and base colors
  primary: colors.primary,
  secondary: '#2a2e4a',
  accent: colors.accent,
  accentDark: colors.accentDark,

  // Building colors
  building: '#565656',
  buildingOpacity: 0.8,

  // Sky colors
  skyLight: 'rgb(60, 30, 80)',
  skyDark: 'rgb(20, 10, 30)',

  // Map feature colors
  roadColor: '#ff5858',
  groundColor: '#2a2a33',
  waterColor: '#0e1220',
  border: '#7169ff',
  uiGreyCircle: '#3a3a40',
};

/**
 * Generate CSS for Mapbox WebView
 */
export const createMapStyle = (theme = mapTheme) => `
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
