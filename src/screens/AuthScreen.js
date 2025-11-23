import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authStyles } from '../styles/authStyles';

export default function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Escribe tu correo y contraseña');
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        Alert.alert('Confirma tu contraseña', 'Escribe tu contraseña nuevamente');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Las contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    try {
      setLoadingAuth(true);
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Error',
        mode === 'login'
          ? 'No se pudo iniciar sesión'
          : 'No se pudo registrar'
      );
    } finally {
      setLoadingAuth(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <SafeAreaView style={authStyles.authContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={authStyles.authScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header spacer */}
          <View style={authStyles.topSpacer} />

          {/* Branding - Centrado arriba */}
          <View style={authStyles.brandingSection}>
            <View style={authStyles.logoContainer}>
              <Ionicons name="barbell-outline" size={48} color="#ffffff" />
            </View>
            <Text style={authStyles.appTitle}>CalistenIA</Text>
            <Text style={authStyles.appSubtitle}>Tu coach personal de calistenia</Text>
          </View>

          {/* Form - Más abajo */}
          <View style={authStyles.formSection}>
            <View style={authStyles.authCard}>
              <Text style={authStyles.formTitle}>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Text>

              {/* Email */}
              <View style={authStyles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#737373" style={authStyles.inputIcon} />
                <TextInput
                  style={authStyles.inputField}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#525252"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={authStyles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#737373" style={authStyles.inputIcon} />
                <TextInput
                  style={authStyles.inputField}
                  placeholder="Contraseña"
                  placeholderTextColor="#525252"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#737373" 
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password - Solo en registro */}
              {mode === 'register' && (
                <View style={authStyles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#737373" style={authStyles.inputIcon} />
                  <TextInput
                    style={authStyles.inputField}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor="#525252"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#737373" 
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Indicador de coincidencia */}
              {mode === 'register' && confirmPassword.length > 0 && (
                <View style={authStyles.passwordMatch}>
                  <Ionicons 
                    name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={password === confirmPassword ? "#22c55e" : "#dc2626"} 
                  />
                  <Text style={[
                    authStyles.passwordMatchText,
                    { color: password === confirmPassword ? "#22c55e" : "#dc2626" }
                  ]}>
                    {password === confirmPassword ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[authStyles.primaryButton, { marginTop: mode === 'register' ? 8 : 16 }]}
                onPress={handleSubmit}
                disabled={loadingAuth}
              >
                {loadingAuth ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={authStyles.primaryButtonText}>
                    {mode === 'login' ? 'Entrar' : 'Registrarme'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={authStyles.divider}>
                <View style={authStyles.dividerLine} />
                <Text style={authStyles.dividerText}>o</Text>
                <View style={authStyles.dividerLine} />
              </View>

              {/* Switch Mode */}
              <TouchableOpacity
                style={authStyles.secondaryButtonFull}
                onPress={switchMode}
              >
                <Text style={authStyles.secondaryButtonFullText}>
                  {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={authStyles.bottomSection}>
            <Text style={authStyles.footerText}>
              Entrena inteligente, progresa constante
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}