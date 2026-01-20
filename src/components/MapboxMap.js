/**
 * MapboxMap Component
 * 3D interactive map using Mapbox GL via WebView
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Magnetometer } from 'expo-sensors';
import { getCurrentCoordinates } from '../services/location';
import { useTheme, darkMapTheme, lightMapTheme } from '../styles/theme';

export default function MapboxMap({ is3D = true, onMapReady, reports = [], onReportClick, destination = null, onRouteInfo, mapRef }) {
  const { isDark, mapTheme, colors } = useTheme();
  const [initialCoords, setInitialCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [heading, setHeading] = useState(0);
  const webViewRef = useRef(null);
  const lastHeadingRef = useRef(0);
  
  // Expose centerOnUser method via ref
  React.useImperativeHandle(mapRef, () => ({
    centerOnUser: () => {
      if (webViewRef.current && mapReady) {
        webViewRef.current.injectJavaScript(`
          window.centerOnUser && window.centerOnUser();
          true;
        `);
      }
    }
  }), [mapReady]);

  useEffect(() => {
    (async () => {
      const coords = await getCurrentCoordinates();
      if (coords) {
        setInitialCoords(coords);
      }
    })();
  }, []);

  // Subscribe to magnetometer for compass heading
  useEffect(() => {
    let subscription;
    
    const startMagnetometer = async () => {
      const isAvailable = await Magnetometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Magnetometer not available');
        return;
      }
      
      Magnetometer.setUpdateInterval(100); // Update every 100ms
      
      subscription = Magnetometer.addListener((data) => {
        // Calculate heading from magnetometer data
        // For portrait mode on iOS/Android, use atan2(-x, y) for true north
        let angle = Math.atan2(-data.x, data.y) * (180 / Math.PI);
        // Normalize to 0-360
        angle = (angle + 360) % 360;
        
        // Only update if heading changed significantly (reduces jitter)
        if (Math.abs(angle - lastHeadingRef.current) > 2) {
          lastHeadingRef.current = angle;
          setHeading(angle);
        }
      });
    };
    
    startMagnetometer();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Update chevron heading when it changes - only after map is ready
  useEffect(() => {
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`
        window.updateChevronHeading && window.updateChevronHeading(${heading});
        true;
      `);
    }
  }, [heading, mapReady]);

  // Update pitch when is3D changes - only after map is ready
  useEffect(() => {
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`
        window.handleToggle && window.handleToggle(${is3D});
        true;
      `);
    }
  }, [is3D, mapReady]);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  const lastThemeValue = useRef(isDark);
  
  // Update theme colors when isDark changes - only after map is ready
  // Skip the initial call when mapReady first becomes true
  useEffect(() => {
    // Skip if map isn't ready yet
    if (!mapReady || !webViewRef.current) {
      return;
    }
    
    // On first run after map is ready, just record the theme and skip
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastThemeValue.current = isDark;
      return;
    }
    
    // Only call updateTheme if the theme actually changed
    if (lastThemeValue.current !== isDark) {
      console.log('Theme actually changed from', lastThemeValue.current, 'to', isDark);
      lastThemeValue.current = isDark;
      webViewRef.current.injectJavaScript(`
        window.updateTheme && window.updateTheme(${isDark});
        true;
      `);
    }
  }, [isDark, mapReady]);

  // Update report markers when reports change - only after map is ready
  useEffect(() => {
    if (webViewRef.current && mapReady && reports) {
      const reportsJson = JSON.stringify(reports);
      webViewRef.current.injectJavaScript(`
        window.updateReports && window.updateReports(${reportsJson});
        true;
      `);
    }
  }, [reports, mapReady]);

  // Update route when destination changes
  useEffect(() => {
    if (webViewRef.current && mapReady) {
      if (destination) {
        webViewRef.current.injectJavaScript(`
          window.setDestination && window.setDestination(${destination.longitude}, ${destination.latitude});
          true;
        `);
      } else {
        webViewRef.current.injectJavaScript(`
          window.clearRoute && window.clearRoute();
          true;
        `);
      }
    }
  }, [destination, mapReady]);

  // Memoize HTML content so it only changes when coords change (theme handled via injection)
  const htmlContent = useMemo(() => {
    if (!initialCoords) return '';
    
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
        <!-- Font Awesome for icons -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <!-- FontAwesome Markers for Mapbox -->
        <script src="https://cdn.jsdelivr.net/npm/mapbox-gl-fontawesome-markers@0.0.2/dist/index.min.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          html, body, #map { height: 100%; width: 100%; transition: background-color 0.4s ease; }
          body { background: ${mapTheme.primary}; }
          .mapboxgl-popup { max-width: 200px; }
          .mapboxgl-popup-content { 
            padding: 12px; 
            background: ${mapTheme.secondary}; 
            color: ${mapTheme.accent}; 
            border-radius: 8px; 
            font-weight: 500; 
            border: 1px solid ${mapTheme.border};
            transition: all 0.4s ease;
          }
          .mapboxgl-ctrl-logo { display: none !important; }
          .mapboxgl-compact { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = 'pk.eyJ1Ijoic3BsaXhlbnQiLCJhIjoiY21raXI3MW94MHh2ajNmcHNiaWU3dWJtbyJ9.tj2YzAw5qlteRPcpSczTsg';
          
          let map;
          let currentPitch = 60;
          let isAnimating = false;
          let currentIsDark = ${isDark};
          let userLocation = [${initialCoords.longitude}, ${initialCoords.latitude}];
          let locationMarker = null;
          let currentHeading = 0;
          let chevronFunctions = null;
          let lastReports = []; // Store last reports for re-applying after theme change

          // Theme configurations - sourced from styles/theme.js
          const darkTheme = ${JSON.stringify(darkMapTheme)};
          const lightTheme = ${JSON.stringify(lightMapTheme)};

          function getTheme() {
            return currentIsDark ? darkTheme : lightTheme;
          }

          function initMap() {
            try {
              console.log('initMap called');
              const theme = getTheme();
              console.log('Theme:', currentIsDark ? 'dark' : 'light', 'mapStyle:', theme.mapStyle);
              map = new mapboxgl.Map({
                container: 'map',
                style: theme.mapStyle,
                center: userLocation,
                zoom: 16,
                pitch: 60,
                bearing: 0,
                antialias: true,
                attributionControl: false
              });

              // Enable rotation for 3D exploration
              map.dragRotate.enable();
              map.touchZoomRotate.enableRotation();

              // Wait for style to fully load before adding layers
              // Use a flag to prevent double-processing when theme changes
              let layersInitialized = false;
              
              function onStyleLoad() {
                if (layersInitialized) {
                  console.log('Layers already initialized, skipping');
                  return;
                }
                layersInitialized = true;
                
                console.log('style.load event fired');
                console.log('Map style loaded:', map.isStyleLoaded());
                try {
                  addMapLayers();
                  console.log('addMapLayers completed');
                  add3DChevronMarker();
                  console.log('add3DChevronMarker completed');
                  addReportMarkers();
                  console.log('addReportMarkers completed');
                  // Apply theme colors immediately 
                  applyThemeColors();
                } catch(layerError) {
                  console.error('Error in style.load callback:', layerError);
                }
                // Re-apply after tiles load to override Mapbox defaults
                setTimeout(function() {
                  applyThemeColors();
                }, 200);
                setTimeout(function() {
                  applyThemeColors();
                }, 500);
                setTimeout(function() {
                  applyThemeColors();
                  // Only signal ready after theme is fully applied
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
                  }
                }, 1000);
              }
              
              map.once('style.load', onStyleLoad);

              map.on('error', function(e) {
                console.error('Map error:', e.error);
              });

              map.on('load', function() {
                // Map tiles loaded - apply theme again to ensure override
                applyThemeColors();
              });
              
              // Zoom listener for marker visibility
              map.on('zoom', function() {
                updateMarkerVisibility();
              });

              // Re-apply theme when tiles/sources load to catch late-loading layers
              map.on('sourcedata', function(e) {
                if (map.isStyleLoaded()) {
                  applyThemeColors();
                }
              });

              map.on('idle', function() {
                // Final pass when map is completely idle
                applyThemeColors();
              });
            } catch(e) {
              console.error('Error initializing map:', e);
            }
          }

          function add3DChevronMarker() {
            const theme = getTheme();
            
            try {
              // Remove existing marker layers if they exist
              if (map.getLayer('chevron-glow')) map.removeLayer('chevron-glow');
              if (map.getLayer('chevron-body')) map.removeLayer('chevron-body');
              if (map.getLayer('chevron-outline')) map.removeLayer('chevron-outline');
              if (map.getSource('user-location')) map.removeSource('user-location');
              if (map.getSource('chevron-shape')) map.removeSource('chevron-shape');

              // Add source for user location
              map.addSource('user-location', {
                'type': 'geojson',
                'data': {
                  'type': 'Feature',
                  'geometry': {
                    'type': 'Point',
                    'coordinates': userLocation
                  },
                  'properties': {
                    'bearing': currentHeading
                  }
                }
              });

              // Glow/pulse circle underneath - scales with zoom
              map.addLayer({
                'id': 'chevron-glow',
                'type': 'circle',
                'source': 'user-location',
                'paint': {
                  'circle-radius': [
                    'interpolate', ['exponential', 2], ['zoom'],
                    10, 10,
                    14, 18,
                    16, 30,
                    18, 50,
                    20, 75
                  ],
                  'circle-color': theme.chevronGlow,
                  'circle-blur': 0.7,
                  'circle-opacity': 0.6
                }
              });

              // Function to calculate chevron size based on zoom
              function getChevronSize(zoom) {
                // Base size at zoom 16, scale proportionally
                const baseZoom = 16;
                const baseSize = 0.0001;
                // Exponential scaling - size doubles for each zoom level decrease
                return baseSize * Math.pow(2, baseZoom - zoom);
              }

              // Function to rotate a point around the center
              function rotatePoint(px, py, cx, cy, angleDeg) {
                const angleRad = (angleDeg * Math.PI) / 180;
                const cos = Math.cos(angleRad);
                const sin = Math.sin(angleRad);
                const dx = px - cx;
                const dy = py - cy;
                return [
                  cx + dx * cos - dy * sin,
                  cy + dx * sin + dy * cos
                ];
              }

              // Function to generate rotated chevron coordinates
              function getChevronCoords(zoom, heading) {
                const chevronSize = getChevronSize(zoom);
                const lon = userLocation[0];
                const lat = userLocation[1];
                
                // Base chevron points (pointing north/up)
                const points = [
                  [lon, lat + chevronSize * 1.2],           // Top point
                  [lon - chevronSize * 0.7, lat - chevronSize * 0.6], // Bottom left
                  [lon, lat],                               // Center notch
                  [lon + chevronSize * 0.7, lat - chevronSize * 0.6], // Bottom right
                ];
                
                // Rotate all points around center based on heading
                const rotatedPoints = points.map(p => rotatePoint(p[0], p[1], lon, lat, heading));
                
                // Close the polygon
                rotatedPoints.push(rotatedPoints[0]);
                
                return rotatedPoints;
              }

              // Add chevron polygon source with initial coords
              const initialZoom = map.getZoom();
              map.addSource('chevron-shape', {
                'type': 'geojson',
                'data': {
                  'type': 'Feature',
                  'geometry': {
                    'type': 'Polygon',
                    'coordinates': [getChevronCoords(initialZoom, currentHeading)]
                  }
                }
              });

              // Function to get height based on zoom
              function getChevronHeight(zoom) {
                // Scale height to maintain visual proportion
                const baseZoom = 16;
                const baseHeight = 5;
                return baseHeight * Math.pow(2, baseZoom - zoom);
              }

              // 3D extruded chevron body - add on top of all layers
              map.addLayer({
                'id': 'chevron-body',
                'type': 'fill-extrusion',
                'source': 'chevron-shape',
                'paint': {
                  'fill-extrusion-color': theme.chevronColor,
                  'fill-extrusion-height': getChevronHeight(initialZoom),
                  'fill-extrusion-base': 0,
                  'fill-extrusion-opacity': 1
                }
              });

              // Chevron outline on top
              map.addLayer({
                'id': 'chevron-outline',
                'type': 'line',
                'source': 'chevron-shape',
                'paint': {
                  'line-color': theme.chevronOutline,
                  'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    10, 1.5,
                    16, 2.5,
                    20, 4
                  ],
                  'line-opacity': 0.9
                }
              });

              // Function to update chevron shape
              function updateChevron() {
                const zoom = map.getZoom();
                const source = map.getSource('chevron-shape');
                if (source) {
                  source.setData({
                    'type': 'Feature',
                    'geometry': {
                      'type': 'Polygon',
                      'coordinates': [getChevronCoords(zoom, currentHeading)]
                    }
                  });
                  // Update height to match proportional scaling
                  if (map.getLayer('chevron-body')) {
                    map.setPaintProperty('chevron-body', 'fill-extrusion-height', getChevronHeight(zoom));
                  }
                }
              }

              // Update chevron size on zoom
              map.on('zoom', updateChevron);
              
              // Store functions for external access
              chevronFunctions = {
                getChevronCoords,
                getChevronHeight,
                updateChevron
              };
              
              console.log('Chevron marker added');
            } catch(e) {
              console.error('Error adding chevron marker:', e);
            }
          }

          // Report type to FontAwesome icon mapping
          const REPORT_ICONS = {
            'elevator': 'fa-solid fa-elevator',
            'ramp': 'fa-solid fa-arrows-up-down',
            'accessible_table': 'fa-solid fa-mug-hot',
            'wheelchair_entrance': 'fa-solid fa-door-open',
            'accessible_parking': 'fa-solid fa-square-parking',
            'accessible_restroom': 'fa-solid fa-restroom',
            'braille_signage': 'fa-solid fa-hand-dots',
            'audio_signals': 'fa-solid fa-volume-high',
            'lowered_counter': 'fa-solid fa-cash-register',
            'automatic_doors': 'fa-solid fa-dungeon',
            'tactile_paving': 'fa-solid fa-braille',
            'service_animal': 'fa-solid fa-dog'
          };
          
          // Vibrant colors for each accessibility type
          const REPORT_COLORS = {
            'elevator': '#3355FF',        // Brand blue - vertical transport
            'ramp': '#22C55E',            // Green - slopes/inclines
            'accessible_table': '#F97316', // Orange - dining/seating
            'wheelchair_entrance': '#8B5CF6', // Purple - entrances
            'accessible_parking': '#06B6D4', // Cyan - parking
            'accessible_restroom': '#EC4899', // Pink - restrooms
            'braille_signage': '#EAB308',  // Yellow - visual aids
            'audio_signals': '#F43F5E',    // Rose - audio aids
            'lowered_counter': '#14B8A6',  // Teal - service counters
            'automatic_doors': '#A855F7',  // Violet - automatic features
            'tactile_paving': '#FF6B35',   // Coral - tactile surfaces
            'service_animal': '#84CC16'    // Lime - animal friendly
          };
          
          // Get color for report type
          function getReportColor(type) {
            return REPORT_COLORS[type] || '#3355FF';
          }
          
          // Store report markers for later removal/update
          let reportMarkers = [];

          function addReportMarkers() {
            console.log('addReportMarkers called');
            // FontAwesome markers are added dynamically via updateReports
            // This function just ensures we're ready
            console.log('addReportMarkers completed - ready for FontAwesome markers');
          }

          // Update reports data from React Native - using FontAwesome markers
          window.updateReports = function(reports) {
            console.log('updateReports called with', reports ? reports.length : 0, 'reports');
            
            // Store reports for later re-application
            if (reports && reports.length > 0) {
              lastReports = reports;
            }
            
            if (!map) {
              console.log('Map not ready');
              return;
            }
            
            // Remove existing markers
            reportMarkers.forEach(marker => marker.remove());
            reportMarkers = [];
            
            // Create FontAwesome markers for each report with type-specific colors
            reports.forEach(report => {
              const icon = REPORT_ICONS[report.type] || 'fa-solid fa-wheelchair';
              const color = getReportColor(report.type);
              
              try {
                const marker = new FontawesomeMarker({
                  icon: icon,
                  iconColor: '#ffffff',
                  color: color,
                  scale: 0.85
                })
                .setLngLat([report.location.longitude, report.location.latitude])
                .addTo(map);
                
                // Add click handler
                marker.getElement().addEventListener('click', function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'reportClick',
                      reportId: report.id || report._id,
                      reportType: report.type,
                      photoUrl: report.primaryPhoto ? report.primaryPhoto.url : null,
                      coordinates: [report.location.longitude, report.location.latitude]
                    }));
                  }
                });
                
                // Store reference to remove later
                reportMarkers.push(marker);
              } catch(e) {
                console.error('Error creating marker for report:', report.id, e);
              }
            });
            
            console.log('Created', reportMarkers.length, 'FontAwesome markers');
            
            // Update visibility based on current zoom
            updateMarkerVisibility();
          };
          
          // Update marker visibility based on zoom level
          function updateMarkerVisibility() {
            if (!map) return;
            const zoom = map.getZoom();
            // Fade out markers when zoomed out (below zoom 12)
            // Completely hide at zoom 10 or below
            let opacity = 1;
            let display = 'block';
            
            if (zoom <= 10) {
              opacity = 0;
              display = 'none';
            } else if (zoom < 13) {
              // Gradual fade between zoom 10-13
              opacity = (zoom - 10) / 3;
            }
            
            reportMarkers.forEach(marker => {
              const el = marker.getElement();
              if (el) {
                el.style.opacity = opacity;
                el.style.display = display;
                el.style.transition = 'opacity 0.3s ease';
              }
            });
          }

          // Update report marker colors on theme change
          function updateReportMarkerTheme() {
            // Re-create markers with new theme colors
            if (lastReports && lastReports.length > 0) {
              window.updateReports(lastReports);
            }
          }

          function addMapLayers() {
            const theme = getTheme();
            
            try {
              // Hide any existing Mapbox building layers to prevent conflicts
              const existingLayers = map.getStyle().layers;
              existingLayers.forEach(layer => {
                if (layer['source-layer'] === 'building' && layer.id !== 'buildings-2d') {
                  try {
                    map.setLayoutProperty(layer.id, 'visibility', 'none');
                  } catch(e) {}
                }
              });
              
              // Add 2D buildings layer (flat fill for better performance)
              if (!map.getLayer('buildings-2d')) {
                // Find the first symbol layer to insert buildings below it
                const layers = map.getStyle().layers;
                let labelLayerId;
                for (let i = 0; i < layers.length; i++) {
                  if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                    labelLayerId = layers[i].id;
                    break;
                  }
                }
                
                map.addLayer({
                  'id': 'buildings-2d',
                  'source': 'composite',
                  'source-layer': 'building',
                  'type': 'fill',
                  'minzoom': 13,
                  'paint': {
                    'fill-color': theme.building,
                    'fill-opacity': theme.buildingOpacity
                  }
                }, labelLayerId);
                console.log('2D buildings layer added');
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
                      0.8, theme.skyLight,
                      1, theme.skyDark
                    ]
                  }
                });
              }
            } catch(e) {
              console.error('Error adding map layers:', e);
            }
          }

          function applyThemeColors() {
            const theme = getTheme();
            try {
              const style = map.getStyle();
              const layers = style && style.layers ? style.layers : [];

              // Hide any existing Mapbox building layers to prevent conflicts with our 2D buildings
              layers.forEach(layer => {
                if (layer['source-layer'] === 'building' && layer.id !== 'buildings-2d') {
                  try {
                    map.setLayoutProperty(layer.id, 'visibility', 'none');
                  } catch(e) {}
                }
              });

              // Update 2D buildings
              if (map.getLayer('buildings-2d')) {
                map.setPaintProperty('buildings-2d', 'fill-color', theme.building);
                map.setPaintProperty('buildings-2d', 'fill-opacity', theme.buildingOpacity);
              }

              // Update sky
              if (map.getLayer('sky')) {
                map.setPaintProperty('sky', 'sky-gradient', [
                  'interpolate', ['linear'], ['sky-radial-progress'],
                  0.8, theme.skyLight,
                  1, theme.skyDark
                ]);
              }

              // Background
              const bgLayer = layers.find(l => l.type === 'background');
              if (bgLayer) {
                map.setPaintProperty(bgLayer.id, 'background-color', theme.groundColor);
              }

              // Land/ground fills
              layers.filter(l => l.type === 'fill' && /land|landcover|landuse/i.test(l.id))
                .forEach(l => {
                  try { map.setPaintProperty(l.id, 'fill-color', theme.groundColor); } catch(e) {}
                });

              // Water
              layers.filter(l => /water/i.test(l.id)).forEach(l => {
                try {
                  if (l.type === 'line') map.setPaintProperty(l.id, 'line-color', theme.waterColor);
                  else if (l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', theme.waterColor);
                } catch(e) {}
              });

              // Parks
              layers.filter(l => /park|green|grass|vegetation/i.test(l.id)).forEach(l => {
                try {
                  if (l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', theme.parkColor);
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
                  if (l.type === 'line') map.setPaintProperty(l.id, 'line-color', theme.roadColor);
                  else if (l.type === 'fill') map.setPaintProperty(l.id, 'fill-color', theme.roadColor);
                } catch (err) {}
              });

              // Update chevron marker colors
              if (map.getLayer('chevron-glow')) {
                map.setPaintProperty('chevron-glow', 'circle-color', theme.chevronGlow);
              }
              if (map.getLayer('chevron-body')) {
                map.setPaintProperty('chevron-body', 'fill-extrusion-color', theme.chevronColor);
              }
              if (map.getLayer('chevron-outline')) {
                map.setPaintProperty('chevron-outline', 'line-color', theme.chevronOutline);
              }

              // Style road labels with hierarchy - colorful and bold
              layers.forEach(l => {
                const id = l.id.toLowerCase();
                if (l.type !== 'symbol') return;
                
                try {
                  // Major highways - bold, warning/orange accent
                  if (id.includes('motorway') || id.includes('trunk')) {
                    map.setPaintProperty(l.id, 'text-color', theme.highwayLabel);
                    map.setPaintProperty(l.id, 'text-halo-color', theme.highwayLabelHalo);
                    map.setPaintProperty(l.id, 'text-halo-width', 2.5);
                    try {
                      map.setLayoutProperty(l.id, 'text-font', ['DIN Pro Bold', 'Arial Unicode MS Bold']);
                      map.setLayoutProperty(l.id, 'text-size', [
                        'interpolate', ['linear'], ['zoom'],
                        10, 12, 14, 16, 18, 20
                      ]);
                    } catch(e) {}
                  }
                  // Primary roads - accent blue, bold
                  else if (id.includes('primary')) {
                    map.setPaintProperty(l.id, 'text-color', theme.primaryLabel);
                    map.setPaintProperty(l.id, 'text-halo-color', theme.primaryLabelHalo);
                    map.setPaintProperty(l.id, 'text-halo-width', 2);
                    try {
                      map.setLayoutProperty(l.id, 'text-font', ['DIN Pro Bold', 'Arial Unicode MS Bold']);
                      map.setLayoutProperty(l.id, 'text-size', [
                        'interpolate', ['linear'], ['zoom'],
                        12, 11, 16, 14, 20, 18
                      ]);
                    } catch(e) {}
                  }
                  // Secondary roads - success/green accent
                  else if (id.includes('secondary')) {
                    map.setPaintProperty(l.id, 'text-color', theme.secondaryLabel);
                    map.setPaintProperty(l.id, 'text-halo-color', theme.secondaryLabelHalo);
                    map.setPaintProperty(l.id, 'text-halo-width', 1.8);
                    try {
                      map.setLayoutProperty(l.id, 'text-font', ['DIN Pro Medium', 'Arial Unicode MS Regular']);
                      map.setLayoutProperty(l.id, 'text-size', [
                        'interpolate', ['linear'], ['zoom'],
                        12, 10, 16, 13, 20, 16
                      ]);
                    } catch(e) {}
                  }
                  // Tertiary and minor roads - muted text
                  else if (id.includes('tertiary') || id.includes('street') || id.includes('road-label')) {
                    map.setPaintProperty(l.id, 'text-color', theme.minorLabel);
                    map.setPaintProperty(l.id, 'text-halo-color', theme.minorLabelHalo);
                    map.setPaintProperty(l.id, 'text-halo-width', 1.5);
                    try {
                      map.setLayoutProperty(l.id, 'text-font', ['DIN Pro Medium', 'Arial Unicode MS Regular']);
                      map.setLayoutProperty(l.id, 'text-size', [
                        'interpolate', ['linear'], ['zoom'],
                        14, 9, 18, 12, 22, 14
                      ]);
                    } catch(e) {}
                  }
                } catch(e) {}
              });

              // Update body background
              document.body.style.backgroundColor = theme.primary;
            } catch (e) {
              console.warn('Theme paint application failed:', e);
            }
          }

          // Handle theme change without reloading
          window.updateTheme = function(isDark) {
            console.log('updateTheme called, isDark:', isDark);
            currentIsDark = isDark;
            const theme = getTheme();
            
            // Store current view state
            const center = map.getCenter();
            const zoom = map.getZoom();
            const pitch = map.getPitch();
            const bearing = map.getBearing();
            
            console.log('Setting new style:', theme.mapStyle);
            // Change base style and re-add layers
            map.setStyle(theme.mapStyle);
            
            map.once('style.load', function() {
              console.log('updateTheme style.load fired');
              // Restore view state
              map.jumpTo({ center, zoom, pitch, bearing });
              
              try {
                addMapLayers();
                console.log('updateTheme addMapLayers completed');
                add3DChevronMarker();
                console.log('updateTheme add3DChevronMarker completed');
                addReportMarkers();
                console.log('updateTheme addReportMarkers completed');
                applyThemeColors();
                updateReportMarkerTheme();
                
                // Re-apply stored reports after layers are recreated
                if (lastReports && lastReports.length > 0) {
                  console.log('Re-applying', lastReports.length, 'stored reports');
                  window.updateReports(lastReports);
                }
              } catch(e) {
                console.error('Error in updateTheme style.load:', e);
              }
              
              // Re-apply colors after a delay to catch tile loads
              setTimeout(function() {
                applyThemeColors();
              }, 300);
              setTimeout(function() {
                applyThemeColors();
              }, 800);
            });
          };

          // Handle view toggle - smooth pitch-only animation
          window.handleToggle = function(toggle3D) {
            if (isAnimating) return;
            
            const targetPitch = toggle3D ? 60 : 0;
            if (Math.abs(map.getPitch() - targetPitch) < 1) return;
            
            isAnimating = true;
            
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
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              }
            });
            
            map.once('moveend', function() {
              isAnimating = false;
              currentPitch = targetPitch;
            });
          };

          // Spring animation for smooth chevron rotation
          let targetHeading = 0;
          let animatedHeading = 0;
          let headingVelocity = 0;
          let headingAnimationFrame = null;
          
          // Spring physics constants
          const SPRING_STIFFNESS = .1;  // Lower = slower response
          const SPRING_DAMPING = 0.1;     // Higher = less bouncy
          
          // Normalize angle difference to -180 to 180
          function normalizeAngleDiff(diff) {
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;
            return diff;
          }
          
          // Spring animation loop for heading
          function animateHeading() {
            const diff = normalizeAngleDiff(targetHeading - animatedHeading);
            
            // Apply spring physics
            const springForce = diff * SPRING_STIFFNESS;
            headingVelocity += springForce;
            headingVelocity *= SPRING_DAMPING;
            animatedHeading += headingVelocity;
            
            // Normalize animated heading to 0-360
            animatedHeading = ((animatedHeading % 360) + 360) % 360;
            
            // Update the actual heading used by chevron
            currentHeading = animatedHeading;
            if (chevronFunctions && chevronFunctions.updateChevron) {
              chevronFunctions.updateChevron();
            }
            
            // Continue animating if there's still movement
            if (Math.abs(diff) > 0.1 || Math.abs(headingVelocity) > 0.1) {
              headingAnimationFrame = requestAnimationFrame(animateHeading);
            } else {
              headingAnimationFrame = null;
            }
          }
          
          // Handle chevron heading update from device compass
          window.updateChevronHeading = function(heading) {
            targetHeading = heading;
            
            // Start animation if not already running
            if (!headingAnimationFrame) {
              headingAnimationFrame = requestAnimationFrame(animateHeading);
            }
          };
          
          // Center map on user location
          window.centerOnUser = function() {
            if (userLocation && map) {
              map.easeTo({
                center: userLocation,
                zoom: 17,
                pitch: currentPitch,
                duration: 800,
                easing: function(t) {
                  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                }
              });
            }
          };

          // ============== DIRECTIONS ==============
          let routeLayerId = 'route-line';
          let destinationMarker = null;
          
          async function fetchRoute(start, end) {
            const url = 'https://api.mapbox.com/directions/v5/mapbox/walking/' +
              start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] +
              '?geometries=geojson&steps=true&access_token=' + mapboxgl.accessToken;
            
            try {
              const response = await fetch(url);
              const data = await response.json();
              
              if (data.routes && data.routes.length > 0) {
                return {
                  geometry: data.routes[0].geometry,
                  distance: data.routes[0].distance, // in meters
                  duration: data.routes[0].duration  // in seconds
                };
              }
              return null;
            } catch(e) {
              console.error('Error fetching route:', e);
              return null;
            }
          }
          
          window.setDestination = async function(lng, lat) {
            const theme = getTheme();
            
            // Clear existing route
            window.clearRoute();
            
            // Fetch route from current location to destination
            const routeData = await fetchRoute(userLocation, [lng, lat]);
            
            if (!routeData) {
              console.log('No route found');
              return;
            }
            
            // Add route line to map
            if (!map.getSource('route')) {
              map.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: routeData.geometry
                }
              });
            } else {
              map.getSource('route').setData({
                type: 'Feature',
                properties: {},
                geometry: routeData.geometry
              });
            }
            
            // Add route line layer (below labels but above roads)
            if (!map.getLayer(routeLayerId)) {
              // Find first symbol layer
              const layers = map.getStyle().layers;
              let firstSymbol;
              for (let i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol') {
                  firstSymbol = layers[i].id;
                  break;
                }
              }
              
              map.addLayer({
                id: routeLayerId,
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': theme.accent,
                  'line-width': 6,
                  'line-opacity': 0.8
                }
              }, firstSymbol);
            }
            
            // Add destination marker
            destinationMarker = new FontawesomeMarker({
              icon: 'fa-solid fa-location-dot',
              iconColor: '#ffffff',
              color: theme.accent,
              scale: 1.2
            })
            .setLngLat([lng, lat])
            .addTo(map);
            
            // Notify React Native with route info
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'routeSet',
                destination: [lng, lat],
                distance: routeData.distance, // in meters
                duration: routeData.duration  // in seconds
              }));
            }
          };
          
          window.clearRoute = function() {
            // Remove route layer
            if (map.getLayer(routeLayerId)) {
              map.removeLayer(routeLayerId);
            }
            // Remove route source
            if (map.getSource('route')) {
              map.removeSource('route');
            }
            // Remove destination marker
            if (destinationMarker) {
              destinationMarker.remove();
              destinationMarker = null;
            }
          };

          initMap();
        </script>
      </body>
    </html>
  `;
  // Only regenerate HTML when coordinates change - theme changes handled via JS injection
  }, [initialCoords]);

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setLoading(false);
        setMapReady(true);
        // Notify parent that map is ready
        if (onMapReady) {
          onMapReady();
        }
      } else if (data.type === 'reportClick' && onReportClick) {
        // Forward report click to parent
        onReportClick({
          reportId: data.reportId,
          reportType: data.reportType,
          photoUrl: data.photoUrl,
          coordinates: data.coordinates,
        });
      } else if (data.type === 'routeSet' && onRouteInfo) {
        // Forward route info to parent
        onRouteInfo({
          distance: data.distance,
          duration: data.duration,
        });
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (!initialCoords) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: mapTheme.primary }]}>
          <ActivityIndicator size="large" color={mapTheme.accent} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  webview: {
    flex: 1,
  },
});
