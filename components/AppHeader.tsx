import { Colors } from '@/constants/NeumorphicStyles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotif?: boolean;
}

export default function AppHeader({
  title,
  showBack = false,
  onBackPress,
  showNotif = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/inicio' as any);
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.iconBtn} activeOpacity= {0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <Image
            source={require('@/assets/images/liwa_nombre.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.centerContainer}>
        {title ? (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : showBack ? (
          <Image
            source={require('@/assets/images/liwa_color.png')}
            style={styles.logoImageCenter}
            resizeMode="contain"
          />
        ) : null}
      </View>

      <View style={styles.rightContainer}>
        {showNotif ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/notificaciones' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.accent} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  leftContainer: {
    width: 100,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 100,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  logoImage: {
    width: 100,
    height: 36,
  },
  logoImageCenter: {
    width: 90,
    height: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
