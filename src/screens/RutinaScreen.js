// src/screens/RutinaScreen.js (ACTUALIZADO)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateRoutineAI, getAISuggestions, getActiveRoutine } from '../api/routines';

export default function RutinaScreen({ navigation, onLogout }) {
  const [activeRoutine, setActiveRoutine] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoadingSuggestions(true);
      const [routine, suggestionsData] = await Promise.all([
        getActiveRoutine().catch(() => null),
        getAISuggestions().catch(() => ({ suggestions: [] }))
      ]);
      
      setActiveRoutine(routine);
      setSuggestions(suggestionsData.suggestions || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleGenerateAI(suggestionType = null) {
    try {
      setLoading(true);
      
      const params = {};
      if (suggestionType) {
        params.workoutType = suggestionType;
      }

      const result = await generateRoutineAI(params);
      setActiveRoutine(result.routine);
      
      Alert.alert(
        '✅ Rutina generada',
        `"${result.routine.name}" está lista. ¿Quieres comenzar ahora?`,
        [
          { text: 'Después', style: 'cancel' },
          {
            text: 'Empezar',
            onPress: () => navigation.navigate('Training', {
              routine: result.routine,
              spotifyMood: result.spotify_mood
            })
          }
        ]
      );
    } catch (err) {
      console.error('Error generando rutina:', err);
      Alert.alert('Error', 'No se pudo generar la rutina. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshRoutine() {
    try {
      const routine = await getActiveRoutine();
      setActiveRoutine(routine);
    } catch (err) {
      Alert.alert('Info', 'No hay rutina activa');
    }
  }

  function handleStartTraining() {
    if (!activeRoutine) {
      Alert.alert('Sin rutina', 'Primero genera una rutina para entrenar');
      return;
    }

    navigation.navigate('Training', { routine: activeRoutine });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
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
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Sugerencias rápidas */}
        {!loadingSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>⚡ Sugerencias para hoy</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestions.map((sug, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionCard}
                  onPress={() => handleGenerateAI(sug.type)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionLabel}>{sug.label}</Text>
                  <Text style={styles.suggestionDescription}>{sug.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Generar con IA */}
        <View style={styles.generateSection}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => handleGenerateAI()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#022c22" />
            ) : (
              <>
                <Text style={styles.generateButtonIcon}>🤖</Text>
                <Text style={styles.generateButtonText}>
                  Generar rutina con IA
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.generateHint}>
            CalistenIA creará una rutina personalizada para ti
          </Text>
        </View>

        {/* Rutina activa */}
        {activeRoutine ? (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <View style={styles.routineInfo}>
                <Text style={styles.routineTitle}>{activeRoutine.name}</Text>
                {activeRoutine.description && (
                  <Text style={styles.routineDescription}>
                    {activeRoutine.description}
                  </Text>
                )}
                <View style={styles.routineMeta}>
                  <Text style={styles.metaBadge}>
                    {activeRoutine.difficulty_level}
                  </Text>
                  <Text style={styles.metaBadge}>
                    {activeRoutine.Exercises?.length || 0} ejercicios
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRefreshRoutine}>
                <Text style={styles.refreshIcon}>🔄</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de ejercicios */}
            <View style={styles.exercisesList}>
              {activeRoutine.Exercises?.slice(0, 5).map((ex, index) => (
                <View key={ex.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseNumber}>{index + 1}</Text>
                  <View style={styles.exerciseDetails}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseStats}>
                      {ex.exercise_type === 'amrap' 
                        ? `AMRAP ${Math.floor(ex.amrap_duration / 60)} min`
                        : ex.exercise_type === 'hiit'
                        ? `HIIT ${ex.hiit_work_time}s/${ex.hiit_rest_time}s × ${ex.hiit_rounds}`
                        : `${ex.sets} × ${ex.reps} reps`}
                    </Text>
                  </View>
                  {ex.exercise_type !== 'standard' && (
                    <Text style={styles.exerciseType}>
                      {ex.exercise_type === 'amrap' ? '⏱️' : '🔥'}
                    </Text>
                  )}
                </View>
              ))}
              {activeRoutine.Exercises?.length > 5 && (
                <Text style={styles.moreExercises}>
                  +{activeRoutine.Exercises.length - 5} ejercicios más
                </Text>
              )}
            </View>

            {/* Botón comenzar */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartTraining}
            >
              <Text style={styles.startButtonText}>
                🚀 Comenzar entrenamiento
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💪</Text>
            <Text style={styles.emptyTitle}>Sin rutina activa</Text>
            <Text style={styles.emptyText}>
              Genera tu primera rutina con IA para comenzar
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#737373',
    textTransform: 'capitalize',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
  },
  suggestionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  suggestionsScroll: {
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    width: 160,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#737373',
  },
  generateSection: {
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  generateButtonIcon: {
    fontSize: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#022c22',
  },
  generateHint: {
    fontSize: 12,
    color: '#737373',
    textAlign: 'center',
    marginTop: 8,
  },
  routineCard: {
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: '#a3a3a3',
    marginBottom: 8,
  },
  routineMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    fontSize: 12,
    color: '#22c55e',
    backgroundColor: '#052e16',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  refreshIcon: {
    fontSize: 24,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  exerciseNumber: {
    width: 32,
    fontSize: 16,
    fontWeight: '600',
    color: '#737373',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  exerciseStats: {
    fontSize: 13,
    color: '#737373',
  },
  exerciseType: {
    fontSize: 20,
  },
  moreExercises: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 20,
  },
});