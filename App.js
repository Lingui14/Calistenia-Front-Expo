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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
import ActivityScreen from './src/screens/ActivityScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ---------------------- AUTH SCREEN ---------------------- */

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Escribe tu correo y contraseña');
      return;
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

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authCard}>
        <Text style={styles.appTitle}>CalistenIA 🤖💪</Text>
        <Text style={styles.appSubtitle}>
          Tu coach de calistenia personalizada
        </Text>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="tucorreo@email.com"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={loadingAuth}
          >
            {loadingAuth ? (
              <ActivityIndicator color="#022c22" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchText}>
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------------- RUTINA SCREEN ---------------------- */

function RutinaScreen({
  activeRoutine,
  onGetActiveRoutine,
  onGenerateRoutine,
  onLogout,
  navigation,
}) {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.screenTitle}>Rutina de hoy</Text>
        <Text style={styles.screenSubtitle}>
          Genera tu rutina con CalistenIA o revisa tu rutina activa.
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.secondaryButton, { marginRight: 8 }]}
            onPress={onGetActiveRoutine}
          >
            <Text style={styles.secondaryButtonText}>Ver rutina activa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButtonInline}
            onPress={onGenerateRoutine}
          >
            <Text style={styles.primaryButtonTextInline}>
              Generar nueva rutina
            </Text>
          </TouchableOpacity>
        </View>

        {activeRoutine ? (
          <View style={styles.routineCard}>
            <Text style={styles.routineTitle}>{activeRoutine.name}</Text>
            {activeRoutine.description ? (
              <Text style={styles.routineDescription}>
                {activeRoutine.description}
              </Text>
            ) : null}
            {activeRoutine.difficulty_level ? (
              <Text style={styles.routineTag}>
                Nivel: {activeRoutine.difficulty_level}
              </Text>
            ) : null}

            <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
              Ejercicios
            </Text>

            {activeRoutine.Exercises && activeRoutine.Exercises.length > 0 ? (
              activeRoutine.Exercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseRow}>
                  <View>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {ex.sets} x {ex.reps} reps • descanso {ex.rest_time}s
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Aún no hay ejercicios cargados.
              </Text>
            )}

            <TouchableOpacity
              style={styles.startTrainingButton}
              onPress={() => navigation.navigate('Training', { routine: activeRoutine })}
            >
              <Text style={styles.startTrainingButtonText}>
                🏋️ Iniciar entrenamiento
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.emptyText, { marginTop: 24 }]}>
            No tienes una rutina activa todavía. Genera una para empezar 💪
          </Text>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------------- CHAT SCREEN (Placeholder) ---------------------- */

/* ---------------------- CHAT SCREEN ---------------------- */

function ChatScreen() {
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
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
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
        <Text style={chatStyles.title}>🤖 CalistenIA</Text>
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
            <View
              key={index}
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
          ))
        )}
        {loading && (
          <View style={[chatStyles.messageBubble, chatStyles.aiBubble, { flexDirection: 'row' }]}>
            <ActivityIndicator size="small" color="#22c55e" />
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
        <ActivityIndicator size="large" color="#22c55e" />
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RutinaMain">
          {(props) => (
            <RutinaScreen
              {...props}
              activeRoutine={activeRoutine}
              onGetActiveRoutine={handleGetActiveRoutine}
              onGenerateRoutine={handleGenerateRoutine}
              onLogout={handleLogout}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="Training" 
          component={TrainingScreen}
          options={{ 
            headerShown: true, 
            title: 'Entrenamiento', 
            headerStyle: { backgroundColor: '#020617' }, 
            headerTintColor: '#22c55e' 
          }}
        />
      </Stack.Navigator>
    );
  }

  // App principal con 4 tabs
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: '#020617', 
            borderTopColor: '#111827',
            paddingBottom: 4,
            paddingTop: 4,
          },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#9ca3af',
        }}
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
        <Tab.Screen 
          name="Actividad" 
          component={ActivityScreen}
          options={{ tabBarLabel: 'Actividad' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  authCard: {
    backgroundColor: '#020617',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#022c22',
    fontSize: 15,
    fontWeight: '700',
  },
  switchText: {
    marginTop: 16,
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  screenContainerCenter: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e5e7eb',
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontSize: 13,
  },
  primaryButtonInline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  primaryButtonTextInline: {
    color: '#022c22',
    fontSize: 13,
    fontWeight: '700',
  },
  routineCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  routineDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  routineTag: {
    fontSize: 12,
    color: '#bbf7d0',
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  exerciseRow: {
    marginTop: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  startTrainingButton: {
    marginTop: 20,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  startTrainingButtonText: {
    color: '#022c22',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
  },
  logoutButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
  },
});

export const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
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
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  suggestions: {
    marginTop: 24,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  suggestionText: {
    color: '#9ca3af',
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
    backgroundColor: '#22c55e',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#022c22',
  },
  aiText: {
    color: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    alignItems: 'flex-end',
    backgroundColor: '#020617',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#22c55e',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1f2937',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#022c22',
  },
});