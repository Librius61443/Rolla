/**
 * ReportDetailModal Component
 * Shows details and photo of an accessibility report
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchReport, confirmReport, reportRemoval, reportBadPhoto, addPhotoToReport, getDeviceUserId } from '../services/api';
import { getCurrentCoordinates } from '../services/location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Format points with commas (e.g., 10000 -> 10,000)
const formatPoints = (points) => {
  return points?.toLocaleString() || '0';
};

// Distance threshold in meters to allow adding photos
const PHOTO_DISTANCE_THRESHOLD = 50;

// Calculate distance between two coordinates in meters (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Report type labels and icons
const REPORT_TYPES = {
  'elevator': { icon: 'arrow-up-circle', label: 'Elevator' },
  'ramp': { icon: 'trending-up', label: 'Ramp' },
  'accessible_table': { icon: 'cafe', label: 'Accessible Table' },
  'wheelchair_entrance': { icon: 'enter', label: 'Wheelchair Entrance' },
  'accessible_parking': { icon: 'car', label: 'Accessible Parking' },
  'accessible_restroom': { icon: 'water', label: 'Accessible Restroom' },
  'braille_signage': { icon: 'hand-left', label: 'Braille Signage' },
  'audio_signals': { icon: 'volume-high', label: 'Audio Signals' },
  'lowered_counter': { icon: 'remove', label: 'Lowered Counter' },
  'automatic_doors': { icon: 'log-in', label: 'Auto Doors' },
  'tactile_paving': { icon: 'footsteps', label: 'Tactile Paving' },
  'service_animal': { icon: 'paw', label: 'Service Animal OK' },
};

export default function ReportDetailModal({ visible, reportId, onClose, onReportUpdated, onNavigate }) {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [deviceUserId, setDeviceUserId] = useState(null);

  // Load device user ID on mount
  useEffect(() => {
    getDeviceUserId().then(setDeviceUserId);
  }, []);

  // Check if current user is the creator (compare by user account _id, username, or device ID)
  const isOwnReport = report && (
    // Check by authenticated user
    (user && report.creator?._id && (report.creator._id === user._id || report.creator._id === user.id)) ||
    (user && report.creator?.username && report.creator.username === user.username) ||
    // Check by device ID
    (deviceUserId && report.creatorId && report.creatorId === deviceUserId)
  );

  useEffect(() => {
    if (visible && reportId) {
      // Don't try to fetch temp/optimistic reports - they don't exist on server yet
      if (reportId.toString().startsWith('temp-')) {
        console.log('Skipping fetch for temporary report:', reportId);
        setLoading(false);
        return;
      }
      loadReport();
      checkUserLocation();
    } else {
      setReport(null);
      setIsNearby(false);
    }
  }, [visible, reportId]);

  const checkUserLocation = async () => {
    try {
      const coords = await getCurrentCoordinates();
      if (coords) {
        setUserLocation(coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Check if user is near the report location
  useEffect(() => {
    if (report && userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.location.latitude,
        report.location.longitude
      );
      setIsNearby(distance <= PHOTO_DISTANCE_THRESHOLD);
    }
  }, [report, userLocation]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchReport(reportId);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Failed to load report details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await confirmReport(reportId);
      Alert.alert('Thank You!', 'Your confirmation has been recorded.');
      if (onReportUpdated) onReportUpdated();
      if (refreshUser) refreshUser(); // Update user points/stats
      await loadReport(); // Reload to show updated count
    } catch (error) {
      console.error('Error confirming report:', error);
      Alert.alert('Error', 'Failed to confirm report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to add photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setActionLoading(true);
        try {
          await addPhotoToReport(reportId, result.assets[0].uri);
          Alert.alert('Success!', 'Photo added successfully! You earned 2 points.');
          if (onReportUpdated) onReportUpdated();
          if (refreshUser) refreshUser(); // Update user points/stats
          await loadReport(); // Reload to show the new photo
        } catch (error) {
          console.error('Error adding photo:', error);
          Alert.alert('Error', 'Failed to add photo. Please try again.');
        } finally {
          setActionLoading(false);
        }
      }
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleReportRemoval = async () => {
    Alert.alert(
      'Report Removal',
      'Are you sure this accessibility feature no longer exists at this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Removal',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await reportRemoval(reportId);
              Alert.alert('Thank You!', 'Your removal report has been recorded.');
              if (onReportUpdated) onReportUpdated();
              onClose();
            } catch (error) {
              console.error('Error reporting removal:', error);
              Alert.alert('Error', 'Failed to report removal');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReportBadPhoto = async () => {
    if (!report?.photos?.length) return;

    Alert.alert(
      'Report Photo',
      'Is this photo inappropriate or incorrect?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Photo',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await reportBadPhoto(reportId, 0, 'Inappropriate or incorrect photo');
              Alert.alert('Thank You!', 'Your photo report has been recorded.');
              if (onReportUpdated) onReportUpdated();
            } catch (error) {
              console.error('Error reporting photo:', error);
              Alert.alert('Error', 'Failed to report photo');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const typeInfo = report ? REPORT_TYPES[report.type] || { icon: 'accessibility', label: report.type } : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.secondary }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top || 20 }]}>
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.handleColor || '#888888' }]} />
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : report ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Photo or Add Photo prompt */}
            {report.photos && report.photos.length > 0 && report.photos[0].url ? (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: report.photos[0].url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={handleReportBadPhoto}
                  style={[styles.reportPhotoButton, { backgroundColor: colors.border }]}
                >
                  <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.noPhotoContainer, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.noPhotoText, { color: colors.textMuted }]}>
                  No photo available
                </Text>
                {isNearby ? (
                  <Pressable
                    onPress={handleAddPhoto}
                    disabled={actionLoading}
                    style={({ pressed }) => [
                      styles.addPhotoButton,
                      { backgroundColor: pressed ? colors.accentDark : colors.accent },
                    ]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="camera" size={20} color="#ffffff" />
                        <Text style={styles.addPhotoButtonText}>Add Photo (+2 pts)</Text>
                      </>
                    )}
                  </Pressable>
                ) : (
                  <Text style={[styles.nearbyHint, { color: colors.textMuted }]}>
                    Get within 50m to add a photo
                  </Text>
                )}
              </View>
            )}

            {/* Type Info */}
            <View style={styles.typeContainer}>
              <View style={[styles.typeIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name={typeInfo.icon} size={32} color={colors.secondary} />
              </View>
              <Text style={[styles.typeLabel, { color: colors.text }]}>
                {typeInfo.label}
              </Text>
            </View>

            {/* Creator Info */}
            <View style={[styles.creatorContainer, { backgroundColor: colors.inputBg }]}>
              <View style={[styles.creatorAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.creatorAvatarText}>
                  {report.creator ? report.creator.username.charAt(0).toUpperCase() : 'C'}
                </Text>
              </View>
              <View style={styles.creatorInfo}>
                <Text style={[styles.creatorName, { color: colors.text }]}>
                  {report.creator ? report.creator.username : 'Community'}
                  <Text style={[styles.creatorPoints, { color: colors.textMuted }]}>
                    {report.creator ? ` | ${formatPoints(report.creator.points)}` : ''}
                  </Text>
                </Text>
                <Text style={[styles.creatorLevel, { color: colors.textMuted }]}>
                  {report.creator ? report.creator.level : 'Seeded data'}
                </Text>
              </View>
            </View>

            {/* Status */}
            <View style={[styles.statusContainer, { backgroundColor: colors.inputBg }]}>
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: colors.accent }]}>
                  {report.confirmations?.length || 0}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                  Confirmations
                </Text>
              </View>
              <View style={[styles.statusDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: colors.text }]}>
                  {report.status === 'permanent' ? '∞' : '48h'}
                </Text>
                <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                  {report.status === 'permanent' ? 'Permanent' : 'Expires'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {/* Navigate Button */}
              {onNavigate && (
                <Pressable
                  onPress={() => {
                    onNavigate([report.location.longitude, report.location.latitude]);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.navigateButton,
                    { 
                      backgroundColor: pressed ? colors.success : 'transparent',
                      borderColor: colors.success,
                    },
                  ]}
                >
                  <Ionicons 
                    name="navigate" 
                    size={24} 
                    color={colors.success} 
                  />
                  <Text style={[styles.actionText, { color: colors.success }]}>
                    Get Directions
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleConfirm}
                disabled={actionLoading || isOwnReport}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.confirmButton,
                  isOwnReport 
                    ? { backgroundColor: colors.border }
                    : { backgroundColor: pressed ? colors.accentDark : colors.accent },
                ]}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={isOwnReport ? colors.textMuted : colors.secondary} 
                    />
                    <Text style={[
                      styles.actionText, 
                      { color: isOwnReport ? colors.textMuted : colors.secondary }
                    ]}>
                      {isOwnReport ? 'Your Report' : "Confirm It's Here"}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleReportRemoval}
                disabled={actionLoading}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.removeButton,
                  { 
                    backgroundColor: pressed ? colors.border : 'transparent',
                    borderColor: colors.error || '#FF3B30',
                  },
                ]}
              >
                <Ionicons name="close-circle-outline" size={24} color={colors.error || '#FF3B30'} />
                <Text style={[styles.actionText, { color: colors.error || '#FF3B30' }]}>
                  It's No Longer Here
                </Text>
              </Pressable>
            </View>

            {/* Info */}
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Reports with many confirmations become permanent. Reports are removed after many people confirm removal.
            </Text>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photoContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  reportPhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 16,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noPhotoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addPhotoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nearbyHint: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeLabel: {
    fontSize: 24,
    fontWeight: '700',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  creatorPoints: {
    fontSize: 15,
    fontWeight: '400',
  },
  creatorLevel: {
    fontSize: 13,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  navigateButton: {
    borderWidth: 2,
  },
  confirmButton: {},
  removeButton: {
    borderWidth: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: 32,
  },
});
