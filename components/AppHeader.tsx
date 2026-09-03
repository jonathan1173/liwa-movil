import { Colors } from '@/constants/NeumorphicStyles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showNotif?: boolean;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  onFilterPress?: () => void;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  showNotif = true,
  rightElement,
  leftElement,
  showSearch = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onFilterPress,
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
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: showSearch ? 18 : 14,
        },
      ]}
    >
      {/* Fila superior: Atrás + Título/Subtítulo + Botón izquierdo opcional + Notificación / Acción derecha */}
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          )}

          <View style={styles.titleWrapper}>
            {subtitle ? (
              <Text style={styles.subtitleTag}>{subtitle}</Text>
            ) : null}
            {title ? (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <Image
                source={require('@/assets/images/liwa_nombre.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            )}
          </View>

          {leftElement ? (
            <View style={styles.leftElementBox}>{leftElement}</View>
          ) : null}
        </View>

        {/* Sección derecha: Notificación o elemento personalizado */}
        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : showNotif ? (
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/(tabs)/notificaciones' as any)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color={Colors.white}
              />
              {/* <View style={styles.notifBadge} /> */}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      {/* Barra de Búsqueda integrada (sólo en Explorar y Trueque cuando showSearch=true) */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search-outline"
            size={19}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={
              searchPlaceholder || 'Buscar productos y servicios...'
            }
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery && searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => onSearchChange && onSearchChange('')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.8}
            onPress={onFilterPress}
          >
            <Ionicons name="options-outline" size={18} color={Colors.purple} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.purple,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  titleWrapper: {
    justifyContent: 'center',
  },
  subtitleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  leftElementBox: {
    marginLeft: 10,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E60067',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    height: 48,
    paddingHorizontal: 14,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3EEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  logoImage: {
    width: 100,
    height: 36,
  },
});
