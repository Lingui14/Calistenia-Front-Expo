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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from '../api/client';

WebBrowser.maybeCompleteAuthSession();

export default function SpotifyAuthScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [processingCode, setProcessingCode] = useState(false);

  useEffect(() => {
    checkSpotifyStatus();
    
    // Listener para deep link
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Verificar si la app se abrió con un deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('spotify-callback')) {
        handleDeepLink({ url });
      }
    });
    
    return () => subscription.remove();
  }, []);

  async function checkSpotifyStatus() {
    try {
      setChecking(true);
      const res = await api.get('/api/spotify/status');
      setConnected(res.data.connected);
    } catch (err) {
      console.log('Error checking Spotify status:', err);
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }

  async function handleDeepLink(event) {
    const { url } = event;
    console.log('Deep link recibido:', url);
    
    if (url && url.includes('spotify-callback')) {
      // Extraer el código de la URL
      let code = null;
      
      // Intentar diferentes formatos de URL
      if (url.includes('code=')) {
        code = url.split('code=')[1]?.split('&')[0]?.split('#')[0];
      }
      
      if (code) {
        console.log('Código de Spotify recibido');
        await handleSpotifyCallback(code);
      } else {
        // Verificar si hay error
        const error = url.split('error=')[1]?.split('&')[0];
        if (error) {
          Alert.alert('Error', 'No se pudo autorizar Spotify: ' + decodeURIComponent(error));
        }
      }
    }
  }

  async function handleConnectSpotify() {
    try {
      setLoading(true);
      
      // Obtener URL de autorización
      const res = await api.get('/api/spotify/auth-url');
      const authUrl = res.data.url;
      
      if (!authUrl) {
        throw new Error('No se pudo obtener URL de autorización');
      }
      
      console.log('Abriendo Spotify OAuth...');
      
      // Abrir navegador para OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'calistenia://spotify-callback'
      );
      
      console.log('Resultado WebBrowser:', result.type);
      
      if (result.type === 'success' && result.url) {
        let code = null;
        
        if (result.url.includes('code=')) {
          code = result.url.split('code=')[1]?.split('&')[0]?.split('#')[0];
        }
        
        if (code) {
          await handleSpotifyCallback(code);
        } else {
          console.log('No se encontró código en URL:', result.url);
        }
      } else if (result.type === 'cancel') {
        console.log('Usuario canceló la autorización');
      }
    } catch (err) {
      console.error('Error conectando Spotify:', err);
      Alert.alert('Error', 'No se pudo conectar con Spotify. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }

 async function handleSpotifyCallback(code) {
    // Evitar doble envío
    if (processingCode) {
      console.log('Ya se está procesando un código, ignorando...');
      return;
    }
    
    try {
      setProcessingCode(true); // NUEVO
      setLoading(true);
      console.log('Enviando código al backend...');
      
      const res = await api.post('/api/spotify/callback', { code });
      
      if (res.data.success) {
        setConnected(true);
        Alert.alert(
          'Conectado',
          'Spotify conectado exitosamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error en callback:', err);
      // Solo mostrar error si no es por código ya usado
      if (!err.message?.includes('invalid_grant')) {
        Alert.alert('Error', 'No se pudo completar la conexión con Spotify');
      }
    } finally {
      setLoading(false);
      // No resetear processingCode para evitar reintentos
    }
  }

  async function handleDisconnect() {
    Alert.alert(
      'Desconectar Spotify',
      '¿Estás seguro de que quieres desconectar Spotify?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/api/spotify/disconnect');
              setConnected(false);
            } catch (err) {
              console.error('Error desconectando:', err);
              Alert.alert('Error', 'No se pudo desconectar');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Spotify</Text>
        <Text style={styles.subtitle}>
          Musica personalizada para entrenar
        </Text>

        {connected ? (
          <View style={styles.connectedCard}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>OK</Text>
            </View>
            <Text style={styles.connectedText}>Conectado</Text>
            <Text style={styles.connectedSubtext}>
              Tus playlists estan sincronizadas
            </Text>
            
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#888888" />
              ) : (
                <Text style={styles.disconnectText}>Desconectar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitItem}>Playlists segun tu mood</Text>
              <Text style={styles.benefitItem}>Musica para HIIT, fuerza, cardio</Text>
              <Text style={styles.benefitItem}>Recomendaciones personalizadas</Text>
            </View>

            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnectSpotify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.connectText}>Conectar con Spotify</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 16,
  },
  backText: {
    color: '#888888',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 40,
  },
  connectedCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkMark: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '700',
  },
  connectedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  connectedSubtext: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
  },
  disconnectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  disconnectText: {
    color: '#888888',
    fontSize: 14,
  },
  benefitsCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#262626',
  },
  benefitItem: {
    fontSize: 15,
    color: '#cccccc',
    marginBottom: 12,
    paddingLeft: 8,
  },
  connectButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  connectText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
