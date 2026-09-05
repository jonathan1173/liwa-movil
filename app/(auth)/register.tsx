import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { MorphIcon } from 'morphicons/react-native';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide';
import AuthBackground from '@/components/AuthBackground';
import { Colors } from '@/constants/NeumorphicStyles';
import { checkProfileCompleted, signUp } from '@/lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  function validate() {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

    if (!email.trim()) {
      setEmailError('El correo es requerido');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un correo válido');
      valid = false;
    }

    if (!password) {
      setPasswordError('La contraseña es requerida');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Mínimo 8 caracteres');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Confirma tu contraseña');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Las contraseñas no coinciden');
      valid = false;
    }

    return valid;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signUp(email.trim().toLowerCase(), password);
      const userId = data.user?.id;

      if (!userId) {
        Alert.alert(
          'Registro exitoso',
          'Revisa tu correo para confirmar tu cuenta y luego inicia sesión.',
          [{ text: 'Ir al login', onPress: () => router.replace('/(auth)/login' as any) }],
        );
        return;
      }

      const completed = await checkProfileCompleted(userId);
      if (completed) {
        router.replace('/(tabs)/inicio' as any);
      } else {
        router.replace('/(auth)/complete-profile' as any);
      }
    } catch (err: any) {
      Alert.alert('Error al registrarse', err.message ?? 'Inténtalo de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backCircle}
              onPress={() => router.back()}
              activeOpacity={0.8}
              testID="register-back-button"
            >
              <MorphIcon icon={ArrowLeft} size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Top Branding */}
          <View style={styles.brandingContainer}>
            <Image
              source={require('../../assets/images/liwa_nombre.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.sloganText}>Tu mercado de confianza</Text>
          </View>

          {/* Floating White Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Solo necesitas tu correo y una contraseña
            </Text>

            {/* Email Field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
              <View
                style={[
                  styles.inputContainer,
                  emailError ? styles.inputError : null,
                ]}
              >
                <View style={styles.iconBox}>
                  <MorphIcon
                    icon={Mail}
                    size={19}
                    color={Colors.textSecondary}
                  />
                </View>
                <TextInput
                  style={styles.inputText}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  testID="register-email-input"
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordError ? styles.inputError : null,
                ]}
              >
                <View style={styles.iconBox}>
                  <MorphIcon
                    icon={Lock}
                    size={19}
                    color={Colors.textSecondary}
                  />
                </View>
                <TextInput
                  style={styles.inputText}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  testID="register-password-input"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <MorphIcon
                    icon={showPassword ? EyeOff : Eye}
                    size={19}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>CONFIRMAR CONTRASEÑA</Text>
              <View
                style={[
                  styles.inputContainer,
                  confirmError ? styles.inputError : null,
                ]}
              >
                <View style={styles.iconBox}>
                  <MorphIcon
                    icon={Lock}
                    size={19}
                    color={Colors.textSecondary}
                  />
                </View>
                <TextInput
                  style={styles.inputText}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    setConfirmError('');
                  }}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  testID="register-confirm-password-input"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <MorphIcon
                    icon={showConfirm ? EyeOff : Eye}
                    size={19}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmError ? (
                <Text style={styles.errorText}>{confirmError}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {/* Register Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.88}
                testID="register-submit-button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Registrarme</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login Button */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/(auth)/login' as any)}
                activeOpacity={0.85}
                testID="register-goto-login-button"
              >
                <Text style={styles.secondaryButtonText}>
                  ¿Ya tienes cuenta? Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  topNavRow: {
    marginBottom: 8,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 150,
    height: 64,
  },
  sloganText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 18,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: Colors.magenta,
    backgroundColor: '#FFF5F8',
  },
  iconBox: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: Colors.magenta,
    marginTop: 3,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 10,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.magenta,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.magenta,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.magenta,
  },
  secondaryButtonText: {
    color: Colors.magenta,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
