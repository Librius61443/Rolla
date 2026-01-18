/**
 * MenuButton Component
 * Hamburger menu with fullscreen dropdown containing settings
 */

import React, { useState, useRef } from 'react';
import { 
  View, 
  Pressable, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, darkColors } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MenuButton() {
  const { isDark, themeMode, setTheme, colors, mapTheme } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Animation values
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;
  const buttonColorAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(menuAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(buttonColorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(settingsAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonColorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsOpen(false);
      setSettingsOpen(false);
    });
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const openSettings = () => {
    setSettingsOpen(true);
    Animated.spring(settingsAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const closeSettings = () => {
    Animated.timing(settingsAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSettingsOpen(false);
    });
  };

  const toggleSettings = () => {
    if (settingsOpen) {
      closeSettings();
    } else {
      openSettings();
    }
  };

  // Interpolations
  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const settingsTranslateY = settingsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const buttonBgColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [mapTheme.uiGreyCircle, colors.accent],
  });

  const buttonIconColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.accent, colors.secondary],
  });

  return (
    <>
      {/* Fullscreen Overlay */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim, backgroundColor: colors.overlay }]}>
            {/* Settings Panel (Top - Dropright) */}
            {settingsOpen && (
              <Animated.View 
                style={[
                  styles.settingsPanel,
                  {
                    opacity: settingsAnim,
                    transform: [{ translateY: settingsTranslateY }],
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Text style={[styles.panelTitle, { color: colors.textMuted }]}>Appearance</Text>
                
                <Pressable
                  style={({ pressed }) => [
                    styles.settingsItem,
                    themeMode === 'dark' && { backgroundColor: colors.secondary },
                    pressed && { backgroundColor: colors.tertiary },
                  ]}
                  onPress={() => setTheme('dark')}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: themeMode === 'dark' ? colors.accent : colors.secondary }]}>
                      <Ionicons name="moon" size={22} color={themeMode === 'dark' ? colors.textDark : colors.textMuted} />
                    </View>
                    <View>
                      <Text style={[styles.settingsItemTitle, { color: themeMode === 'dark' ? colors.accent : colors.text }]}>
                        Dark Mode
                      </Text>
                      <Text style={[styles.settingsItemSubtitle, { color: colors.textMuted }]}>
                        Easier on the eyes
                      </Text>
                    </View>
                  </View>
                  {themeMode === 'dark' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </Pressable>
                
                <Pressable
                  style={({ pressed }) => [
                    styles.settingsItem,
                    themeMode === 'light' && { backgroundColor: colors.secondary },
                    pressed && { backgroundColor: colors.tertiary },
                  ]}
                  onPress={() => setTheme('light')}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: themeMode === 'light' ? colors.accent : colors.secondary }]}>
                      <Ionicons name="sunny" size={22} color={themeMode === 'light' ? '#ffffff' : colors.textMuted} />
                    </View>
                    <View>
                      <Text style={[styles.settingsItemTitle, { color: themeMode === 'light' ? colors.accent : colors.text }]}>
                        Light Mode
                      </Text>
                      <Text style={[styles.settingsItemSubtitle, { color: colors.textMuted }]}>
                        Classic bright theme
                      </Text>
                    </View>
                  </View>
                  {themeMode === 'light' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.settingsItem,
                    themeMode === 'system' && { backgroundColor: colors.secondary },
                    pressed && { backgroundColor: colors.tertiary },
                  ]}
                  onPress={() => setTheme('system')}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: themeMode === 'system' ? colors.accent : colors.secondary }]}>
                      <Ionicons name="phone-portrait-outline" size={22} color={themeMode === 'system' ? (isDark ? colors.textDark : '#ffffff') : colors.textMuted} />
                    </View>
                    <View>
                      <Text style={[styles.settingsItemTitle, { color: themeMode === 'system' ? colors.accent : colors.text }]}>
                        System
                      </Text>
                      <Text style={[styles.settingsItemSubtitle, { color: colors.textMuted }]}>
                        Match device settings
                      </Text>
                    </View>
                  </View>
                  {themeMode === 'system' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </Pressable>
              </Animated.View>
            )}

            {/* Main Menu Panel (Bottom - Dropdown) */}
            <Animated.View 
              style={[
                styles.menuPanel,
                {
                  opacity: menuAnim,
                  transform: [{ translateY: menuTranslateY }],
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  settingsOpen && { backgroundColor: colors.secondary },
                  pressed && { backgroundColor: colors.tertiary },
                ]}
                onPress={toggleSettings}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: settingsOpen ? colors.accent : colors.secondary }]}>
                    <Ionicons name="settings-outline" size={22} color={settingsOpen ? (isDark ? colors.textDark : '#ffffff') : colors.text} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
                </View>
                <Ionicons 
                  name={settingsOpen ? "chevron-up" : "chevron-forward"} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.tertiary },
                ]}
                onPress={() => closeMenu()}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="person-outline" size={22} color={colors.text} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Profile</Text>
                </View>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.tertiary },
                ]}
                onPress={() => closeMenu()}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="navigate-outline" size={22} color={colors.text} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Navigation</Text>
                </View>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.tertiary },
                ]}
                onPress={() => closeMenu()}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="information-circle-outline" size={22} color={colors.text} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>About</Text>
                </View>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}

      {/* Hamburger Button */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={toggleMenu}>
          <Animated.View
            style={[
              styles.button,
              {
                backgroundColor: buttonBgColor,
              }
            ]}
          >
            <Animated.View>
              <Ionicons
                name={isOpen ? 'close' : 'menu'}
                size={24}
                color={isOpen ? colors.secondary : colors.accent}
              />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 100,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 50,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  settingsPanel: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  menuPanel: {
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '600',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
