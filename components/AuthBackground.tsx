import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuthBackgroundProps {
  children?: React.ReactNode;
}

export default function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Base Soft Gradient */}
      <LinearGradient
        colors={['#FFF5F8', '#F6FAF4', '#FAF6FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Brand Color Orbs */}
      {/* Top-Right Soft Magenta Glow */}
      <View style={[styles.orb, styles.magentaOrb]} />

      {/* Center-Right Soft Green Glow */}
      <View style={[styles.orb, styles.greenOrb]} />

      {/* Bottom-Left Soft Purple Glow */}
      <View style={[styles.orb, styles.purpleOrb]} />

      {/* Subtle Top-Left Accent */}
      <View style={[styles.orb, styles.topPinkOrb]} />

      {/* Blur Layer for Smooth Glassmorphism Diffusion */}
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  magentaOrb: {
    top: -40,
    left: -40,
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: 'rgba(236, 0, 108, 0.14)',
  },
  greenOrb: {
    top: SCREEN_HEIGHT * 0.22,
    right: -60,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: 'rgba(122, 175, 0, 0.12)',
  },
  purpleOrb: {
    bottom: -50,
    left: -50,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    backgroundColor: 'rgba(74, 25, 140, 0.10)',
  },
  topPinkOrb: {
    top: SCREEN_HEIGHT * 0.45,
    left: -40,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    backgroundColor: 'rgba(236, 0, 108, 0.08)',
  },
});
