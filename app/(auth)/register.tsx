import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signUp, checkProfileCompleted } from '@/lib/supabase';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';

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

      // If Supabase requires email confirmation, user is null until confirmed.
      if (!userId) {
        Alert.alert(
          'Registro exitoso',
          'Revisa tu correo para confirmar tu cuenta y luego inicia sesión.',
          [{ text: 'Ir al login', onPress: () => router.replace('/(auth)/login' as any) }],
        );
        return;
      }

      // Check profile_completed right after signup
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
    <KeyboardAvoidingView
      style={neumorphicStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="register-back-button"
        >
          <View style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </View>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrapper}>
          <View style={neumorphicStyles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
        </View>

        {/* Card */}
        <View style={[neumorphicStyles.card, styles.card]}>
          <Text style={neumorphicStyles.title}>Crear cuenta</Text>
          <Text style={neumorphicStyles.subtitle}>
            Solo necesitas tu correo y una contraseña
          </Text>

          <View style={styles.spacer} />

          {/* Email */}
          <Text style={neumorphicStyles.label}>Correo electrónico</Text>
          <View style={[neumorphicStyles.inputContainer, emailError ? styles.inputError : null]}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={neumorphicStyles.inputText}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={Colors.textPlaceholder}
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              testID="register-email-input"
            />
          </View>
          {emailError ? <Text style={neumorphicStyles.errorText}>{emailError}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Password */}
          <Text style={neumorphicStyles.label}>Contraseña</Text>
          <View style={[neumorphicStyles.inputContainer, passwordError ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={neumorphicStyles.inputText}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={Colors.textPlaceholder}
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              testID="register-password-input"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={neumorphicStyles.errorText}>{passwordError}</Text> : null}

          <View style={styles.fieldGap} />

          {/* Confirm password */}
          <Text style={neumorphicStyles.label}>Confirmar contraseña</Text>
          <View style={[neumorphicStyles.inputContainer, confirmError ? styles.inputError : null]}>
            <Ionicons name="lock-open-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={neumorphicStyles.inputText}
              placeholder="Repite tu contraseña"
              placeholderTextColor={Colors.textPlaceholder}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setConfirmError(''); }}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              testID="register-confirm-password-input"
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {confirmError ? <Text style={neumorphicStyles.errorText}>{confirmError}</Text> : null}

          <View style={styles.spacer} />

          {/* Register button */}
          <TouchableOpacity
            style={[neumorphicStyles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            testID="register-submit-button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={neumorphicStyles.buttonText}>Registrarme</Text>
            )}
          </TouchableOpacity>

          <View style={neumorphicStyles.divider} />

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login' as any)}
            testID="register-goto-login-button"
          >
            <Text style={styles.loginLink}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLinkBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  backBtn: {
    marginBottom: 16,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
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
  loginLink: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLinkBold: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
