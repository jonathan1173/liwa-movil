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
import { signIn, checkProfileCompleted } from '@/lib/supabase';
import { Colors, neumorphicStyles } from '@/constants/NeumorphicStyles';

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
    <KeyboardAvoidingView
      style={neumorphicStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <View style={neumorphicStyles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.appName}>Liwa</Text>
          <Text style={neumorphicStyles.subtitle}>Tu mercado de confianza</Text>
        </View>

        {/* Card */}
        <View style={[neumorphicStyles.card, styles.card]}>
          <Text style={neumorphicStyles.title}>Bienvenido</Text>
          <Text style={neumorphicStyles.subtitle}>Inicia sesión para continuar</Text>

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
              testID="login-email-input"
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
              placeholder="••••••••"
              placeholderTextColor={Colors.textPlaceholder}
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              testID="login-password-input"
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

          <View style={styles.spacer} />

          {/* Login button */}
          <TouchableOpacity
            style={[neumorphicStyles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            testID="login-submit-button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={neumorphicStyles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <View style={neumorphicStyles.divider} />

          {/* Go to register */}
          <TouchableOpacity
            style={neumorphicStyles.buttonOutline}
            onPress={() => router.push('/(auth)/register' as any)}
            activeOpacity={0.85}
            testID="login-goto-register-button"
          >
            <Text style={neumorphicStyles.buttonOutlineText}>Crear cuenta nueva</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: 1,
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
});
