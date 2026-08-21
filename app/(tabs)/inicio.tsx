import AppHeader from '@/components/AppHeader';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function InicioScreen() {
  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      {/* Header unificado */}
      <AppHeader showNotif={true} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo principal */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>¡Hola!</Text>
          <Text style={styles.greetingSubtitle}>¿En qué podemos ayudarte?</Text>
        </View>

        {/* Lista / Grid de Menú con Tarjetas */}
        <View style={styles.menuContainer}>
          {/* Tarjeta 1: Explorar */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#E91E63' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/explorar' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="bag-handle-outline" size={42} color={Colors.white} />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Explorar</Text>
              <Text style={styles.cardSubtitle}>productos y servicios</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 2: Publicar */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#2B2B2B' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/publicar' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="add-circle-outline" size={42} color={Colors.white} />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Publicar</Text>
              <Text style={styles.cardSubtitle}>tu creación</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 3: Trueque */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#7CB342' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/trueque' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="swap-horizontal-outline" size={42} color={Colors.white} />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Trueque</Text>
              <Text style={styles.cardSubtitle}>intercambia productos</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 4: Capacitaciones */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#5E2B97' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/capacitaciones' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="book-outline" size={42} color={Colors.white} />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Capacitaciones</Text>
              <Text style={styles.cardSubtitle}>y recursos</Text>
            </View>
          </TouchableOpacity>

          {/* Tarjeta 5: Comunidad */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#2b5397' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/comunidad' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="people-outline" size={42} color={Colors.white} />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Comunidad</Text>
              <Text style={styles.cardSubtitle}>conecta y colabora</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3B1E54',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3B1E54',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  menuContainer: {
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardIconBox: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
  },
});
