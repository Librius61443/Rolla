import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getCurrentCoordinates } from '../location/CurrentLocation';
import { mapTheme, createMapStyle } from '../styles/mapTheme';

export default function MapboxMap({ is3D = true, theme = mapTheme }) {
  const [initialCoords, setInitialCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    (async () => {
      const coords = await getCurrentCoordinates();
      if (coords) {
        setInitialCoords(coords);
      }
    })();
  }, []);

  // Update pitch when is3D changes - only after map is ready
  useEffect(() => {
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`
        window.handleToggle && window.handleToggle(${is3D});
        true;
      `);
    }
  }, [is3D, mapReady]);

  // Memoize HTML content so it only changes when coords or theme change, NOT when is3D changes
  const htmlContent = useMemo(() => {
    if (!initialCoords) return '';
    
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
        <style>
          ${createMapStyle(theme)}
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = 'pk.eyJ1Ijoic3BsaXhlbnQiLCJhIjoiY21raXI3MW94MHh2ajNmcHNiaWU3dWJtbyJ9.tj2YzAw5qlteRPcpSczTsg';
          
          let map;
          let currentPitch = 60;
          let isAnimating = false;

          function initMap() {
            map = new mapboxgl.Map({
              container: 'map',
              style: 'mapbox://styles/mapbox/dark-v11',
              center: [${initialCoords.longitude}, ${initialCoords.latitude}],
              zoom: 16,
              pitch: 60,
              bearing: 0,
              antialias: true,
              attributionControl: false
            });

            // Enable rotation for 3D exploration
            map.dragRotate.enable();
            map.touchZoomRotate.enableRotation();

            // Wait for map to load before adding layers
            map.on('load', function() {
              // Add 3D buildings layer
              if (!map.getLayer('3d-buildings')) {
                map.addLayer({
                  'id': '3d-buildings',
                  'source': 'composite',
                  'source-layer': 'building',
                  'type': 'fill-extrusion',
                  'minzoom': 15,
                  'paint': {
                    'fill-extrusion-color': '${theme.building}',
                    'fill-extrusion-height': [
                      'interpolate', ['linear'], ['zoom'],
                      15, 0,
                      15.05, ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                      'interpolate', ['linear'], ['zoom'],
                      15, 0,
                      15.05, ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': ${theme.buildingOpacity}
                  }
                });
              }

              // Add terrain
              if (!map.getSource('mapbox-dem')) {
                map.addSource('mapbox-dem', {
                  'type': 'raster-dem',
                  'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                  'tileSize': 512,
                  'maxzoom': 14
                });
                map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
              }

              // Add sky layer
              if (!map.getLayer('sky')) {
                map.addLayer({
                  'id': 'sky',
                  'type': 'sky',
                  'paint': {
                    'sky-type': 'gradient',
                    'sky-gradient': [
                      'interpolate', ['linear'], ['sky-radial-progress'],
                      0.8, '${theme.skyLight}',
                      1, '${theme.skyDark}'
                    ]
                  }
                });
              }

              applyThemeColors();

              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
              }
            });
          }

          function applyThemeColors() {
            try {
              const style = map.getStyle();
              const layers = style && style.layers ? style.layers : [];
              const roadColor = '${theme.roadColor}';

              // Background
              const bgLayer = layers.find(l => l.type === 'background');
              if (bgLayer) {
                map.setPaintProperty(bgLayer.id, 'background-color', '${theme.groundColor}');
              }

              // Land/ground fills
              layers.filter(l => l.type === 'fill' && /land|landcover|landuse/i.test(l.id))
                .forEach(l => {
                  try { map.setPaintProperty(l.id, 'fill-color', '${theme.groundColor}'); } catch(e) {}
                });

              // Water
              layers.filter(l => /water/i.test(l.id)).forEach(l => {
                try {
                  if (l.type === 'line') map.setPaintProperty(l.id, 'line-color', '${theme.waterColor}');
                  else if (l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', '${theme.waterColor}');
                } catch(e) {}
              });

              // Roads
              layers.forEach(l => {
                const id = l.id.toLowerCase();
                const sourceLayer = (l['source-layer'] || '').toLowerCase();
                const isRoadById = id.includes('road') || id.includes('street') || 
                  id.includes('motorway') || id.includes('trunk') || id.includes('primary') ||
                  id.includes('secondary') || id.includes('tertiary') || id.includes('link') ||
                  id.includes('path') || id.includes('pedestrian') || id.includes('bridge') ||
                  id.includes('tunnel') || id.includes('turning') || id.includes('service') ||
                  id.includes('track') || id.includes('rail') || id.includes('transit');
                const isRoadBySource = sourceLayer === 'road' || sourceLayer === 'transit';
                
                if (!isRoadById && !isRoadBySource) return;
                
                try {
                  if (l.type === 'line') map.setPaintProperty(l.id, 'line-color', roadColor);
                  else if (l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', roadColor);
                } catch (err) {}
              });
            } catch (e) {
              console.warn('Theme paint application failed:', e);
            }
          }

          // Handle view toggle - smooth pitch-only animation
          window.handleToggle = function(toggle3D) {
            if (isAnimating) return;
            
            const targetPitch = toggle3D ? 60 : 0;
            if (Math.abs(map.getPitch() - targetPitch) < 1) return;
            
            isAnimating = true;
            
            // Use camera animation for seamless pitch change
            const center = map.getCenter();
            const zoom = map.getZoom();
            const bearing = map.getBearing();
            
            map.easeTo({
              center: center,
              zoom: zoom,
              bearing: bearing,
              pitch: targetPitch,
              duration: 800,
              easing: function(t) {
                // Cubic ease-in-out
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              }
            });
            
            map.once('moveend', function() {
              isAnimating = false;
              currentPitch = targetPitch;
            });
          };

          initMap();
        </script>
      </body>
    </html>
  `;
  }, [initialCoords, theme]);

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setLoading(false);
        setMapReady(true);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (!initialCoords) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff69b4" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: theme.primary,
          zIndex: 1
        }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
}
