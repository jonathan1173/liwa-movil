import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#E60067',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
          textAlign: 'center',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: Platform.OS === 'ios' ? 62 + insets.bottom : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
      }}
    >
      {/* ── Inicio ── */}
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={23}
              color={focused ? '#E60067' : '#9CA3AF'}
            />
          ),
        }}
      />

      {/* ── Explorar ── */}
      <Tabs.Screen
        name="explorar"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={23}
              color={focused ? '#E60067' : '#9CA3AF'}
            />
          ),
        }}
      />

      {/* ── Publicar (Botón Central Destacado) ── */}
      <Tabs.Screen
        name="publicar"
        options={{
          title: 'Publicar',
          tabBarIcon: () => (
            <View style={styles.publishIconWrapper}>
              <View style={styles.publishCircle}>
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      {/* ── Comunidad ── */}
      <Tabs.Screen
        name="comunidad"
        options={{
          title: 'Comunidad',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={23}
              color={focused ? '#E60067' : '#9CA3AF'}
            />
          ),
        }}
      />

      {/* ── Perfil ── */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={23}
              color={focused ? '#E60067' : '#9CA3AF'}
            />
          ),
        }}
      />

      {/* Hidden secondary screens */}
      <Tabs.Screen name="notificaciones" options={{ href: null }} />
      <Tabs.Screen name="capacitaciones" options={{ href: null }} />
      <Tabs.Screen name="trueque" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  publishIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  publishCircle: {
    width: 34,
    height: 34,
    borderRadius: 22,
    backgroundColor: '#E60067',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#E60067',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
});
