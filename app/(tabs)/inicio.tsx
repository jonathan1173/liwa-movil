import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';

export default function InicioScreen() {
  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Hola 👋</Text>
            <Text style={[neumorphicStyles.subtitle, { marginTop: 2 }]}>
              Bienvenido a Liwa
            </Text>
          </View>
          {/* Logo circle */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={[neumorphicStyles.inputContainer, styles.searchBar]}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          <Text style={[neumorphicStyles.inputText, { color: Colors.textPlaceholder }]}>
            Buscar productos…
          </Text>
        </View>

        {/* Productos recientes */}
        <Text style={[neumorphicStyles.label, { marginTop: 28, marginBottom: 12 }]}>
          Productos recientes
        </Text>
        <View style={[neumorphicStyles.card, styles.emptyCard]}>
          <Ionicons name="cube-outline" size={40} color={Colors.textSecondary} />
          <Text style={[neumorphicStyles.subtitle, { textAlign: 'center', marginTop: 8 }]}>
            Aún no hay productos.{'\n'}¡Sé el primero en publicar!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  searchBar: {
    marginBottom: 8,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
  },
});
