import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/NeumorphicStyles';

function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.white : Colors.textSecondary}
      />
    </View>
  );
}

function PublishTabIcon() {
  return (
    <View style={styles.publishFab}>
      <Ionicons name="add" size={28} color={Colors.white} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0,
          height: 70,
          paddingTop: 6,
          // neumorphic top shadow
          shadowColor: Colors.shadowDark,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 12,
        },
      }}
    >
      {/* ── Inicio ── */}
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />

      {/* ── Publicar (centro) ── */}
      <Tabs.Screen
        name="publicar"
        options={{
          title: '',
          tabBarIcon: () => <PublishTabIcon />,
          tabBarLabel: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* ── Perfil ── */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />

      {/* Hidden legacy screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />

      {/* ── Detalle de producto (ruta dinámica, sin tab) ── */}
      <Tabs.Screen
        name="producto/[id]"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 40,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  publishFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    // Neumorphic elevation
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
