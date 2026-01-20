/**
 * About Screen
 * Information about the Rolla app
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Brand colors
const BRAND_BLUE = '#3355FF';
// Dark mode greys - slightly elevated from background for depth
const DARK_GREY = '#333333';
const DARKER_GREY = '#262626';

const AboutScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  
  // Dynamic colors based on theme - use greys in dark mode, brand blue in light mode
  const cardColor = isDark ? DARK_GREY : BRAND_BLUE;
  const cardColorDarker = isDark ? DARKER_GREY : '#2244CC';

  const togglePrivacy = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPrivacyExpanded(!privacyExpanded);
  };

  const toggleTerms = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTermsExpanded(!termsExpanded);
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
    // Logo section - brand blue background
    logoSection: {
      alignItems: 'center',
      marginBottom: 32,
      backgroundColor: cardColor,
      borderRadius: 24,
      padding: 32,
    },
    logo: {
      width: 120,
      height: 120,
      borderRadius: 24,
      marginBottom: 16,
    },
    appName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    version: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    // Mission card - brand blue
    missionCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 12,
    },
    sectionTitleDefault: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    missionText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 26,
      fontStyle: 'italic',
    },
    // Description card - brand blue
    descriptionCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    descriptionText: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 24,
      marginBottom: 16,
    },
    descriptionTextLast: {
      marginBottom: 0,
    },
    // Features card
    featuresCard: {
      backgroundColor: colors.secondary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    featureItemLast: {
      marginBottom: 0,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: cardColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    // Points card - brand blue
    pointsCard: {
      backgroundColor: cardColor,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    pointsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    pointsRowLast: {
      marginBottom: 0,
    },
    pointsAction: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    pointsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4ade80',
    },
    // Credits card
    creditsCard: {
      backgroundColor: colors.secondary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
    },
    creditItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    creditItemLast: {
      borderBottomWidth: 0,
    },
    creditIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: cardColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    creditInfo: {
      flex: 1,
    },
    creditTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    creditSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    // Legal section - accordions
    legalSection: {
      marginBottom: 20,
    },
    legalAccordion: {
      backgroundColor: cardColor,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
    },
    legalHeader: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    legalHeaderText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
    legalContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: cardColorDarker,
    },
    legalText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: 20,
      marginBottom: 12,
    },
    legalTextLast: {
      marginBottom: 0,
    },
    legalSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ffffff',
      marginTop: 12,
      marginBottom: 8,
    },
    // Footer
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    footerText: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 4,
    },
    footerHeart: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  const features = [
    {
      icon: 'map',
      title: 'Interactive 3D Map',
      description: 'Explore your city in beautiful 3D with real-time accessibility information.',
    },
    {
      icon: 'accessibility',
      title: 'Accessibility Reports',
      description: 'Find and share wheelchair ramps, elevators, accessible restrooms, and more.',
    },
    {
      icon: 'camera',
      title: 'Photo Verification',
      description: 'Take photos to verify accessibility features and help others.',
    },
    {
      icon: 'navigate',
      title: 'Accessible Navigation',
      description: 'Get walking directions that consider accessibility needs.',
    },
    {
      icon: 'people',
      title: 'Community Driven',
      description: 'Built by and for people who care about accessibility.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>About</Text>
          <Pressable 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../assets/images/roland.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Rolla</Text>
          <Text style={styles.version}>Version 1.0.1</Text>
        </View>

        {/* Mission */}
        <View style={styles.missionCard}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            "Making the world more accessible, one report at a time. We believe everyone deserves equal access to navigate their community with confidence."
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>What is Rolla?</Text>
          <Text style={styles.descriptionText}>
            Rolla is a community-powered accessibility mapping app that helps people discover and share information about accessible locations in their area.
          </Text>
          <Text style={styles.descriptionText}>
            Whether you use a wheelchair, have mobility challenges, or simply want to help others, Rolla empowers you to contribute to a more inclusive world.
          </Text>
          <Text style={[styles.descriptionText, styles.descriptionTextLast]}>
            By crowdsourcing accessibility information, we're building the most comprehensive accessibility map in the world.
          </Text>
        </View>

        {/* How Points Work */}
        <View style={styles.pointsCard}>
          <Text style={styles.sectionTitle}>How Points Work</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsAction}>Create a new report</Text>
            <Text style={styles.pointsValue}>+1 pt</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsAction}>Add a photo</Text>
            <Text style={styles.pointsValue}>+2 pts</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsAction}>Confirm a report</Text>
            <Text style={styles.pointsValue}>+1 pt</Text>
          </View>
          <View style={[styles.pointsRow, styles.pointsRowLast]}>
            <Text style={styles.pointsAction}>Your report confirmed by others</Text>
            <Text style={styles.pointsValue}>+10 pts each</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitleDefault}>Features</Text>
          {features.map((feature, index) => (
            <View 
              key={feature.icon}
              style={[
                styles.featureItem,
                index === features.length - 1 && styles.featureItemLast
              ]}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color="#ffffff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Credits */}
        <View style={styles.creditsCard}>
          <Text style={styles.sectionTitleDefault}>Powered By</Text>
          <View style={styles.creditItem}>
            <View style={styles.creditIcon}>
              <Ionicons name="globe-outline" size={22} color="#ffffff" />
            </View>
            <View style={styles.creditInfo}>
              <Text style={styles.creditTitle}>Mapbox</Text>
              <Text style={styles.creditSubtitle}>Beautiful, interactive maps</Text>
            </View>
          </View>
          <View style={styles.creditItem}>
            <View style={styles.creditIcon}>
              <Ionicons name="phone-portrait-outline" size={22} color="#ffffff" />
            </View>
            <View style={styles.creditInfo}>
              <Text style={styles.creditTitle}>React Native & Expo</Text>
              <Text style={styles.creditSubtitle}>Cross-platform mobile framework</Text>
            </View>
          </View>
          <View style={[styles.creditItem, styles.creditItemLast]}>
            <View style={styles.creditIcon}>
              <Ionicons name="server-outline" size={22} color="#ffffff" />
            </View>
            <View style={styles.creditInfo}>
              <Text style={styles.creditTitle}>MongoDB Atlas</Text>
              <Text style={styles.creditSubtitle}>Cloud database infrastructure</Text>
            </View>
          </View>
        </View>

        {/* Legal Section - Dropdowns */}
        <View style={styles.legalSection}>
          {/* Privacy Policy Accordion */}
          <View style={styles.legalAccordion}>
            <Pressable 
              style={styles.legalHeader}
              onPress={togglePrivacy}
            >
              <Text style={styles.legalHeaderText}>Privacy Policy</Text>
              <Ionicons 
                name={privacyExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="rgba(255, 255, 255, 0.7)" 
              />
            </Pressable>
            {privacyExpanded && (
              <View style={styles.legalContent}>
                <View style={{ height: 20 }} />
                <Text style={styles.legalText}>
                  Last updated: January 2026
                </Text>
                
                <Text style={styles.legalSubtitle}>Information We Collect</Text>
                <Text style={styles.legalText}>
                  • Account information (username, email) when you register{'\n'}
                  • Location data when you use the map or submit reports{'\n'}
                  • Photos you choose to upload for accessibility reports{'\n'}
                  • Usage data to improve our services
                </Text>
                
                <Text style={styles.legalSubtitle}>How We Use Your Information</Text>
                <Text style={styles.legalText}>
                  • To provide and improve our accessibility mapping services{'\n'}
                  • To display accessibility reports on the map{'\n'}
                  • To calculate points and maintain leaderboards{'\n'}
                  • To communicate important updates about the app
                </Text>
                
                <Text style={styles.legalSubtitle}>Data Security</Text>
                <Text style={styles.legalText}>
                  We implement industry-standard security measures to protect your data. Your password is encrypted and we never share your personal information with third parties for marketing purposes.
                </Text>
                
                <Text style={styles.legalSubtitle}>Your Rights</Text>
                <Text style={[styles.legalText, styles.legalTextLast]}>
                  You can request to delete your account and associated data at any time by contacting us. You may also request a copy of your data.
                </Text>
              </View>
            )}
          </View>

          {/* Terms of Service Accordion */}
          <View style={styles.legalAccordion}>
            <Pressable 
              style={styles.legalHeader}
              onPress={toggleTerms}
            >
              <Text style={styles.legalHeaderText}>Terms of Service</Text>
              <Ionicons 
                name={termsExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="rgba(255, 255, 255, 0.7)" 
              />
            </Pressable>
            {termsExpanded && (
              <View style={styles.legalContent}>
                <View style={{ height: 20 }} />
                <Text style={styles.legalText}>
                  Last updated: January 2026
                </Text>
                
                <Text style={styles.legalSubtitle}>Acceptance of Terms</Text>
                <Text style={styles.legalText}>
                  By using Rolla, you agree to these terms. If you don't agree, please don't use the app.
                </Text>
                
                <Text style={styles.legalSubtitle}>User Conduct</Text>
                <Text style={styles.legalText}>
                  • Submit accurate accessibility information only{'\n'}
                  • Don't upload inappropriate or misleading photos{'\n'}
                  • Respect other users and the community{'\n'}
                  • Don't attempt to manipulate the points system
                </Text>
                
                <Text style={styles.legalSubtitle}>Content Ownership</Text>
                <Text style={styles.legalText}>
                  You retain ownership of photos you upload, but grant Rolla a license to display them for accessibility mapping purposes. Reports and confirmations become part of our community database.
                </Text>
                
                <Text style={styles.legalSubtitle}>Disclaimer</Text>
                <Text style={styles.legalText}>
                  Accessibility information is crowd-sourced and may not always be accurate. Always verify accessibility features before relying on them. Rolla is not liable for inaccurate information.
                </Text>
                
                <Text style={styles.legalSubtitle}>Changes to Terms</Text>
                <Text style={[styles.legalText, styles.legalTextLast]}>
                  We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Rolla. All rights reserved.</Text>
          <View style={styles.footerHeart}>
            <Text style={styles.footerText}>Made with </Text>
            <Ionicons name="heart" size={14} color={colors.accent} />
            <Text style={styles.footerText}> for accessibility</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;
