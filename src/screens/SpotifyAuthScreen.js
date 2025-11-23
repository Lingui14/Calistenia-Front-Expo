// src/screens/SpotifyAuthScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import api from '../api/client';

WebBrowser.maybeCompleteAuthSession();

export default function SpotifyAuthScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    checkSpotifyStatus();
    
    // Listener para deep link
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => subscription.remove();
  }, []);

  async function checkSpotifyStatus() {
    try {
      const res = await api.get('/api/spotify/status');
      setConnected(res.data.connected);
    } catch (err) {
      console.log('Error checking Spotify status');
    }
  }

  async function handleDeepLink(event) {
    const { url } = event;
    
    if (url.includes('spotify-callback')) {
      const code = url.split('code=')[1]?.split('&')[0];
      
      if (code) {
        await handleSpotifyCallback(code);
      }
    }
  }

  async function handleConnectSpotify() {
    try {
      setLoading(true);
      
      // Obtener URL de autorización
      const res = await api.get('/api/spotify/auth-url');
      const authUrl = res.data.url;
      
      // Abrir navegador para OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'calistenia://spotify-callback'
      );
      
      if (result.type === 'success' && result.url) {
        const code = result.url.split('code=')[1]?.split('&')[0];
        if (code) {
          await handleSpotifyCallback(code);
        }
      }
    } catch (err) {
      console.error('Error conectando Spotify:', err);
      Alert.alert('Error', 'No se pudo conectar con Spotify');
    } finally {
      setLoading(false);
    }
  }

  async function handleSpotifyCallback(code) {
    try {
      await api.post('/api/spotify/callback', { code });
      setConnected(true);
      Alert.alert(
        'Conectado',
        'Spotify conectado exitosamente. Ahora tendrás playlists personalizadas.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error en callback:', err);
      Alert.alert('Error', 'No se pudo completar la conexión');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Conectar Spotify</Text>
        <Text style={styles.subtitle}>
          Obtén playlists personalizadas para tus entrenamientos
        </Text>

        {connected ? (
          <View style={styles.connectedCard}>
            <Text style={styles.connectedText}>✓ Spotify conectado</Text>
            <Text style={styles.connectedSubtext}>
              Tus playlists están sincronizadas
            </Text>
          </View>
        ) : (
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Beneficios:</Text>
            <Text style={styles.benefitItem}>• Playlists personalizadas</Text>
            <Text style={styles.benefitItem}>• Música según tu mood</Text>
            <Text style={styles.benefitItem}>• Recomendaciones durante entrenamientos</Text>
          </View>
        )}

        {!connected && (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectSpotify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.connectButtonText}>Conectar con Spotify</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 40,
  },
  connectedCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  connectedSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  benefitsCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  benefitItem: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  connectButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
});