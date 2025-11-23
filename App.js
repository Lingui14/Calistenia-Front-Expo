import React, { useEffect, useState } from 'react';
import {
  Text,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// API
import { login, register } from './src/api/auth';
import { getProfile } from './src/api/profile';
import { getActiveRoutine, generateRoutine } from './src/api/routines';
import { setAuthToken } from './src/api/client';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import RutinaScreen from './src/screens/RutinaScreen';
import ChatScreen from './src/screens/ChatScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import FoodScreen from './src/screens/FoodScreen';
import SpotifyAuthScreen from './src/screens/SpotifyAuthScreen';

// Components
import OnboardingCarousel from './src/components/OnboardingCarousel';

// Styles
import { appStyles } from './src/styles/appStyles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
      <SafeAreaView style={appStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={appStyles.loadingText}>Cargando CalistenIA...</Text>
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
      <SafeAreaView style={appStyles.screenContainer}>
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

  // App principal con 5 tabs
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