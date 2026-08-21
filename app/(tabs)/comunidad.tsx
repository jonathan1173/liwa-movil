import AppHeader from '@/components/AppHeader';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function ComunidadScreen() {
  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <AppHeader title="Comunidad" showBack={true} />

      <View style={styles.container}>
        <Text style={styles.title}>Comunidad</Text>
        <Text style={styles.subtitle}>
          Seccion en desarrollo. Pronto podrás acceder a la comunidad de emprendedores de LIWA.
          Conecta y colabora con otros emprendedores de la red LIWA.
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
