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
  TextInput,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { rutinaStyles } from '../styles/rutinaStyles';

const QUICK_MOODS = [
  { key: 'intense', label: '🔥 Intenso', query: 'música intensa para entrenar pesado' },
  { key: 'energetic', label: '⚡ Energético', query: 'música energética y motivadora' },
  { key: 'focused', label: '🎯 Enfocado', query: 'música electrónica para concentrarse' },
  { key: 'calm', label: '🧘 Calmado', query: 'música tranquila para estiramientos' },
];

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
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  
  // Estados para el chat de música
  const [musicQuery, setMusicQuery] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [showMusicInput, setShowMusicInput] = useState(false);
  
  // Estados para tracks generados
  const [generatedTracks, setGeneratedTracks] = useState([]);
  const [trackUris, setTrackUris] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);

  useEffect(() => {
    setLocalRoutine(activeRoutine);
  }, [activeRoutine]);

  useEffect(() => {
    checkSpotifyStatus();
  }, []);

  async function checkSpotifyStatus() {
    try {
      const res = await api.get('/api/spotify/status');
      setSpotifyConnected(res.data.connected);
    } catch (err) {
      setSpotifyConnected(false);
    }
  }

  async function handleMusicSearch(query) {
    const searchQuery = query || musicQuery.trim();
    if (!searchQuery) return;
    
    Keyboard.dismiss();
    setLoadingPlaylists(true);
    setAiMessage('Analizando tus gustos...');
    setGeneratedTracks([]);
    setShowAllTracks(false);
    
    try {
      const res = await api.post('/api/spotify/music-chat', { 
        message: searchQuery 
      });
      
      if (res.data.needsConnection) {
        setAiMessage(res.data.aiMessage);
        return;
      }
      
      setAiMessage(res.data.aiMessage || '');
      setPlaylistName(res.data.playlistName || 'Mi Mix');
      
      if (res.data.tracks?.length > 0) {
        setGeneratedTracks(res.data.tracks);
        setTrackUris(res.data.trackUris || []);
      } else {
        setAiMessage('No encontré canciones para eso. Intenta con otra descripción.');
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setAiMessage('Error buscando. Intenta de nuevo.');
    } finally {
      setLoadingPlaylists(false);
      setMusicQuery('');
    }
  }

  async function handleSavePlaylist() {
    if (trackUris.length === 0) return;
    
    setSavingPlaylist(true);
    
    try {
      const res = await api.post('/api/spotify/save-playlist', {
        name: playlistName,
        trackUris: trackUris,
      });
      
      if (res.data.success) {
        Alert.alert(
          '¡Playlist guardada! 🎉',
          res.data.message,
          [
            { text: 'OK' },
            { 
              text: 'Abrir en Spotify', 
              onPress: () => Linking.openURL(res.data.playlist.external_url)
            }
          ]
        );
      }
    } catch (err) {
      console.error('Error guardando playlist:', err);
      Alert.alert('Error', 'No se pudo guardar la playlist');
    } finally {
      setSavingPlaylist(false);
    }
  }

  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async function handleGenerateAI() {
    try {
      setLoadingAI(true);
      const res = await api.post('/api/routines/generate-ai', {});
      
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
      console.error('Error generando rutina:', err);
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
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
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

        {/* Sección de Spotify */}
        {spotifyConnected ? (
          <View style={{ marginBottom: 20 }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: '#1DB954',
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                }} />
                <Text style={{ fontSize: 14, color: '#a3a3a3', fontWeight: '600' }}>
                  Música para entrenar
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SpotifyAuth')}
                style={{ padding: 4 }}
              >
                <Text style={{ color: '#666666', fontSize: 12 }}>Gestionar</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Moods */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 12 }}
            >
              {QUICK_MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.key}
                  onPress={() => handleMusicSearch(mood.query)}
                  style={{
                    backgroundColor: '#1a1a1a',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#333333',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                onPress={() => setShowMusicInput(!showMusicInput)}
                style={{
                  backgroundColor: showMusicInput ? '#1DB954' : '#1a1a1a',
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: showMusicInput ? '#1DB954' : '#333333',
                }}
              >
                <Text style={{ 
                  color: showMusicInput ? '#000000' : '#ffffff', 
                  fontSize: 12, 
                  fontWeight: '600' 
                }}>
                  ✨ Pedir música
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Input personalizado */}
            {showMusicInput && (
              <View style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#333333',
              }}>
                <Text style={{ color: '#888888', fontSize: 12, marginBottom: 8 }}>
                  Describe qué música quieres escuchar...
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: '#0a0a0a',
                      borderRadius: 12,
                      padding: 12,
                      color: '#ffffff',
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: '#333333',
                    }}
                    placeholder="Ej: rock psicodélico, algo como Daft Punk..."
                    placeholderTextColor="#666666"
                    value={musicQuery}
                    onChangeText={setMusicQuery}
                    onSubmitEditing={() => handleMusicSearch()}
                    returnKeyType="search"
                  />
                  <TouchableOpacity
                    onPress={() => handleMusicSearch()}
                    disabled={loadingPlaylists || !musicQuery.trim()}
                    style={{
                      backgroundColor: musicQuery.trim() ? '#1DB954' : '#333333',
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {loadingPlaylists ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={{ fontSize: 20 }}>🔍</Text>
                    )}
                  </TouchableOpacity>
                </View>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {['Rock clásico', 'Hip hop', 'Electrónica', 'Metal', 'Reggaeton'].map((sug) => (
                    <TouchableOpacity
                      key={sug}
                      onPress={() => setMusicQuery(sug)}
                      style={{
                        backgroundColor: '#262626',
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: '#a3a3a3', fontSize: 11 }}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Mensaje de la IA */}
            {aiMessage ? (
              <View style={{
                backgroundColor: '#1a1a1a',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: '#1DB954',
              }}>
                <Text style={{ color: '#ffffff', fontSize: 13 }}>
                  {aiMessage}
                </Text>
              </View>
            ) : null}

            {/* Loading */}
            {loadingPlaylists ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color="#1DB954" />
                <Text style={{ color: '#666666', fontSize: 12, marginTop: 8 }}>
                  Generando tu playlist personalizada...
                </Text>
              </View>
            ) : generatedTracks.length > 0 ? (
              /* Tracks generados */
              <View>
                {/* Header de la playlist con botón guardar */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <View>
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
                      {playlistName}
                    </Text>
                    <Text style={{ color: '#888888', fontSize: 12 }}>
                      {generatedTracks.length} canciones personalizadas
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleSavePlaylist}
                    disabled={savingPlaylist}
                    style={{
                      backgroundColor: '#1DB954',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {savingPlaylist ? (
                      <ActivityIndicator color="#000000" size="small" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 14 }}>💾</Text>
                        <Text style={{ color: '#000000', fontSize: 13, fontWeight: '700' }}>
                          Guardar
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Lista de tracks - COLAPSABLE */}
                <View style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}>
                  {(showAllTracks ? generatedTracks : generatedTracks.slice(0, 6)).map((track, idx, arr) => (
                    <TouchableOpacity
                      key={track.id}
                      onPress={() => Linking.openURL(track.external_url)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                        borderBottomColor: '#333333',
                      }}
                    >
                      {track.image ? (
                        <Image
                          source={{ uri: track.image }}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 4,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View style={{
                          width: 48,
                          height: 48,
                          borderRadius: 4,
                          backgroundColor: '#333333',
                          marginRight: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ fontSize: 20 }}>🎵</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                          {track.name}
                        </Text>
                        <Text style={{ color: '#888888', fontSize: 12 }} numberOfLines={1}>
                          {track.artist}
                        </Text>
                      </View>
                      <Text style={{ color: '#666666', fontSize: 11 }}>
                        {formatDuration(track.duration_ms)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Botón Ver más / Ver menos */}
                  {generatedTracks.length > 6 && (
                    <TouchableOpacity
                      onPress={() => setShowAllTracks(!showAllTracks)}
                      style={{
                        padding: 14,
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderTopColor: '#333333',
                      }}
                    >
                      <Text style={{ color: '#1DB954', fontSize: 13, fontWeight: '600' }}>
                        {showAllTracks 
                          ? '▲ Ver menos' 
                          : `▼ Ver todas (${generatedTracks.length - 6} más)`
                        }
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Botón Play All */}
                <TouchableOpacity
                  onPress={async () => {
                    setSavingPlaylist(true);
                    try {
                      const res = await api.post('/api/spotify/save-playlist', {
                        name: playlistName,
                        trackUris: trackUris,
                      });
                      
                      if (res.data.success) {
                        Linking.openURL(res.data.playlist.external_url);
                      }
                    } catch (err) {
                      Alert.alert('Error', 'No se pudo crear la playlist');
                    } finally {
                      setSavingPlaylist(false);
                    }
                  }}
                  disabled={savingPlaylist}
                  style={{
                    backgroundColor: '#1DB954',
                    paddingVertical: 14,
                    borderRadius: 30,
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {savingPlaylist ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 18 }}>▶️</Text>
                      <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700' }}>
                        Reproducir en Spotify
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Botón para nueva búsqueda */}
                <TouchableOpacity
                  onPress={() => {
                    setGeneratedTracks([]);
                    setAiMessage('');
                    setShowMusicInput(true);
                    setShowAllTracks(false);
                  }}
                  style={{
                    marginTop: 12,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#1DB954', fontSize: 13, fontWeight: '600' }}>
                    🔄 Generar otra playlist
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : (
          /* Botón de Spotify si NO está conectado */
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
            }}
            onPress={() => navigation.navigate('SpotifyAuth')}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#000000', fontSize: 14, fontWeight: '700', marginBottom: 2 }}>
                Conectar Spotify
              </Text>
              <Text style={{ color: '#666666', fontSize: 12, fontWeight: '600' }}>
                Obtén playlists personalizadas
              </Text>
            </View>
            <Text style={{ color: '#000000', fontSize: 18, fontWeight: '600' }}>→</Text>
          </TouchableOpacity>
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
              
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                <View style={{
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 11, color: '#000000', fontWeight: '700' }}>
                    {localRoutine.difficulty_level}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: '#171717',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 11, color: '#a3a3a3', fontWeight: '600' }}>
                    {localRoutine.Exercises?.length || 0} ejercicios
                  </Text>
                </View>
              </View>
            </View>

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
                  <Text style={{ color: '#737373', width: 30, fontSize: 14, fontWeight: '600' }}>
                    {idx + 1}.
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 2 }}>
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
                <Text style={{ color: '#737373', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                  +{localRoutine.Exercises.length - 6} ejercicios más
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#ffffff',
                paddingVertical: 16,
                borderRadius: 999,
                alignItems: 'center',
              }}
              onPress={handleStartTraining}
            >
              <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700' }}>
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
            <Text style={{ fontSize: 18, color: '#ffffff', fontWeight: '700', marginBottom: 16 }}>
              Sin rutina activa
            </Text>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#ffffff',
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 999,
              }}
              onPress={handleGenerateAI}
              disabled={loadingAI}
            >
              {loadingAI ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700' }}>
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