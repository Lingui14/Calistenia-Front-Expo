// src/api/spotify.js (NUEVO)
import api from './client';
import { Linking } from 'react-native';

/**
 * Verifica si Spotify está conectado
 */
export async function getSpotifyStatus() {
  const res = await api.get('/api/spotify/status');
  return res.data;
}

/**
 * Inicia el flujo de autenticación de Spotify
 */
export async function connectSpotify() {
  const res = await api.get('/api/spotify/auth-url');
  const { url } = res.data;
  
  // Abrir URL en navegador
  await Linking.openURL(url);
  
  return { success: true };
}

/**
 * Completa la autenticación (llamar después del redirect)
 */
export async function completeSpotifyAuth(code) {
  const res = await api.post('/api/spotify/callback', { code });
  return res.data;
}

/**
 * Obtiene playlists recomendadas según el mood
 */
export async function getSpotifyPlaylists(mood = 'energetic') {
  const res = await api.get(`/api/spotify/playlists?mood=${mood}`);
  return res.data;
}