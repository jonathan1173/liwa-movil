import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import { signOut, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserProfile {
  full_name: string | null;
  username: string | null;
  email: string;
  phone: string | null;
}

export default function PerfilScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profile')
          .select('full_name, username, email, phone')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch {
        // silent — profile might not exist yet
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(tabs)/inicio' as any);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, []),
  );

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login' as any);
          } catch {
            // ignore
          }
        },
      },
    ]);
  }

  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : '?';

  return (
    <SafeAreaView style={neumorphicStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[neumorphicStyles.title, styles.pageTitle]}>Perfil</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.accent}
            style={{ marginTop: 48 }}
          />
        ) : (
          <>
            {/* Avatar + name */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.fullName}>
                {profile?.full_name ?? 'Sin nombre'}
              </Text>
              {profile?.username ? (
                <Text style={styles.username}>@{profile.username}</Text>
              ) : null}
            </View>

            {/* Info card */}
            <View style={[neumorphicStyles.card, styles.infoCard]}>
              <Text style={[neumorphicStyles.label, { marginBottom: 16 }]}>
                Información
              </Text>

              {/* Email row */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textPrimary} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Correo</Text>
                  <Text style={styles.infoValue}>{profile?.email ?? '—'}</Text>
                </View>
              </View>

              <View style={styles.separator} />

              {/* Phone row */}
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="call-outline" size={18} color={Colors.textPrimary} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{profile?.phone ?? '—'}</Text>
                </View>
              </View>
            </View>

            {/* Quick actions card */}
            <View style={[neumorphicStyles.card, styles.actionsCard]}>
              <Text style={[neumorphicStyles.label, { marginBottom: 16 }]}>
                Acciones rápidas
              </Text>
              <View style={styles.actionsRow}>
                {[
                  {
                    icon: 'add-circle-outline',
                    label: 'Publicar',
                    color: "#0000FF",
                    onPress: () => router.push('/(tabs)/publicar' as any),
                  },
                  {
                    icon: 'heart-outline',
                    color: "#FF0000",
                    label: 'Favoritos',
                    onPress: () => router.push('/favoritos' as any),
                  },
                  {
                    icon: 'storefront-outline',
                    label: 'Mis ventas',
                    color: "#00AA00",
                    onPress: () => router.push('/mis-publicaciones' as any),
                  },
                  {
                    icon: 'settings-outline',
                    label: 'Ajustes',
                    onPress: () => { },
                  },
                ].map(({ icon, label, onPress, color }) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.actionItem}
                    onPress={onPress}
                    activeOpacity={0.8}
                  >
                    <View style={[neumorphicStyles.card, styles.actionCard]}>
                      <Ionicons name={icon as any} size={24} color={color ?? Colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>


            {/* Sign out */}
            <TouchableOpacity
              style={[neumorphicStyles.buttonOutline, styles.signOutBtn]}
              onPress={handleSignOut}
              activeOpacity={0.85}
              testID="perfil-signout-button"
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={Colors.accent}
                style={{ marginRight: 8 }}
              />
              <Text style={neumorphicStyles.buttonOutlineText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  pageTitle: {
    marginBottom: 24,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 14,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  fullName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  username: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  // Info card
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.shadowDark,
    opacity: 0.2,
    marginVertical: 14,
  },
  // Actions
  actionsCard: {
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionCard: {
    width: 58,
    height: 58,
    borderRadius: 18,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
