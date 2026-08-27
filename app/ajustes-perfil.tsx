import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import LocationPickerModal from '@/components/LocationPickerModal';
import AppHeader from '@/components/AppHeader';

export default function AjustesPerfilScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCurrentProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profile')
          .select('full_name, username, phone, latitude, longitude')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setFullName(data.full_name ?? '');
          setUsername(data.username ?? '');
          setPhone(data.phone ? data.phone.replace(/[^0-9]/g, '').slice(0, 8) : '');
          setLatitude(data.latitude ?? null);
          setLongitude(data.longitude ?? null);
        }
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar la información del perfil.');
      } finally {
        setLoading(false);
      }
    }
    loadCurrentProfile();
  }, []);

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'El nombre completo es requerido';
    if (!username.trim()) newErrors.username = 'El nombre de usuario es requerido';
    else if (username.includes(' ')) newErrors.username = 'Sin espacios';
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{8}$/.test(phone.trim())) {
      newErrors.phone = 'El teléfono debe tener exactamente 8 dígitos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('profile')
        .update({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          phone: phone.trim(),
          latitude: latitude,
          longitude: longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Perfil actualizado correctamente.', [
        { text: 'Aceptar', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[neumorphicStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={[neumorphicStyles.subtitle, { marginTop: 16 }]}>Cargando datos…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={neumorphicStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader title="Ajustes de Perfil" showBack={true} showNotif={false} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[neumorphicStyles.card, styles.card]}>
          <Text style={neumorphicStyles.title}>Editar Datos</Text>
          <Text style={neumorphicStyles.subtitle}>
            Actualiza la información de tu cuenta y ubicación del local
          </Text>

          <View style={styles.spacer} />

          {/* Full Name */}
          <Text style={neumorphicStyles.label}>Nombre completo</Text>
          <View style={[neumorphicStyles.inputContainer, errors.fullName ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={neumorphicStyles.inputText}
              value={fullName}
              onChangeText={(t) => { setFullName(t); setErrors((e) => ({ ...e, fullName: '' })); }}
              autoCapitalize="words"
            />
          </View>
          {errors.fullName ? <Text style={neumorphicStyles.errorText}>{errors.fullName}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Username */}
          <Text style={neumorphicStyles.label}>Nombre de usuario</Text>
          <View style={[neumorphicStyles.inputContainer, errors.username ? styles.inputError : null]}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={neumorphicStyles.inputText}
              value={username}
              onChangeText={(t) => { setUsername(t.toLowerCase()); setErrors((e) => ({ ...e, username: '' })); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.username ? <Text style={neumorphicStyles.errorText}>{errors.username}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Phone */}
          <Text style={neumorphicStyles.label}>Teléfono</Text>
          <View style={[neumorphicStyles.inputContainer, errors.phone ? styles.inputError : null]}>
            <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={neumorphicStyles.inputText}
              placeholder="Ej: 88888888"
              placeholderTextColor={Colors.textPlaceholder}
              value={phone}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9]/g, '').slice(0, 8);
                setPhone(cleaned);
                setErrors((e) => ({ ...e, phone: '' }));
              }}
              keyboardType="number-pad"
              maxLength={8}
            />
          </View>
          {errors.phone ? <Text style={neumorphicStyles.errorText}>{errors.phone}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Location Picker */}
          <Text style={neumorphicStyles.label}>Ubicación del local</Text>
          <TouchableOpacity
            style={neumorphicStyles.inputContainer}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={latitude !== null && longitude !== null ? "location" : "location-outline"}
              size={20}
              color={latitude !== null && longitude !== null ? Colors.accent : Colors.textSecondary}
            />
            <Text
              style={[
                neumorphicStyles.inputText,
                (latitude === null || longitude === null) && { color: Colors.textPlaceholder },
              ]}
            >
              {latitude !== null && longitude !== null
                ? `Ubicación: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : 'Modificar ubicación del local...'}
            </Text>
            <Ionicons name="chevron-forward-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <LocationPickerModal
            visible={showLocationModal}
            initialLatitude={latitude}
            initialLongitude={longitude}
            onClose={() => setShowLocationModal(false)}
            onSelectLocation={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />

          <View style={styles.spacer} />

          {/* Save button */}
          <TouchableOpacity
            style={[neumorphicStyles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={neumorphicStyles.buttonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  card: {
    marginHorizontal: 0,
  },
  spacer: {
    height: 20,
  },
  fieldGap: {
    height: 16,
  },
  inputError: {
    borderColor: Colors.shadowDark,
    borderWidth: 1.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  atSign: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 2,
  },
});
