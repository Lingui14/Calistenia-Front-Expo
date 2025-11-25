import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { rutinaStyles } from '../styles/rutinaStyles';

export default function RutinaScreen({
  activeRoutine,
  onGetActiveRoutine,
  onGenerateRoutine,
  onLogout,
  navigation,
}) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [localRoutine, setLocalRoutine] = useState(activeRoutine);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);

  useEffect(() => {
    setLocalRoutine(activeRoutine);
  }, [activeRoutine]);

  useEffect(() => {
    checkSpotifyStatus();
    loadSpotifyPlaylists();
  }, []);

  async function checkSpotifyStatus() {
    try {
      const res = await api.get('/api/spotify/status');
      setSpotifyConnected(res.data.connected);
    } catch (err) {
      setSpotifyConnected(false);
    }
  }

  async function loadSpotifyPlaylists() {
    try {
      const res = await api.get('/api/spotify/playlists?mood=intense');
      if (res.data.playlists?.length > 0) {
        setSpotifyPlaylists(res.data.playlists.slice(0, 4));
      }
    } catch (err) {
      console.log('Error cargando playlists');
      setSpotifyPlaylists([]);
    }
  }

 async function handleGenerateAI() {
  try {
    setLoadingAI(true);
    console.log('🚀 RutinaScreen: Llamando a /api/routines/generate-ai...');
    
    const res = await api.post('/api/routines/generate-ai', {});
    
    console.log('✅ Respuesta:', res.data);
    
    if (res.data.routine) {
      setLocalRoutine(res.data.routine);
      
      if (onGetActiveRoutine) {
        onGetActiveRoutine();
      }
      
      Alert.alert(
        'Rutina generada',
        `"${res.data.routine.name}" está lista. ¿Quieres comenzar ahora?`,
        [
          { text: 'Ver después', style: 'cancel' },
          {
            text: 'Empezar',
            onPress: () => {
              navigation.navigate('Training', {
                routine: res.data.routine,
              });
            }
          }
        ]
      );
    } else {
      throw new Error('No se recibió rutina en la respuesta');
    }
  } catch (err) {
    console.error('❌ Error generando rutina:', err);
    console.error('❌ Response data:', err.response?.data);
    console.error('❌ Status:', err.response?.status);
    
    const errorMessage = err.response?.data?.message 
      || err.response?.data?.error 
      || err.message 
      || 'Error desconocido';
    
    Alert.alert('Error', `No se pudo generar la rutina: ${errorMessage}`);
  } finally {
    setLoadingAI(false);
  }
}

  function handleStartTraining() {
    if (!localRoutine) {
      Alert.alert('Sin rutina', 'Primero genera una rutina para entrenar');
      return;
    }
    navigation.navigate('Training', { routine: localRoutine });
  }

  return (
    <SafeAreaView style={rutinaStyles.screenContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <View>
            <Text style={rutinaStyles.screenTitle}>Rutina de hoy</Text>
            <Text style={rutinaStyles.screenSubtitle}>
              {new Date().toLocaleDateString('es-MX', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={onLogout}>
            <Text style={{ color: '#666666', fontSize: 14, fontWeight: '600' }}>
              Salir
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón de Spotify si NO está conectado */}
        {!spotifyConnected && (
          <TouchableOpacity
            style={{
              backgroundColor: '#ffffff',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => navigation.navigate('SpotifyAuth')}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: '#000000', 
                fontSize: 14, 
                fontWeight: '700',
                marginBottom: 2,
              }}>
                Conectar Spotify
              </Text>
              <Text style={{ color: '#666666', fontSize: 12, fontWeight: '600' }}>
                Obtén playlists personalizadas
              </Text>
            </View>
            <Text style={{ color: '#000000', fontSize: 18, fontWeight: '600' }}>→</Text>
          </TouchableOpacity>
        )}

        {/* Playlists de Spotify */}
        {spotifyPlaylists.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              color: '#a3a3a3', 
              marginBottom: 12,
              fontWeight: '600' 
            }}>
              Música para entrenar
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {spotifyPlaylists.map((playlist, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: 18,
                    borderRadius: 16,
                    width: 200,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                  onPress={() => Linking.openURL(playlist.external_url)}
                  activeOpacity={0.85}
                >
                  <View style={{
                    backgroundColor: '#f5f5f5',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontSize: 20 }}>▶</Text>
                  </View>
                  <Text style={{ 
                    color: '#000000', 
                    fontSize: 15, 
                    fontWeight: '700', 
                    marginBottom: 4,
                    lineHeight: 20,
                  }} numberOfLines={2}>
                    {playlist.name}
                  </Text>
                  <Text style={{ 
                    color: '#888888', 
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {playlist.tracks_total} canciones
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Rutina activa */}
        {localRoutine ? (
          <View style={rutinaStyles.routineCard}>
            <View style={{ marginBottom: 12 }}>
              <Text style={rutinaStyles.routineTitle}>{localRoutine.name}</Text>
              {localRoutine.description ? (
                <Text style={rutinaStyles.routineDescription}>
                  {localRoutine.description}
                </Text>
              ) : null}
              
              {/* Badges */}
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                <View style={{
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                }}>
                  <Text style={{ 
                    fontSize: 11, 
                    color: '#000000', 
                    fontWeight: '700' 
                  }}>
                    {localRoutine.difficulty_level}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: '#171717',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                }}>
                  <Text style={{ 
                    fontSize: 11, 
                    color: '#a3a3a3', 
                    fontWeight: '600' 
                  }}>
                    {localRoutine.Exercises?.length || 0} ejercicios
                  </Text>
                </View>
              </View>
            </View>

            {/* Lista de ejercicios */}
            <View style={{ 
              backgroundColor: '#171717', 
              borderRadius: 12, 
              padding: 12,
              marginBottom: 16 
            }}>
              {localRoutine.Exercises?.slice(0, 6).map((ex, idx) => (
                <View
                  key={ex.id}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 10,
                    borderBottomWidth: idx < (localRoutine.Exercises.length - 1) && idx < 5 ? 1 : 0,
                    borderBottomColor: '#262626',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ 
                    color: '#737373', 
                    width: 30,
                    fontSize: 14,
                    fontWeight: '600' 
                  }}>
                    {idx + 1}.
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      color: '#ffffff', 
                      fontSize: 15, 
                      fontWeight: '600',
                      marginBottom: 2 
                    }}>
                      {ex.name}
                    </Text>
                    <Text style={{ color: '#737373', fontSize: 13 }}>
                      {ex.exercise_type === 'amrap'
                      ? `AMRAP ${Math.floor(ex.amrap_duration / 60)} min`
                      : ex.exercise_type === 'hiit'
                      ? `HIIT ${ex.hiit_work_time}s/${ex.hiit_rest_time}s × ${ex.hiit_rounds}`
                      : ex.exercise_type === 'emom'
                      ? `EMOM ${Math.floor(ex.emom_duration / 60)} min`
                      : `${ex.sets || 3} × ${ex.reps || 10} reps`}
                  </Text>
                  {ex.description ? (
                    <Text style={{ color: '#525252', fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      {ex.description}
                    </Text>
                  ) : null}
                </View>
                </View>
              ))}
              {localRoutine.Exercises?.length > 6 && (
                <Text style={{ 
                  color: '#737373', 
                  fontSize: 12, 
                  textAlign: 'center',
                  marginTop: 8 
                }}>
                  +{localRoutine.Exercises.length - 6} ejercicios más
                </Text>
              )}
            </View>

            {/* Botón comenzar - BLANCO */}
            <TouchableOpacity
              style={{
                backgroundColor: '#ffffff',
                paddingVertical: 16,
                borderRadius: 999,
                alignItems: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
              onPress={handleStartTraining}
            >
              <Text style={{ 
                color: '#000000', 
                fontSize: 16, 
                fontWeight: '700' 
              }}>
                Comenzar entrenamiento
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ 
            alignItems: 'center', 
            paddingVertical: 60,
            backgroundColor: '#0a0a0a',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#262626',
          }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}></Text>
            <Text style={{ 
              fontSize: 18, 
              color: '#ffffff', 
              fontWeight: '700', 
              marginBottom: 16 
            }}>
              Sin rutina activa
            </Text>
            
            {/* Botón generar rutina - BLANCO */}
            <TouchableOpacity
              style={{
                backgroundColor: '#ffffff',
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 999,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
              }}
              onPress={handleGenerateAI}
              disabled={loadingAI}
            >
              {loadingAI ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={{ 
                  color: '#000000', 
                  fontSize: 15, 
                  fontWeight: '700' 
                }}>
                  Generar rutina con IA
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}