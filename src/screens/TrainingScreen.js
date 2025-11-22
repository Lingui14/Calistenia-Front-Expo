// src/screens/TrainingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import { startTrainingSession, logExercise, finishTrainingSession } from '../api/training';

export default function TrainingScreen({ route, navigation }) {
  const { routine } = route.params;

  const [sessionId, setSessionId] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);
  const [completedReps, setCompletedReps] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [exerciseLogged, setExerciseLogged] = useState(false); // NUEVO: trackea si ya se guardó

  const timerRef = useRef(null);

  const exercises = routine?.Exercises || [];
  const currentExercise = exercises[currentExerciseIndex];

  useEffect(() => {
    initSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isResting && restTimeLeft > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsResting(false);
            Vibration.vibrate([0, 500, 200, 500]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [isResting, restTimeLeft, isPaused]);

  async function initSession() {
    try {
      const session = await startTrainingSession(routine.id);
      setSessionId(session.id);
      setSessionStartTime(new Date());
    } catch (err) {
      console.error('Error iniciando sesión:', err);
      Alert.alert('Error', 'No se pudo iniciar la sesión de entrenamiento');
    }
  }

  function handleAddSet() {
    if (completedSets < currentExercise.sets) {
      setCompletedSets(prev => prev + 1);
    }
  }

  function handleRemoveSet() {
    if (completedSets > 0) {
      setCompletedSets(prev => prev - 1);
    }
  }

  function handleAddRep() {
    setCompletedReps(prev => prev + 1);
  }

  function handleRemoveRep() {
    if (completedReps > 0) {
      setCompletedReps(prev => prev - 1);
    }
  }

  function startRestTimer() {
    setIsResting(true);
    setRestTimeLeft(currentExercise.rest_time || 60);
  }

  function skipRest() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsResting(false);
    setRestTimeLeft(0);
  }

  function togglePause() {
    setIsPaused(prev => !prev);
  }

  async function handleCompleteExercise() {
    if (completedSets === 0) {
      Alert.alert('Marca al menos una serie', 'Debes completar al menos 1 serie antes de continuar');
      return;
    }

    try {
      await logExercise(
        sessionId,
        currentExercise.id,
        completedSets,
        completedReps || currentExercise.reps * completedSets,
        ''
      );

      setExerciseLogged(true); // NUEVO: marcar como guardado

      if (currentExerciseIndex < exercises.length - 1) {
        Alert.alert(
          '✅ Ejercicio completado',
          `${completedSets} series registradas. ¿Qué deseas hacer?`,
          [
            {
              text: 'Siguiente ejercicio',
              onPress: () => goToNextExercise(),
            },
            {
              text: 'Descansar primero',
              onPress: () => startRestTimer(),
            },
          ]
        );
      } else {
        handleFinishSession();
      }
    } catch (err) {
      console.error('Error guardando ejercicio:', err);
      Alert.alert('Error', 'No se pudo guardar el ejercicio');
    }
  }

  function goToNextExercise() {
    setCurrentExerciseIndex(prev => prev + 1);
    setCompletedSets(0);
    setCompletedReps(0);
    setIsResting(false);
    setRestTimeLeft(0);
    setExerciseLogged(false); // NUEVO: resetear para el siguiente ejercicio
  }

  async function handleFinishSession() {
    try {
      await finishTrainingSession(sessionId);
      
      const duration = Math.floor((new Date() - sessionStartTime) / 1000 / 60);

      Alert.alert(
        '🎉 ¡Entrenamiento completado!',
        `Duración: ${duration} min\nEjercicios: ${exercises.length}\n\n¡Excelente trabajo!`,
        [
          {
            text: 'Ver rutina',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error('Error finalizando sesión:', err);
      Alert.alert('Error', 'No se pudo finalizar la sesión');
    }
  }

  function handleQuit() {
    Alert.alert(
      'Salir del entrenamiento',
      '¿Seguro que quieres salir? Tu progreso se guardará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>No hay ejercicios en esta rutina</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.progressText}>
            Ejercicio {currentExerciseIndex + 1} de {exercises.length}
          </Text>
          <TouchableOpacity onPress={handleQuit}>
            <Text style={styles.quitButton}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` },
            ]}
          />
        </View>

        {/* Ejercicio actual */}
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          {currentExercise.description && (
            <Text style={styles.exerciseDescription}>{currentExercise.description}</Text>
          )}
          
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Meta:</Text>
            <Text style={styles.targetValue}>
              {currentExercise.sets} series × {currentExercise.reps} reps
            </Text>
          </View>
          <Text style={styles.restInfo}>Descanso: {currentExercise.rest_time}s</Text>

          {/* NUEVO: Indicador de ejercicio completado */}
          {exerciseLogged && (
            <View style={styles.loggedBadge}>
              <Text style={styles.loggedBadgeText}>✓ Guardado</Text>
            </View>
          )}
        </View>

        {/* Timer de descanso */}
        {isResting && (
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>⏱️ Descansando</Text>
            <Text style={styles.restTimer}>{restTimeLeft}s</Text>
            <View style={styles.restButtons}>
              <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                <Text style={styles.pauseButtonText}>{isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
                <Text style={styles.skipButtonText}>Saltar ⏭️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contador de series */}
        <View style={styles.counterSection}>
          <Text style={styles.counterLabel}>Series completadas</Text>
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterButton} onPress={handleRemoveSet}>
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>
              {completedSets} / {currentExercise.sets}
            </Text>
            <TouchableOpacity style={styles.counterButton} onPress={handleAddSet}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contador de reps (opcional) */}
        <View style={styles.counterSection}>
          <Text style={styles.counterLabel}>Repeticiones totales (opcional)</Text>
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterButton} onPress={handleRemoveRep}>
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{completedReps}</Text>
            <TouchableOpacity style={styles.counterButton} onPress={handleAddRep}>
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.restTimerButton, isResting && styles.restTimerButtonDisabled]}
            onPress={startRestTimer}
            disabled={isResting}
          >
            <Text style={styles.restTimerButtonText}>⏱️ Iniciar descanso</Text>
          </TouchableOpacity>

          {/* NUEVO: Botón condicional según si ya se guardó el ejercicio */}
          {exerciseLogged && currentExerciseIndex < exercises.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={goToNextExercise}>
              <Text style={styles.nextButtonText}>➡️ Siguiente ejercicio</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteExercise}>
              <Text style={styles.completeButtonText}>
                {currentExerciseIndex === exercises.length - 1
                  ? '✅ Finalizar entrenamiento'
                  : '✅ Completar ejercicio'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de ejercicios restantes */}
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingTitle}>Próximos ejercicios</Text>
          {exercises.slice(currentExerciseIndex + 1).length === 0 ? (
            <Text style={styles.emptyText}>¡Este es el último ejercicio!</Text>
          ) : (
            exercises.slice(currentExerciseIndex + 1).map((ex, idx) => (
              <View key={ex.id} style={styles.upcomingItem}>
                <Text style={styles.upcomingNumber}>{currentExerciseIndex + idx + 2}.</Text>
                <Text style={styles.upcomingName}>{ex.name}</Text>
                <Text style={styles.upcomingDetail}>
                  {ex.sets}×{ex.reps}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  quitButton: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1f2937',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  exerciseCard: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  restInfo: {
    fontSize: 13,
    color: '#6b7280',
  },
  // NUEVO: Badge de guardado
  loggedBadge: {
    marginTop: 12,
    backgroundColor: '#166534',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  loggedBadgeText: {
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '600',
  },
  restCard: {
    backgroundColor: '#1e3a8a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  restTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 12,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#dbeafe',
    marginBottom: 16,
  },
  restButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  skipButtonText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  counterSection: {
    marginBottom: 20,
  },
  counterLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  counterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1f2937',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 24,
    color: '#22c55e',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#e5e7eb',
    marginHorizontal: 32,
    minWidth: 80,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  restTimerButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  restTimerButtonDisabled: {
    backgroundColor: '#1f2937',
    opacity: 0.5,
  },
  restTimerButtonText: {
    color: '#93c5fd',
    fontSize: 15,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#022c22',
    fontSize: 15,
    fontWeight: '700',
  },
  // NUEVO: Botón siguiente ejercicio
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  upcomingSection: {
    marginTop: 8,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  upcomingNumber: {
    fontSize: 13,
    color: '#6b7280',
    width: 24,
  },
  upcomingName: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
  },
  upcomingDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
});