import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InicioScreen() {
  const [initials, setInitials] = useState('JD');

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profile')
          .select('full_name, username')
          .eq('id', user.id)
          .single();

        if (data?.full_name?.trim()) {
          const parts = data.full_name.trim().split(/\s+/);
          if (parts.length >= 2) {
            setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
          } else if (parts[0].length > 0) {
            setInitials(parts[0].slice(0, 2).toUpperCase());
          }
        } else if (data?.username?.trim()) {
          setInitials(data.username.trim().slice(0, 2).toUpperCase());
        }
      } catch {
        // En caso de error o sin sesión activa se mantiene 'JD' de la maqueta
      }
    }
    loadUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera superior: Logo Liwa + Campana Notificaciones + Avatar JD */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/liwa_nombre.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerActions}>
            {/* Botón de Notificaciones con punto indicador rosa */}
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.75}
              onPress={() => router.push('/(tabs)/notificaciones' as any)}
            >
              <Ionicons name="notifications-outline" size={20} color="#4B5563" />
              {/* <View style={styles.bellBadge} /> */}
            </TouchableOpacity>

            {/* Avatar circular de perfil con iniciales */}
            <TouchableOpacity
              style={styles.avatarButton}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/perfil' as any)}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saludo principal */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>¡Hola!</Text>
          <Text style={styles.greetingSubtitle}>¿En qué podemos ayudarte hoy?</Text>
        </View>

        {/* Barra de Búsqueda */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/explorar' as any)}
        >
          <Ionicons name="search-outline" size={19} color="#9CA3AF" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Buscar productos, servicios o personas...</Text>
        </TouchableOpacity>

        {/* Tarjetas de Navegación Vertical */}
        <View style={styles.cardsContainer}>
          {/* 1. Explorar */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#D80064' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/explorar' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="bag-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Explorar</Text>
              <Text style={styles.cardSubtitle}>productos y servicios</Text>
            </View>
            <View style={styles.cardArrowBox}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* 2. Publicar */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#212529' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/publicar' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Publicar</Text>
              <Text style={styles.cardSubtitle}>tu creación</Text>
            </View>
            <View style={styles.cardArrowBox}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* 3. Trueque */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#72A619' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/trueque' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="swap-vertical" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Trueque</Text>
              <Text style={styles.cardSubtitle}>intercambia productos</Text>
            </View>
            <View style={styles.cardArrowBox}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* 4. Mapa */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#C89211' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/mapa-vendedores' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="map-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Mapa</Text>
              <Text style={styles.cardSubtitle}>ubica a los vendedores</Text>
            </View>
            <View style={styles.cardArrowBox}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* 5. Comunidad */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#4B187B' }]}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/comunidad' as any)}
          >
            <View style={styles.cardIconBox}>
              <Ionicons name="people-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Comunidad</Text>
              <Text style={styles.cardSubtitle}>conecta y colabora</Text>
            </View>
            <View style={styles.cardArrowBox}>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoImage: {
    width: 100,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E60067',
    marginRight: 8,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F2',
  },
  bellBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E60067',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#80005C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  greetingSection: {
    marginTop: 18,
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#261353',
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: '#9CA3AF',
  },
  cardsContainer: {
    gap: 14,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextBox: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
  },
  cardArrowBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
