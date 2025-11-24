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
import { Audio } from 'expo-av';
import { startTrainingSession, logExercise, finishTrainingSession } from '../api/training';
import api from '../api/client';

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
  const [exerciseLogged, setExerciseLogged] = useState(false);

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  
  // ══════════════════════════════════════════════════════════════
  // NUEVO: Estados para circuit_exercises
  // ══════════════════════════════════════════════════════════════
  const [currentCircuitIndex, setCurrentCircuitIndex] = useState(0);
  const [completedRounds, setCompletedRounds] = useState(0);

  const timerRef = useRef(null);
  const workoutTimerRef = useRef(null);
  const startSoundRef = useRef(null);
  const endSoundRef = useRef(null);

  const exercises = routine?.Exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const isTimerExercise = ['hiit', 'amrap', 'emom'].includes(currentExercise?.exercise_type);
  
  // ══════════════════════════════════════════════════════════════
  // NUEVO: Obtener ejercicios del circuito
  // ══════════════════════════════════════════════════════════════
  const circuitExercises = currentExercise?.circuit_exercises || [];
  const currentCircuitExercise = circuitExercises[currentCircuitIndex] || null;
  const hasCircuitExercises = circuitExercises.length > 0;

  useEffect(() => {
    initSession();
    loadSounds();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      unloadSounds();
    };
  }, []);

  async function loadSounds() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound: startSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/start.mp3')
      );
      startSoundRef.current = startSound;
      const { sound: endSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/end.mp3')
      );
      endSoundRef.current = endSound;
    } catch (err) {
      console.error('Error cargando sonidos:', err);
    }
  }

  async function unloadSounds() {
    try {
      if (startSoundRef.current) await startSoundRef.current.unloadAsync();
      if (endSoundRef.current) await endSoundRef.current.unloadAsync();
    } catch (err) {}
  }

  async function playStartSound() {
    try {
      if (startSoundRef.current) {
        await startSoundRef.current.setPositionAsync(0);
        await startSoundRef.current.playAsync();
      }
    } catch (err) {}
  }

  async function playEndSound() {
    try {
      if (endSoundRef.current) {
        await endSoundRef.current.setPositionAsync(0);
        await endSoundRef.current.playAsync();
      }
    } catch (err) {}
  }

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

  // Timer de descanso standard
  useEffect(() => {
    if (isResting && restTimeLeft > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsResting(false);
            Vibration.vibrate([0, 500, 200, 500]);
            playEndSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [isResting, restTimeLeft, isPaused]);

  // ══════════════════════════════════════════════════════════════
  // TIMER ACTUALIZADO CON ROTACIÓN DE EJERCICIOS
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (timerActive && !isPaused) {
      workoutTimerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const newTime = prev + 1;
          
          // HIIT: Rotar ejercicio cada ronda
          if (currentExercise.exercise_type === 'hiit') {
            const workTime = currentExercise.hiit_work_time;
            const restTime = currentExercise.hiit_rest_time;
            const totalRounds = currentExercise.hiit_rounds;
            
            if (isWorkPhase) {
              if (newTime >= workTime) {
                Vibration.vibrate(200);
                playStartSound();
                setIsWorkPhase(false);
                return 0;
              }
            } else {
              if (newTime >= restTime) {
                if (currentRound >= totalRounds) {
                  handleTimerComplete();
                  return 0;
                } else {
                  Vibration.vibrate(200);
                  playStartSound();
                  setCurrentRound(prev => prev + 1);
                  setIsWorkPhase(true);
                  
                  // ══════ ROTAR AL SIGUIENTE EJERCICIO ══════
                  if (hasCircuitExercises) {
                    setCurrentCircuitIndex(prev => 
                      (prev + 1) % circuitExercises.length
                    );
                  }
                  return 0;
                }
              }
            }
          }
          
          // AMRAP: Timer cuenta hacia arriba
          if (currentExercise.exercise_type === 'amrap') {
            const duration = currentExercise.amrap_duration;
            if (newTime >= duration) {
              handleTimerComplete();
              return 0;
            }
          }
          
          // EMOM: Rotar ejercicio cada 60 segundos
          if (currentExercise.exercise_type === 'emom') {
            const duration = currentExercise.emom_duration;
            
            if (newTime > 0 && newTime % 60 === 0) {
              Vibration.vibrate(200);
              playStartSound();
              
              if (hasCircuitExercises) {
                setCurrentCircuitIndex(prev => 
                  (prev + 1) % circuitExercises.length
                );
              }
              setCurrentRound(prev => prev + 1);
            }
            
            if (newTime >= duration) {
              handleTimerComplete();
              return 0;
            }
          }
          
          return newTime;
        });
      }, 1000);
      return () => clearInterval(workoutTimerRef.current);
    }
  }, [timerActive, isPaused, isWorkPhase, currentRound, currentExercise, hasCircuitExercises, circuitExercises.length]);

  // ══════════════════════════════════════════════════════════════
  // NUEVO: Funciones para AMRAP manual
  // ══════════════════════════════════════════════════════════════
  function markRoundComplete() {
    setCompletedRounds(prev => prev + 1);
    Vibration.vibrate(100);
    setCurrentCircuitIndex(0);
  }

  function nextCircuitExercise() {
    if (hasCircuitExercises) {
      const nextIndex = currentCircuitIndex + 1;
      if (nextIndex >= circuitExercises.length) {
        markRoundComplete();
      } else {
        setCurrentCircuitIndex(nextIndex);
      }
    }
  }

  function handleTimerComplete() {
    setTimerActive(false);
    setTimerSeconds(0);
    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    playEndSound();
    
    Alert.alert(
      'Ejercicio completado',
      currentExercise.exercise_type === 'amrap' 
        ? `Completaste ${completedRounds} rondas`
        : `${currentRound} rondas completadas`,
      [{ text: 'OK' }]
    );
  }

  function startTimer() {
    setTimerActive(true);
    setIsPaused(false);
    setCurrentCircuitIndex(0);
    setCompletedRounds(0);
    playStartSound();
  }

  function pauseTimer() {
    setIsPaused(prev => !prev);
  }

  function resetTimer() {
    setTimerActive(false);
    setTimerSeconds(0);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setCurrentCircuitIndex(0);
    setCompletedRounds(0);
    if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function addSet() {
    if (completedSets < (currentExercise.sets || 10)) {
      setCompletedSets(prev => prev + 1);
      setCompletedReps(prev => prev + (currentExercise.reps || 0));
      Vibration.vibrate(100);
    }
  }

  function removeSet() {
    if (completedSets > 0) {
      setCompletedSets(prev => prev - 1);
      setCompletedReps(prev => prev - (currentExercise.reps || 0));
    }
  }

  function startRestTimer() {
    setIsResting(true);
    setRestTimeLeft(currentExercise.rest_time || 60);
    playStartSound();
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
    const isTimerEx = ['hiit', 'amrap', 'emom'].includes(currentExercise.exercise_type);
    
    if (!isTimerEx && completedSets === 0) {
      Alert.alert('Marca al menos una serie');
      return;
    }

    try {
      await logExercise(
        sessionId,
        currentExercise.id,
        completedSets || 1,
        completedReps || 0,
        ''
      );
      setExerciseLogged(true);

      if (currentExerciseIndex < exercises.length - 1) {
        setTimeout(() => goToNextExercise(), 500);
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
    setExerciseLogged(false);
    resetTimer();
  }

  async function handleFinishSession() {
    try {
      await finishTrainingSession(sessionId);
      const duration = Math.floor((new Date() - sessionStartTime) / 1000 / 60);
      Alert.alert(
        'Entrenamiento completado',
        `Duración: ${duration} min\nEjercicios: ${exercises.length}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      navigation.goBack();
    }
  }

  function handleQuit() {
    Alert.alert(
      'Salir del entrenamiento',
      '¿Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: () => navigation.goBack() }
      ]
    );
  }

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay ejercicios</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuit}>
          <Text style={styles.quitText}>Salir</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{routine.name}</Text>
        <Text style={styles.progress}>{currentExerciseIndex + 1}/{exercises.length}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Card del ejercicio principal */}
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          
          <ScrollView style={styles.descriptionScroll} nestedScrollEnabled>
            <Text style={styles.exerciseDescription}>{currentExercise.description}</Text>
          </ScrollView>

          {currentExercise.notes && (
            <Text style={styles.exerciseNotes}>{currentExercise.notes}</Text>
          )}

          {currentExercise.exercise_type === 'standard' && (
            <>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Series:</Text>
                <Text style={styles.targetValue}>{currentExercise.sets}</Text>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Reps:</Text>
                <Text style={styles.targetValue}>{currentExercise.reps}</Text>
              </View>
            </>
          )}

          {currentExercise.exercise_type === 'hiit' && (
            <View style={styles.hiitInfo}>
              <Text style={styles.metaText}>Trabajo: {currentExercise.hiit_work_time}s</Text>
              <Text style={styles.metaText}>Descanso: {currentExercise.hiit_rest_time}s</Text>
              <Text style={styles.metaText}>Rondas: {currentExercise.hiit_rounds}</Text>
            </View>
          )}

          {currentExercise.exercise_type === 'amrap' && (
            <Text style={styles.metaText}>AMRAP {Math.floor(currentExercise.amrap_duration / 60)} min</Text>
          )}

          {currentExercise.exercise_type === 'emom' && (
            <Text style={styles.metaText}>EMOM {Math.floor(currentExercise.emom_duration / 60)} min</Text>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════
            NUEVO: Card del ejercicio actual del circuito
            ══════════════════════════════════════════════════════════════ */}
        {isTimerExercise && hasCircuitExercises && (
          <View style={styles.circuitCard}>
            <View style={styles.circuitHeader}>
              <Text style={styles.circuitLabel}>
                {currentExercise.exercise_type === 'emom' 
                  ? `MINUTO ${currentRound}` 
                  : currentExercise.exercise_type === 'hiit'
                    ? `RONDA ${currentRound}`
                    : `EJERCICIO ${currentCircuitIndex + 1}/${circuitExercises.length}`}
              </Text>
              {currentExercise.exercise_type === 'amrap' && (
                <Text style={styles.roundsCount}>{completedRounds} rondas</Text>
              )}
            </View>

            <Text style={styles.circuitExerciseName}>
              {currentCircuitExercise?.name || 'Ejercicio'}
            </Text>

            {currentCircuitExercise?.reps && (
              <Text style={styles.circuitReps}>{currentCircuitExercise.reps} reps</Text>
            )}

            {currentCircuitExercise?.description && (
              <Text style={styles.circuitDescription}>{currentCircuitExercise.description}</Text>
            )}

            {currentCircuitExercise?.tips && (
              <Text style={styles.circuitTips}>{currentCircuitExercise.tips}</Text>
            )}

            {/* Lista de todos los ejercicios del circuito */}
            <View style={styles.circuitList}>
              <Text style={styles.circuitListTitle}>CIRCUITO COMPLETO:</Text>
              {circuitExercises.map((ex, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.circuitListItem,
                    index === currentCircuitIndex && styles.circuitListItemActive
                  ]}
                >
                  <Text style={[
                    styles.circuitListNumber,
                    index === currentCircuitIndex && styles.circuitListTextActive
                  ]}>
                    {index + 1}.
                  </Text>
                  <Text style={[
                    styles.circuitListName,
                    index === currentCircuitIndex && styles.circuitListTextActive
                  ]}>
                    {ex.name}
                  </Text>
                  {ex.reps && (
                    <Text style={[
                      styles.circuitListReps,
                      index === currentCircuitIndex && styles.circuitListTextActive
                    ]}>
                      {ex.reps}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Botón para avanzar manualmente en AMRAP */}
            {currentExercise.exercise_type === 'amrap' && timerActive && (
              <TouchableOpacity style={styles.nextExerciseButton} onPress={nextCircuitExercise}>
                <Text style={styles.nextExerciseButtonText}>
                  {currentCircuitIndex === circuitExercises.length - 1 
                    ? 'Ronda completada' 
                    : 'Siguiente ejercicio'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Timer para HIIT/AMRAP/EMOM */}
        {isTimerExercise && (
          <View style={styles.timerSection}>
            <View style={styles.timerDisplay}>
              {currentExercise.exercise_type === 'hiit' && (
                <>
                  <Text style={[styles.timerPhase, isWorkPhase ? styles.timerPhaseWork : styles.timerPhaseRest]}>
                    {isWorkPhase ? 'TRABAJO' : 'DESCANSO'}
                  </Text>
                  <Text style={styles.timerTime}>
                    {formatTime(isWorkPhase 
                      ? currentExercise.hiit_work_time - timerSeconds 
                      : currentExercise.hiit_rest_time - timerSeconds
                    )}
                  </Text>
                  <Text style={styles.timerRound}>Ronda {currentRound} / {currentExercise.hiit_rounds}</Text>
                </>
              )}

              {currentExercise.exercise_type === 'amrap' && (
                <>
                  <Text style={styles.timerPhase}>AMRAP</Text>
                  <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
                  <Text style={styles.timerRound}>
                    de {Math.floor(currentExercise.amrap_duration / 60)} min | {completedRounds} rondas
                  </Text>
                </>
              )}

              {currentExercise.exercise_type === 'emom' && (
                <>
                  <Text style={styles.timerPhase}>EMOM</Text>
                  <Text style={styles.timerTime}>{formatTime(60 - (timerSeconds % 60))}</Text>
                  <Text style={styles.timerRound}>
                    Minuto {Math.floor(timerSeconds / 60) + 1} / {Math.floor(currentExercise.emom_duration / 60)}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.timerControls}>
              {!timerActive ? (
                <TouchableOpacity style={[styles.timerButton, styles.timerButtonPrimary]} onPress={startTimer}>
                  <Text style={styles.timerButtonTextPrimary}>
                    {timerSeconds > 0 ? 'Continuar' : 'Iniciar'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.timerButton, styles.timerButtonSecondary]} onPress={pauseTimer}>
                  <Text style={styles.timerButtonTextSecondary}>
                    {isPaused ? 'Reanudar' : 'Pausar'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={[styles.timerButton, styles.timerButtonSecondary]} onPress={resetTimer}>
                <Text style={styles.timerButtonTextSecondary}>Reiniciar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteExercise}>
              <Text style={styles.completeButtonText}>
                {currentExerciseIndex === exercises.length - 1 ? 'Finalizar' : 'Siguiente ejercicio'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ejercicio standard */}
        {currentExercise.exercise_type === 'standard' && (
          <>
            {isResting && (
              <View style={styles.restCard}>
                <Text style={styles.restTitle}>Descansando</Text>
                <Text style={styles.restTimer}>{restTimeLeft}s</Text>
                <View style={styles.restButtons}>
                  <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                    <Text style={styles.pauseButtonText}>{isPaused ? 'Reanudar' : 'Pausar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
                    <Text style={styles.skipButtonText}>Saltar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.setsSection}>
              <Text style={styles.setsTitle}>Series completadas</Text>
              <View style={styles.setsCounter}>
                <TouchableOpacity style={styles.counterButton} onPress={removeSet}>
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.setsValue}>{completedSets} / {currentExercise.sets}</Text>
                <TouchableOpacity style={styles.counterButton} onPress={addSet}>
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              
              {completedSets > 0 && completedSets < currentExercise.sets && !isResting && (
                <TouchableOpacity style={styles.restButton} onPress={startRestTimer}>
                  <Text style={styles.restButtonText}>Descanso ({currentExercise.rest_time}s)</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.completeButton, completedSets === 0 && styles.completeButtonDisabled]}
              onPress={handleCompleteExercise}
              disabled={completedSets === 0}
            >
              <Text style={styles.completeButtonText}>
                {currentExerciseIndex === exercises.length - 1 ? 'Finalizar' : 'Siguiente'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  quitText: { color: '#666666', fontSize: 16 },
  headerTitle: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  progress: { color: '#666666', fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  
  exerciseCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  exerciseName: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  descriptionScroll: { maxHeight: 100, marginBottom: 12 },
  exerciseDescription: { fontSize: 14, color: '#888888', lineHeight: 20 },
  exerciseNotes: { fontSize: 13, color: '#666666', fontStyle: 'italic', marginTop: 8 },
  targetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  targetLabel: { fontSize: 14, color: '#888888', marginRight: 8 },
  targetValue: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  hiitInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 13, color: '#888888', fontWeight: '600' },

  // ══════════════════════════════════════════════════════════════
  // NUEVOS ESTILOS PARA CIRCUIT_EXERCISES
  // ══════════════════════════════════════════════════════════════
  circuitCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  circuitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  circuitLabel: { fontSize: 12, fontWeight: '700', color: '#666666', letterSpacing: 1 },
  roundsCount: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  circuitExerciseName: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  circuitReps: { fontSize: 24, fontWeight: '700', color: '#888888', marginBottom: 12 },
  circuitDescription: { fontSize: 14, color: '#666666', lineHeight: 20, marginBottom: 8 },
  circuitTips: { fontSize: 13, color: '#888888', fontStyle: 'italic', marginBottom: 16 },
  
  circuitList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  circuitListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 12,
  },
  circuitListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  circuitListItemActive: { backgroundColor: '#ffffff' },
  circuitListNumber: { fontSize: 14, fontWeight: '600', color: '#666666', width: 24 },
  circuitListName: { flex: 1, fontSize: 14, color: '#888888' },
  circuitListReps: { fontSize: 13, color: '#666666' },
  circuitListTextActive: { color: '#000000', fontWeight: '600' },
  
  nextExerciseButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  nextExerciseButtonText: { fontSize: 15, fontWeight: '600', color: '#000000' },

  // Timer
  timerSection: { marginBottom: 20 },
  timerDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerPhase: { fontSize: 12, fontWeight: '700', color: '#888888', letterSpacing: 1, marginBottom: 12 },
  timerPhaseWork: { color: '#ffffff' },
  timerPhaseRest: { color: '#666666' },
  timerTime: { fontSize: 56, fontWeight: '700', color: '#ffffff' },
  timerRound: { fontSize: 14, color: '#666666', marginTop: 8 },
  timerControls: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  timerButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  timerButtonPrimary: { backgroundColor: '#ffffff' },
  timerButtonSecondary: { backgroundColor: '#1a1a1a' },
  timerButtonTextPrimary: { fontSize: 15, fontWeight: '600', color: '#000000' },
  timerButtonTextSecondary: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  
  completeButton: { backgroundColor: '#ffffff', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  completeButtonDisabled: { backgroundColor: '#333333' },
  completeButtonText: { fontSize: 16, fontWeight: '600', color: '#000000' },

  // Rest & Sets
  restCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
  restTitle: { fontSize: 14, color: '#888888', fontWeight: '600', marginBottom: 8 },
  restTimer: { fontSize: 48, fontWeight: '700', color: '#ffffff', marginBottom: 16 },
  restButtons: { flexDirection: 'row', gap: 12 },
  pauseButton: { backgroundColor: '#2a2a2a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  pauseButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  skipButton: { backgroundColor: '#333333', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  skipButtonText: { color: '#888888', fontSize: 14, fontWeight: '600' },
  
  setsSection: { alignItems: 'center', marginBottom: 20 },
  setsTitle: { fontSize: 14, color: '#888888', fontWeight: '600', marginBottom: 16 },
  setsCounter: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 },
  counterButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  counterButtonText: { fontSize: 24, fontWeight: '600', color: '#ffffff' },
  setsValue: { fontSize: 32, fontWeight: '700', color: '#ffffff', minWidth: 80, textAlign: 'center' },
  restButton: { backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  restButtonText: { color: '#888888', fontSize: 14, fontWeight: '600' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#888888', textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#000000' },
});