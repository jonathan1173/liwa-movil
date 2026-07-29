import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';
import {
  getCities,
  getEthnicities,
  getGenders,
  supabase,
  updateProfile,
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Option {
  id: number;
  name: string;
}

interface PickerFieldProps {
  label: string;
  value: Option | null;
  options: Option[];
  onSelect: (item: Option) => void;
  placeholder?: string;
  testID?: string;
}

function PickerField({ label, value, options, onSelect, placeholder = 'Selecciona...', testID }: PickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Text style={neumorphicStyles.label}>{label}</Text>
      <TouchableOpacity
        style={neumorphicStyles.inputContainer}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        testID={testID}
      >
        <Ionicons name="chevron-down-outline" size={20} color={Colors.textSecondary} />
        <Text
          style={[
            neumorphicStyles.inputText,
            !value && { color: Colors.textPlaceholder },
          ]}
        >
          {value ? value.name : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    value?.id === item.id && styles.optionRowSelected,
                  ]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value?.id === item.id && styles.optionTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {value?.id === item.id && (
                    <Ionicons name="checkmark" size={18} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CompleteProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState<Option | null>(null);
  const [gender, setGender] = useState<Option | null>(null);
  const [ethnicity, setEthnicity] = useState<Option | null>(null);

  const [cities, setCities] = useState<Option[]>([]);
  const [genders, setGenders] = useState<Option[]>([]);
  const [ethnicities, setEthnicities] = useState<Option[]>([]);

  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [c, g, e] = await Promise.all([getCities(), getGenders(), getEthnicities()]);
        setCities(c);
        setGenders(g);
        setEthnicities(e);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los catálogos. Inténtalo de nuevo.');
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadCatalogs();
  }, []);

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'El nombre completo es requerido';
    if (!username.trim()) newErrors.username = 'El nombre de usuario es requerido';
    else if (username.includes(' ')) newErrors.username = 'Sin espacios';
    if (!phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!city) newErrors.city = 'Selecciona una ciudad';
    if (!gender) newErrors.gender = 'Selecciona un género';
    if (!ethnicity) newErrors.ethnicity = 'Selecciona una etnicidad';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      await updateProfile(user.id, {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        city_id: city!.id,
        gender_id: gender!.id,
        ethnicity_id: ethnicity!.id,
        profile_completed: true,
      });

      router.replace('/(tabs)/inicio' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo guardar el perfil');
    } finally {
      setLoading(false);
    }
  }

  if (loadingCatalogs) {
    return (
      <View style={[neumorphicStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={[neumorphicStyles.subtitle, { marginTop: 16 }]}>Cargando catálogos…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={neumorphicStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[neumorphicStyles.logoCircle, styles.smallLogo]}>
            <Ionicons name="person-outline" size={24} color={Colors.white} />
          </View>
          <Text style={[neumorphicStyles.title, { textAlign: 'center', marginTop: 12 }]}>
            Completa tu perfil
          </Text>
          <Text style={[neumorphicStyles.subtitle, { textAlign: 'center' }]}>
            Para continuar necesitamos algunos datos sobre ti
          </Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={[styles.progressDot, step === 1 && styles.progressDotActive]} />
          ))}
        </View>

        {/* Card */}
        <View style={[neumorphicStyles.card, styles.card]}>

          {/* Full name */}
          <Text style={neumorphicStyles.label}>Nombre completo</Text>
          <View style={[neumorphicStyles.inputContainer, errors.fullName ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={neumorphicStyles.inputText}
              placeholder="Usuario"
              placeholderTextColor={Colors.textPlaceholder}
              value={fullName}
              onChangeText={(t) => { setFullName(t); setErrors((e) => ({ ...e, fullName: '' })); }}
              autoCapitalize="words"
              returnKeyType="next"
              testID="profile-fullname-input"
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
              placeholder="Username"
              placeholderTextColor={Colors.textPlaceholder}
              value={username}
              onChangeText={(t) => { setUsername(t.toLowerCase()); setErrors((e) => ({ ...e, username: '' })); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              testID="profile-username-input"
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
              placeholder="Ej: 0000-0000"
              placeholderTextColor={Colors.textPlaceholder}
              value={phone}
              onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: '' })); }}
              keyboardType="phone-pad"
              returnKeyType="next"
              testID="profile-phone-input"
            />
          </View>
          {errors.phone ? <Text style={neumorphicStyles.errorText}>{errors.phone}</Text> : null}

          <View style={styles.fieldGap} />

          {/* City */}
          <PickerField
            label="Ciudad"
            value={city}
            options={cities}
            onSelect={(item) => { setCity(item); setErrors((e) => ({ ...e, city: '' })); }}
            placeholder="Selecciona tu ciudad"
            testID="profile-city-picker"
          />
          {errors.city ? <Text style={neumorphicStyles.errorText}>{errors.city}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Gender */}
          <PickerField
            label="Género"
            value={gender}
            options={genders}
            onSelect={(item) => { setGender(item); setErrors((e) => ({ ...e, gender: '' })); }}
            placeholder="Selecciona tu género"
            testID="profile-gender-picker"
          />
          {errors.gender ? <Text style={neumorphicStyles.errorText}>{errors.gender}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Ethnicity */}
          <PickerField
            label="Etnicidad"
            value={ethnicity}
            options={ethnicities}
            onSelect={(item) => { setEthnicity(item); setErrors((e) => ({ ...e, ethnicity: '' })); }}
            placeholder="Selecciona tu etnicidad"
            testID="profile-ethnicity-picker"
          />
          {errors.ethnicity ? <Text style={neumorphicStyles.errorText}>{errors.ethnicity}</Text> : null}

          <View style={styles.spacer} />

          {/* Save button */}
          <TouchableOpacity
            style={[neumorphicStyles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            testID="profile-save-button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={neumorphicStyles.buttonText}>Guardar y continuar</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  smallLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.shadowDark,
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  card: {
    marginHorizontal: 0,
  },
  fieldGap: {
    height: 16,
  },
  spacer: {
    height: 24,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.shadowDark,
    opacity: 0.2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(26,26,46,0.06)',
    borderRadius: 10,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  optionTextSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
