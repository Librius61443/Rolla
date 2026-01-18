/**
 * LoadingScreen Component
 * Custom animated splash screen with Roland mascot doing a wheelie
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Roland mascot image - the cute character with crown and wheel
const ROLAND_IMAGE = require('../assets/images/roland.png');

export default function LoadingScreen({ onFinish, isReady }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bouncy wheelie animation - starts at 0, velocity pushes up, springs back to 0
    Animated.spring(rotation, {
      toValue: 0,
      velocity: -12,     // Initial upward velocity (negative = rotate backward/up)
      useNativeDriver: true,
      speed: 6,          // Speed of animation
      bounciness: 12,    // Bounce factor
    }).start();
  }, [rotation]);
    

  // When app is ready, finish loading
  useEffect(() => {
    if (isReady && onFinish) {
      // Small delay to ensure animation settles
      const timer = setTimeout(onFinish, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, onFinish]);

  // Interpolate rotation for the wheelie effect
  const rotateInterpolate = rotation.interpolate({
    inputRange: [-25, 0, 15],
    outputRange: ['-25deg', '0deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.rolandContainer}>
        <Animated.Image
          source={ROLAND_IMAGE}
          style={[
            styles.roland,
            {
              transform: [
                // Translate to bottom-left corner pivot point
                { translateX: -80 },
                { translateY: 80 },
                // Apply rotation
                { rotate: rotateInterpolate },
                // Translate back
                { translateX: 80 },
                { translateY: -80 },
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3355FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolandContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roland: {
    width: 180,
    height: 180,
  },
});
