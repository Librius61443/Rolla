/**
 * MapScreen
 * Main map view with 2D/3D toggle and theme support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, StyleSheet, StatusBar, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapboxMap from '../components/MapboxMap';
import MenuButton from '../components/MenuButton';
import AccessibilityReportSheet from '../components/AccessibilityReportSheet';
import ReportDetailModal from '../components/ReportDetailModal';
import { useTheme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentCoordinates } from '../services/location';
import { fetchNearbyReports } from '../services/api';

export default function MapScreen({ onMapReady }) {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [is3D, setIs3D] = useState(true);
  const [showAccessibilitySheet, setShowAccessibilitySheet] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration }
  const { isDark, colors, mapTheme } = useTheme();
  const { user, isLoggedIn } = useAuth();

  // Fetch user location and reports on mount
  useEffect(() => {
    loadLocationAndReports();
  }, []);

  const loadLocationAndReports = async () => {
    try {
      const coords = await getCurrentCoordinates();
      console.log('Got coordinates:', coords);
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
      console.log('Fetching reports for:', longitude, latitude);
      const nearbyReports = await fetchNearbyReports(longitude, latitude, 10000); // 10km radius
      console.log('Loaded', nearbyReports?.length || 0, 'reports');
      console.log('First report:', nearbyReports?.[0]);
      setReports(nearbyReports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      // Silently fail - reports are not critical
    }
  }, []);

  const toggleView = () => {
    setIs3D(!is3D);
  };

  const handleAccessibilityReport = (newReport) => {
    if (!newReport) return;
    
    // Handle removal of failed optimistic report
    if (newReport.removed) {
      setReports(prevReports => 
        prevReports.filter(r => r._id !== newReport._id)
      );
      return;
    }
    
    // Check if this is an update to an optimistic report
    if (!newReport.isOptimistic) {
      // Real report came back - remove any temp reports and add the real one
      setReports(prevReports => {
        // Remove temp reports and any duplicate
        const filtered = prevReports.filter(r => 
          !r.isOptimistic && r._id !== newReport._id
        );
        return [...filtered, newReport];
      });
      return;
    }
    
    // Optimistically add the report to the map immediately
    setReports(prevReports => [...prevReports, newReport]);
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

  // Navigate to a report location
  const handleNavigateToReport = (coords) => {
    setDestination({
      longitude: coords[0],
      latitude: coords[1],
    });
  };

  // Handle route info from MapboxMap
  const handleRouteInfo = (info) => {
    setRouteInfo(info);
  };

  // Clear navigation route
  const clearNavigation = () => {
    setDestination(null);
    setRouteInfo(null);
  };

  // Format distance for display
  const formatDistance = (meters) => {
    if (!meters) return '';
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Format duration for display
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    if (seconds < 60) {
      return `${Math.round(seconds)} sec`;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MapboxMap 
        is3D={is3D} 
        onMapReady={onMapReady} 
        reports={reports}
        onReportClick={handleReportClick}
        destination={destination}
        onRouteInfo={handleRouteInfo}
        mapRef={mapRef}
      />
      
      {/* Menu Button */}
      <MenuButton />
      
      {/* Profile Button */}
      <Pressable
        onPress={() => navigation.navigate('Profile')}
        style={({ pressed }) => [
          styles.profileButton,
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
            name={isLoggedIn ? 'person' : 'person-outline'}
            size={26}
            color={pressed ? colors.secondary : colors.accent}
          />
        )}
      </Pressable>
      
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

      {/* Center on User Button */}
      <Pressable
        onPress={() => mapRef.current?.centerOnUser()}
        style={({ pressed }) => [
          styles.centerButton,
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
            name="locate"
            size={26}
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
        onNavigate={handleNavigateToReport}
      />

      {/* Clear Navigation Button (shown when navigating) */}
      {destination && (
        <Pressable
          onPress={clearNavigation}
          style={({ pressed }) => [
            styles.clearNavButton,
            {
              backgroundColor: pressed ? colors.error : mapTheme.uiGreyCircle,
              shadowOpacity: pressed ? 0.8 : 0.3,
            }
          ]}
        >
          {({ pressed }) => (
            <Ionicons
              name="close-circle"
              size={26}
              color={pressed ? '#ffffff' : colors.error}
            />
          )}
        </Pressable>
      )}

      {/* Navigation Panel (shown when navigating) */}
      {destination && routeInfo && (
        <View style={[
          styles.navigationPanel,
          {
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          <View style={styles.navPanelHeader}>
            <Ionicons 
              name="navigate" 
              size={24} 
              color={colors.accent} 
            />
            <Text style={[
              styles.navPanelTitle,
              { color: isDark ? '#ffffff' : '#1a1a1a' }
            ]}>
              Directions
            </Text>
          </View>
          
          <View style={styles.navPanelInfo}>
            <View style={styles.navInfoItem}>
              <Ionicons 
                name="walk-outline" 
                size={20} 
                color={isDark ? '#aaaaaa' : '#666666'} 
              />
              <Text style={[
                styles.navInfoText,
                { color: isDark ? '#ffffff' : '#1a1a1a' }
              ]}>
                {formatDistance(routeInfo.distance)}
              </Text>
            </View>
            
            <View style={[
              styles.navInfoDivider,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }
            ]} />
            
            <View style={styles.navInfoItem}>
              <Ionicons 
                name="time-outline" 
                size={20} 
                color={isDark ? '#aaaaaa' : '#666666'} 
              />
              <Text style={[
                styles.navInfoText,
                { color: isDark ? '#ffffff' : '#1a1a1a' }
              ]}>
                {formatDuration(routeInfo.duration)}
              </Text>
            </View>
          </View>
          
          <Pressable
            onPress={clearNavigation}
            style={({ pressed }) => [
              styles.endNavButton,
              {
                backgroundColor: pressed ? colors.error : 'transparent',
                borderColor: colors.error,
              }
            ]}
          >
            {({ pressed }) => (
              <Text style={[
                styles.endNavButtonText,
                { color: pressed ? '#ffffff' : colors.error }
              ]}>
                End Navigation
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  profileButton: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
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
  centerButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    zIndex: 10,
    width: 80,
    height: 80,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
  },
  clearNavButton: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
  },
  navigationPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 120,
    zIndex: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  navPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  navPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  navPanelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  navInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navInfoText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  navInfoDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  endNavButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  endNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
