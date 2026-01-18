/**
 * Profile Screen
 * Shows user profile with points, level, and settings
 * Also includes the About section
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { fetchLeaderboard } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

// Level badge colors
const LEVEL_COLORS = {
  Explorer: '#6c757d',
  Contributor: '#28a745',
  Advocate: '#007bff',
  Champion: '#9c27b0',
  Legend: '#ffc107',
};

// Brand colors
const BRAND_BLUE = '#3355FF';
// Dark mode grey - slightly elevated from background for depth
const DARK_GREY = '#333333';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, isLoggedIn, logout, refreshUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dynamic colors based on theme - use grey in dark mode, brand blue in light mode
  const profileCardColor = isDark ? DARK_GREY : BRAND_BLUE;

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        console.log('ProfileScreen focused - refreshing user data');
        refreshUser();
      }
    }, [isLoggedIn, refreshUser])
  );

  const loadLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const data = await fetchLeaderboard(5);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      loadLeaderboard(),
    ]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    // Profile section
    profileCard: {
      backgroundColor: profileCardColor,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      alignItems: 'center',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    username: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 16,
    },
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 16,
    },
    levelText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 14,
      marginLeft: 6,
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    pointsNumber: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    pointsLabel: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
      marginLeft: 8,
    },
    // Stats
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      width: '100%',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: 4,
    },
    // Guest prompt
    guestCard: {
      backgroundColor: colors.secondary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      alignItems: 'center',
    },
    guestTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    guestText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
    },
    signInButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      width: '100%',
    },
    signInButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    // Leaderboard
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    leaderboardCard: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    leaderboardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leaderboardItemLast: {
      borderBottomWidth: 0,
    },
    rank: {
      width: 30,
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textMuted,
    },
    rankFirst: {
      color: '#ffc107',
    },
    rankSecond: {
      color: '#adb5bd',
    },
    rankThird: {
      color: '#cd7f32',
    },
    leaderboardAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    leaderboardAvatarText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    leaderboardInfo: {
      flex: 1,
    },
    leaderboardName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    leaderboardLevel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    leaderboardPoints: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.accent,
    },
    // About section
    aboutCard: {
      backgroundColor: colors.secondary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    aboutTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    aboutMission: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    aboutText: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 22,
      marginBottom: 12,
    },
    aboutHighlight: {
      color: colors.accent,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    pointsExplainer: {
      marginTop: 8,
    },
    pointsExplainerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    pointsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    pointsAction: {
      fontSize: 14,
      color: colors.textMuted,
    },
    pointsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.success,
    },
    // Logout button
    logoutButton: {
      backgroundColor: colors.error + '20',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    logoutButtonText: {
      color: colors.error,
      fontSize: 16,
      fontWeight: '600',
    },
    version: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 20,
      marginBottom: 40,
    },
  });

  const renderLeaderboard = () => {
    if (loadingLeaderboard) {
      return <ActivityIndicator color={colors.accent} />;
    }

    return leaderboard.map((item, index) => (
      <View
        key={item._id || item.id || `leaderboard-${index}`}
        style={[
          styles.leaderboardItem,
          index === leaderboard.length - 1 && styles.leaderboardItemLast,
        ]}
      >
        <Text style={[
          styles.rank,
          index === 0 && styles.rankFirst,
          index === 1 && styles.rankSecond,
          index === 2 && styles.rankThird,
        ]}>
          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
        </Text>
        <View style={styles.leaderboardAvatar}>
          <Text style={styles.leaderboardAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>{item.username}</Text>
          <Text style={styles.leaderboardLevel}>{item.level}</Text>
        </View>
        <Text style={styles.leaderboardPoints}>{item.points}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoggedIn ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={[
              styles.levelBadge,
              { backgroundColor: LEVEL_COLORS[user?.level] || colors.accent }
            ]}>
              <Ionicons name="star" size={16} color="#ffffff" />
              <Text style={styles.levelText}>{user?.level || 'Explorer'}</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsNumber}>{user?.points || 0}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.stats?.totalReports || 0}</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.stats?.totalConfirmations || 0}</Text>
                <Text style={styles.statLabel}>Confirmations</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.stats?.totalPhotos || 0}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
            <Text style={styles.guestTitle}>Track Your Impact</Text>
            <Text style={styles.guestText}>
              Sign in to earn points for your accessibility reports,{'\n'}
              climb the leaderboard, and join our community of{'\n'}
              accessibility advocates.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInButtonText}>Sign In or Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>🏆 Top Contributors</Text>
        <View style={styles.leaderboardCard}>
          {renderLeaderboard()}
        </View>

        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>Rolla v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
