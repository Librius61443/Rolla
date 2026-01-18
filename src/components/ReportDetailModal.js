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
import { useTheme } from '../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchReport, confirmReport, reportRemoval, reportBadPhoto } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function ReportDetailModal({ visible, reportId, onClose, onReportUpdated }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible && reportId) {
      loadReport();
    } else {
      setReport(null);
    }
  }, [visible, reportId]);

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
      await loadReport(); // Reload to show updated count
    } catch (error) {
      console.error('Error confirming report:', error);
      Alert.alert('Error', 'Failed to confirm report');
    } finally {
      setActionLoading(false);
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
            {/* Photo */}
            {report.photos && report.photos.length > 0 && report.photos[0].url && (
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
              <Pressable
                onPress={handleConfirm}
                disabled={actionLoading}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.confirmButton,
                  { backgroundColor: pressed ? colors.accentDark : colors.accent },
                ]}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={colors.secondary} />
                    <Text style={[styles.actionText, { color: colors.secondary }]}>
                      Confirm It's Here
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
              Reports with 10+ confirmations become permanent. Reports are removed after 10 people confirm removal.
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
