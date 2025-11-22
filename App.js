import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { login, register } from './src/api/auth';
import { getProfile } from './src/api/profile';
import { getActiveRoutine, generateRoutine } from './src/api/routines';
import { setAuthToken } from './src/api/client';
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

function ChatScreen() {
  return (
    <SafeAreaView style={styles.screenContainerCenter}>
      <Text style={styles.placeholderEmoji}>🤖</Text>
      <Text style={styles.screenTitle}>CalistenIA Chat</Text>
      <Text style={styles.screenSubtitle}>
        Próximamente: tu asistente personal de calistenia
      </Text>
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