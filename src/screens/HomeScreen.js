// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import Screen from '../components/Screen';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import { generateRoutine, getActiveRoutine } from '../api/routines';
import { logout } from '../api/auth';

export default function HomeScreen({ onLogout }) {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  function print(obj) {
    setOutput(obj);
  }

  async function handleGetRoutine() {
    try {
      setLoading(true);
      const data = await getActiveRoutine();
      print(data);
    } catch (err) {
      console.log('GET ROUTINE ERROR', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || 'No se pudo obtener la rutina';
      Alert.alert('Error', msg);
      print({ error: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateRoutine() {
    try {
      setLoading(true);
      const data = await generateRoutine();
      print(data);
    } catch (err) {
      console.log('GEN ROUTINE ERROR', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || 'No se pudo generar la rutina';
      Alert.alert('Error', msg);
      print({ error: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoutPress() {
    await logout();
    onLogout && onLogout();
  }

  return (
    <Screen>
      <Text style={styles.title}>CalistenIA (MVP)</Text>

      <Card title="Sesión">
        <Text style={styles.sessionText}>Estás logueado ✅</Text>
        <PrimaryButton
          title="CERRAR SESIÓN"
          variant="danger"
          onPress={handleLogoutPress}
          disabled={loading}
        />
      </Card>

      <Card title="Rutina">
        <PrimaryButton
          title="GET ACTIVE ROUTINE"
          onPress={handleGetRoutine}
          disabled={loading}
        />
        <PrimaryButton
          title="GENERATE ROUTINE"
          onPress={handleGenerateRoutine}
          disabled={loading}
        />
      </Card>

      <Card title="Debug / Output">
        <ScrollView style={{ maxHeight: 260 }}>
          <Text style={styles.outputText}>
            {output ? JSON.stringify(output, null, 2) : 'Sin datos aún'}
          </Text>
        </ScrollView>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sessionText: {
    color: '#E5E7EB',
    marginBottom: 8,
  },
  outputText: {
    color: '#D1D5DB',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
