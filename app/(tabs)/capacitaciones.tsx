import AppHeader from '@/components/AppHeader';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function CapacitacionesScreen() {
  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <AppHeader title="Capacitaciones" showBack={true} />

      <View style={styles.container}>
        <Text style={styles.title}>Capacitaciones y Recursos</Text>
        <Text style={styles.subtitle}>
          Sección en desarrollo. Pronto encontrarás talleres, capacitaciones y recursos para tu emprendimiento.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
