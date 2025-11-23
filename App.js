import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpotifyAuthScreen from './src/screens/SpotifyAuthScreen';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { login, register } from './src/api/auth';
import { getProfile } from './src/api/profile';
import { getActiveRoutine, generateRoutine } from './src/api/routines';
import { setAuthToken } from './src/api/client';
import { sendMessage } from './src/api/chat';
import OnboardingCarousel from './src/components/OnboardingCarousel';
import TrainingScreen from './src/screens/TrainingScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import FoodScreen from './src/screens/FoodScreen';

import api from './src/api/client';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ---------------------- AUTH SCREEN ---------------------- */

function AuthScreen({ onLogin, onRegister }) {
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
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.authScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header spacer */}
          <View style={styles.topSpacer} />

          {/* Branding - Centrado arriba */}
          <View style={styles.brandingSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="barbell-outline" size={48} color="#ffffff" />
            </View>
            <Text style={styles.appTitle}>CalistenIA</Text>
            <Text style={styles.appSubtitle}>Tu coach personal de calistenia</Text>
          </View>

          {/* Form - Más abajo */}
          <View style={styles.formSection}>
            <View style={styles.authCard}>
              <Text style={styles.formTitle}>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Text>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#737373" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#525252"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#737373" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
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
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#737373" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputField}
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
                <View style={styles.passwordMatch}>
                  <Ionicons 
                    name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={password === confirmPassword ? "#22c55e" : "#dc2626"} 
                  />
                  <Text style={[
                    styles.passwordMatchText,
                    { color: password === confirmPassword ? "#22c55e" : "#dc2626" }
                  ]}>
                    {password === confirmPassword ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: mode === 'register' ? 8 : 16 }]}
                onPress={handleSubmit}
                disabled={loadingAuth}
              >
                {loadingAuth ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {mode === 'login' ? 'Entrar' : 'Registrarme'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Switch Mode */}
              <TouchableOpacity
                style={styles.secondaryButtonFull}
                onPress={switchMode}
              >
                <Text style={styles.secondaryButtonFullText}>
                  {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.bottomSection}>
            <Text style={styles.footerText}>
              Entrena inteligente, progresa constante
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
/* ---------------------- RUTINA SCREEN ---------------------- */
// App.js - FUNCIÓN RutinaScreen (COMPLETA CON SPOTIFY)
function RutinaScreen({
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
    
    // Llamar directamente a la API (como en ExercisesScreen)
    const res = await api.post('/api/routines/generate-ai', {});
    
    // Actualizar la rutina local
    setLocalRoutine(res.data.routine);
    
    // Llamar también a onGetActiveRoutine para actualizar en App.js
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
  } catch (err) {
    console.error('Error generando rutina:', err);
    Alert.alert('Error', 'No se pudo generar la rutina con IA. Verifica tu conexión.');
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
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <View>
            <Text style={styles.screenTitle}>Rutina de hoy</Text>
            <Text style={styles.screenSubtitle}>
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
          <View style={styles.routineCard}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.routineTitle}>{localRoutine.name}</Text>
              {localRoutine.description ? (
                <Text style={styles.routineDescription}>
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
                        : `${ex.sets} × ${ex.reps} reps`}
                    </Text>
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
/* ---------------------- CHAT SCREEN (Placeholder) ---------------------- */

function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    try {
      setLoading(true);
      const reply = await sendMessage(userMessage, messages);
      
      const routineButtonPattern = /\[ROUTINE_BUTTON:([a-f0-9-]+)\]/i;
      const match = reply.match(routineButtonPattern);
      
      let cleanedReply = reply;
      let hasRoutine = false;
      
      if (match) {
        hasRoutine = true;
        cleanedReply = reply.replace(routineButtonPattern, '').trim();
      }
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: cleanedReply,
        hasRoutine: hasRoutine
      }]);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Lo siento, hubo un error. Intenta de nuevo.' 
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={chatStyles.container}>
      <View style={chatStyles.header}>
        <Text style={chatStyles.title}> CalistenIA</Text>
        <Text style={chatStyles.subtitle}>Tu coach personal de calistenia</Text>
      </View>

      <ScrollView 
        style={chatStyles.messagesContainer}
        contentContainerStyle={chatStyles.messagesContent}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={chatStyles.emptyChat}>
            <Text style={chatStyles.emptyChatEmoji}>💬</Text>
            <Text style={chatStyles.emptyChatText}>
              ¡Hola! Soy tu asistente de calistenia.{'\n\n'}
              Pregúntame sobre ejercicios, rutinas, técnica, nutrición o lo que necesites.
            </Text>
            <View style={chatStyles.suggestions}>
              <TouchableOpacity 
                style={chatStyles.suggestionChip}
                onPress={() => setInput('¿Cómo hago mi primera dominada?')}
              >
                <Text style={chatStyles.suggestionText}>¿Cómo hago mi primera dominada?</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={chatStyles.suggestionChip}
                onPress={() => setInput('Dame una rutina para principiantes')}
              >
                <Text style={chatStyles.suggestionText}>Rutina para principiantes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={chatStyles.suggestionChip}
                onPress={() => setInput('¿Qué debo comer para ganar músculo?')}
              >
                <Text style={chatStyles.suggestionText}>Nutrición para ganar músculo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          messages.map((msg, index) => (
            <View key={index}>
              <View
                style={[
                  chatStyles.messageBubble,
                  msg.role === 'user' ? chatStyles.userBubble : chatStyles.aiBubble,
                ]}
              >
                <Text style={[
                  chatStyles.messageText,
                  msg.role === 'user' ? chatStyles.userText : chatStyles.aiText,
                ]}>
                  {msg.content}
                </Text>
              </View>
              
              {msg.role === 'assistant' && msg.hasRoutine && (
                <TouchableOpacity
                  style={chatStyles.routineButton}
                  onPress={() => navigation.navigate('MisRutinas')}
                >
                  <Text style={chatStyles.routineButtonText}>Ver rutina generada</Text>
                  <Text style={chatStyles.routineButtonArrow}>→</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        {loading && (
          <View style={[chatStyles.messageBubble, chatStyles.aiBubble, { flexDirection: 'row' }]}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[chatStyles.aiText, { marginLeft: 8 }]}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={chatStyles.inputContainer}>
          <TextInput
            style={chatStyles.input}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor="#6b7280"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[chatStyles.sendButton, (!input.trim() || loading) && chatStyles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={chatStyles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------------- APP ROOT ---------------------- */

export default function App() {
  const [token, setToken] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [profile, setProfile] = useState(null);
  const [hasOnboarding, setHasOnboarding] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState(null);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      setLoadingInit(true);
      const storedToken = await AsyncStorage.getItem('token');
      const onboardingFlag = await AsyncStorage.getItem('onboardingDone');

      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
        await fetchProfile();
      }

      if (onboardingFlag === '1') {
        setHasOnboarding(true);
      }
    } catch (err) {
      console.error('Error al cargar token inicial:', err);
    } finally {
      setLoadingInit(false);
    }
  }

  async function fetchProfile() {
    try {
      const prof = await getProfile();
      setProfile(prof);

      if (prof && (prof.experience || prof.goal)) {
        setHasOnboarding(true);
        await AsyncStorage.setItem('onboardingDone', '1');
      }
      return prof;
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      return null;
    }
  }

  async function handleLogin(email, password) {
    const newToken = await login(email, password);
    setToken(newToken);
    await AsyncStorage.setItem('token', newToken);
    setAuthToken(newToken);

    await fetchProfile();

    const onboardingFlag = await AsyncStorage.getItem('onboardingDone');
    if (onboardingFlag === '1') {
      setHasOnboarding(true);
    }
  }

  async function handleRegister(email, password) {
    const newToken = await register(email, password);
    setToken(newToken);
    await AsyncStorage.setItem('token', newToken);
    setAuthToken(newToken);
    setHasOnboarding(false);
    setProfile(null);
  }

  async function handleLogout() {
    setToken(null);
    setProfile(null);
    setActiveRoutine(null);
    setAuthToken(null);
    await AsyncStorage.removeItem('token');
    setHasOnboarding(false);
  }

  async function handleGetActiveRoutine() {
    try {
      const data = await getActiveRoutine();
      setActiveRoutine(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Sin rutina', 'No tienes una rutina activa todavía.');
    }
  }

  async function handleGenerateRoutine() {
    try {
      const data = await generateRoutine();
      setActiveRoutine(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo generar la rutina.');
    }
  }

  async function handleOnboardingDone() {
    try {
      await fetchProfile();
      setHasOnboarding(true);
      await AsyncStorage.setItem('onboardingDone', '1');
      
      const routine = await generateRoutine();
      setActiveRoutine(routine);
      
      Alert.alert('¡Listo! 🎉', 'Tu perfil y rutina se han creado correctamente');
    } catch (err) {
      console.error("Error en handleOnboardingDone:", err);
      setHasOnboarding(true);
      await AsyncStorage.setItem('onboardingDone', '1');
    }
  }

  // Loading
  if (loadingInit) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Cargando CalistenIA...</Text>
      </SafeAreaView>
    );
  }

  // Sin token -> Login
  if (!token) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Con token pero sin onboarding -> Encuesta
  if (!hasOnboarding) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <OnboardingCarousel onDone={handleOnboardingDone} />
      </SafeAreaView>
    );
  }

  // Stack para Rutina (incluye TrainingScreen)
function RutinaStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#ffffff',
      }}
    >
      <Stack.Screen name="RutinaMain" component={RutinaScreen} />
      <Stack.Screen 
        name="Training" 
        component={TrainingScreen}
        options={{ 
          headerShown: true,
          title: 'Entrenamiento',
        }}
      />
      <Stack.Screen 
        name="SpotifyAuth" 
        component={SpotifyAuthScreen}
        options={{ 
          headerShown: true,
          title: 'Conectar Spotify',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
  // App principal con 4 tabs
  return (
    <NavigationContainer>
      <Tab.Navigator
  screenOptions={({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      
      if (route.name === 'Rutina') iconName = focused ? 'today' : 'today-outline';
      else if (route.name === 'MisRutinas') iconName = focused ? 'barbell' : 'barbell-outline';
      else if (route.name === 'Progreso') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
      else if (route.name === 'Chat') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
      else if (route.name === 'Comida') iconName = focused ? 'restaurant' : 'restaurant-outline';
      
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#ffffff',
    tabBarInactiveTintColor: '#737373',
    tabBarStyle: { backgroundColor: '#000000', borderTopColor: '#262626' },
  })}
>
        <Tab.Screen 
          name="Rutina" 
          component={RutinaStack}
          options={{ tabBarLabel: 'Hoy' }}
        />
        <Tab.Screen 
          name="MisRutinas" 
          component={ExercisesScreen}
          options={{ tabBarLabel: 'Mis Rutinas' }}
        />
        <Tab.Screen 
          name="Progreso" 
          component={ProgressScreen}
          options={{ tabBarLabel: 'Progreso' }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ tabBarLabel: 'Chat IA' }}
        />
        <Tab.Screen 
          name="Comida" 
          component={FoodScreen}
          options={{ tabBarLabel: 'Comida' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = StyleSheet.create({
  // Auth Screen
  authContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topSpacer: {
    height: 60,
  },
  brandingSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  authCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -8,
  },
  passwordMatchText: {
    fontSize: 12,
    marginLeft: 6,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#262626',
  },
  dividerText: {
    color: '#525252',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  secondaryButtonFull: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  secondaryButtonFullText: {
    color: '#a3a3a3',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSection: {
    paddingVertical: 24,
  },
  footerText: {
    color: '#525252',
    fontSize: 13,
    textAlign: 'center',
  },

  // Screen containers
  screenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  screenContainerCenter: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 8,
    textAlign: 'center',
  },

  // Buttons
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#404040',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  primaryButtonInline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  primaryButtonTextInline: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },

  // Routine Card
  routineCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0a0a0a',
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  routineDescription: {
    fontSize: 13,
    color: '#a3a3a3',
    marginTop: 4,
  },
  routineTag: {
    fontSize: 12,
    color: '#d4d4d4',
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  exerciseRow: {
    marginTop: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 2,
  },
  startTrainingButton: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  startTrainingButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty & misc
  emptyText: {
    color: '#737373',
    fontSize: 13,
  },
  logoutButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a3a3a3',
    marginTop: 12,
  },
});

export const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#737373',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  suggestions: {
    marginTop: 24,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: '#171717',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  suggestionText: {
    color: '#a3a3a3',
    fontSize: 13,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#171717',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#000000',
  },
  aiText: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#262626',
    alignItems: 'flex-end',
    backgroundColor: '#000000',
  },
  input: {
    flex: 1,
    backgroundColor: '#171717',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#ffffff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#262626',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#000000',
  },
  routineButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 4,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routineButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  routineButtonArrow: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});