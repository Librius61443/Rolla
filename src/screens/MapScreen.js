/**
 * MapScreen
 * Main map view with 2D/3D toggle and theme support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, StyleSheet, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapboxMap from '../components/MapboxMap';
import MenuButton from '../components/MenuButton';
import AccessibilityReportSheet from '../components/AccessibilityReportSheet';
import ReportDetailModal from '../components/ReportDetailModal';
import { useTheme } from '../styles/theme';
import { getCurrentCoordinates } from '../services/location';
import { fetchNearbyReports } from '../services/api';

export default function MapScreen({ onMapReady }) {
  const [is3D, setIs3D] = useState(true);
  const [showAccessibilitySheet, setShowAccessibilitySheet] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const { isDark, colors, mapTheme } = useTheme();

  // Fetch user location and reports on mount
  useEffect(() => {
    loadLocationAndReports();
  }, []);

  const loadLocationAndReports = async () => {
    try {
      const coords = await getCurrentCoordinates();
      if (coords) {
        setUserLocation(coords);
        await loadReports(coords.longitude, coords.latitude);
      }
    } catch (error) {
      console.error('Error loading location/reports:', error);
    }
  };

  const loadReports = useCallback(async (longitude, latitude) => {
    try {
      const nearbyReports = await fetchNearbyReports(longitude, latitude, 2000); // 2km radius
      setReports(nearbyReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      // Silently fail - reports are not critical
    }
  }, []);

  const toggleView = () => {
    setIs3D(!is3D);
  };

  const handleAccessibilityReport = (newReport) => {
    // Reload reports when a new one is added
    if (userLocation) {
      loadReports(userLocation.longitude, userLocation.latitude);
    }
  };

  const handleReportClick = (reportData) => {
    setSelectedReportId(reportData.reportId);
    setShowReportDetail(true);
  };

  const handleReportDetailClose = () => {
    setShowReportDetail(false);
    setSelectedReportId(null);
  };

  const handleReportUpdated = () => {
    // Reload reports when one is updated
    if (userLocation) {
      loadReports(userLocation.longitude, userLocation.latitude);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MapboxMap 
        is3D={is3D} 
        onMapReady={onMapReady} 
        reports={reports}
        onReportClick={handleReportClick}
      />
      
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

      {/* Report Detail Modal */}
      <ReportDetailModal
        visible={showReportDetail}
        reportId={selectedReportId}
        onClose={handleReportDetailClose}
        onReportUpdated={handleReportUpdated}
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
