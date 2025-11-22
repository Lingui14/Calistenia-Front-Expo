// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import Screen from '../components/Screen';
import PrimaryButton from '../components/PrimaryButton';
import { login, register } from '../api/auth';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    try {
      setLoading(true);
      await register(email.trim(), password);
      Alert.alert('Listo', 'Usuario registrado y sesión iniciada');
      onLogin && onLogin();
    } catch (err) {
      console.log('REGISTER ERROR', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || 'No se pudo registrar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    try {
      setLoading(true);
      await login(email.trim(), password);
      Alert.alert('Bienvenido', 'Sesión iniciada correctamente');
      onLogin && onLogin();
    } catch (err) {
      console.log('LOGIN ERROR', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || 'No se pudo iniciar sesión';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>CalistenIA</Text>
      <Text style={styles.subtitle}>Inicia sesión o crea tu cuenta</Text>

      <View style={{ marginTop: 24 }}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#6B7280"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={{ marginTop: 24 }}>
        <PrimaryButton
          title="INICIAR SESIÓN"
          onPress={handleLogin}
          disabled={!email || !password || loading}
        />
        <PrimaryButton
          title="CREAR CUENTA"
          variant="secondary"
          onPress={handleRegister}
          disabled={!email || !password || loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
});
