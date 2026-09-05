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
import { Mail, Lock, Eye, EyeOff } from 'lucide';
import AuthBackground from '@/components/AuthBackground';
import { Colors } from '@/constants/NeumorphicStyles';
import { checkProfileCompleted, signIn } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  function validate() {
    let valid = true;
    setEmailError('');
    setPasswordError('');

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
    }

    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signIn(email.trim().toLowerCase(), password);
      const userId = data.user?.id;
      if (!userId) throw new Error('No se pudo obtener el usuario');

      const completed = await checkProfileCompleted(userId);
      if (completed) {
        router.replace('/(tabs)/inicio' as any);
      } else {
        router.replace('/(auth)/complete-profile' as any);
      }
    } catch (err: any) {
      Alert.alert('Error al iniciar sesión', err.message ?? 'Inténtalo de nuevo');
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
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

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
                  testID="login-email-input"
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
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  testID="login-password-input"
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

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {/* Login Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
                testID="login-submit-button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              {/* Create Account Button */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(auth)/register' as any)}
                activeOpacity={0.85}
                testID="login-goto-register-button"
              >
                <Text style={styles.secondaryButtonText}>Crear cuenta nueva</Text>
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
    paddingVertical: 36,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 170,
    height: 72,
  },
  sloganText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 28,
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
    marginBottom: 20,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
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
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
