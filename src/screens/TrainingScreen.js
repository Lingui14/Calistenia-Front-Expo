// src/screens/TrainingScreen.js (MANTENIENDO TODO EL CÓDIGO ORIGINAL, SOLO AGREGANDO AUDIO)
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
  Linking,
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
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  // Estados para cronómetros HIIT/AMRAP/EMOM
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);

  const timerRef = useRef(null);
  const workoutTimerRef = useRef(null);
  
  // Refs para sonidos
  const startSoundRef = useRef(null);
  const endSoundRef = useRef(null);

  const exercises = routine?.Exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const isTimerExercise = ['hiit', 'amrap', 'emom'].includes(currentExercise?.exercise_type);

  useEffect(() => {
    initSession();
    loadSpotifyPlaylists();
    checkSpotifyStatus();
    loadSounds();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      unloadSounds();
    };
  }, []);

  // Cargar sonidos
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
    } catch (err) {
      console.error('Error descargando sonidos:', err);
    }
  }

  async function playStartSound() {
    try {
      if (startSoundRef.current) {
        await startSoundRef.current.setPositionAsync(0);
        await startSoundRef.current.playAsync();
      }
    } catch (err) {
      console.error('Error reproduciendo start:', err);
    }
  }

  async function playEndSound() {
    try {
      if (endSoundRef.current) {
        await endSoundRef.current.setPositionAsync(0);
        await endSoundRef.current.playAsync();
      }
    } catch (err) {
      console.error('Error reproduciendo end:', err);
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
            playEndSound(); // Sonido al terminar descanso
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [isResting, restTimeLeft, isPaused]);

  // Timer para HIIT/AMRAP/EMOM
  useEffect(() => {
    if (timerActive && !isPaused) {
      workoutTimerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const newTime = prev + 1;
          
          // Lógica HIIT
          if (currentExercise.exercise_type === 'hiit') {
            const workTime = currentExercise.hiit_work_time;
            const restTime = currentExercise.hiit_rest_time;
            const totalRounds = currentExercise.hiit_rounds;
            
            if (isWorkPhase) {
              if (newTime >= workTime) {
                Vibration.vibrate(200);
                playStartSound(); // Sonido al cambiar de trabajo a descanso
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
                  playStartSound(); // Sonido al iniciar nueva ronda
                  setCurrentRound(prev => prev + 1);
                  setIsWorkPhase(true);
                  return 0;
                }
              }
            }
          }
          
          // Lógica AMRAP/EMOM
          if (currentExercise.exercise_type === 'amrap' || currentExercise.exercise_type === 'emom') {
            const duration = currentExercise.exercise_type === 'amrap' 
              ? currentExercise.amrap_duration 
              : currentExercise.emom_duration;
              
            if (newTime >= duration) {
              handleTimerComplete();
              return 0;
            }
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [timerActive, isPaused, isWorkPhase, currentRound, currentExercise]);

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
        setSpotifyPlaylists(res.data.playlists.slice(0, 3));
      }
    } catch (err) {
      setSpotifyPlaylists([]);
    }
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

  function handleTimerComplete() {
    setTimerActive(false);
    setTimerSeconds(0);
    setCurrentRound(1);
    setIsWorkPhase(true);
    Vibration.vibrate([0, 500, 200, 500]);
    playEndSound(); // Sonido al completar ejercicio
    
    Alert.alert(
      'Ejercicio completado',
      '¡Bien hecho! ¿Continuar con el siguiente?',
      [
        { text: 'Continuar', onPress: () => handleCompleteExercise() }
      ]
    );
  }

  function startTimer() {
    playStartSound(); // Sonido al iniciar timer
    setTimerActive(true);
    setTimerSeconds(0);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setIsPaused(false);
  }

  function pauseTimer() {
    setIsPaused(prev => !prev);
  }

  function resetTimer() {
    setTimerActive(false);
    setTimerSeconds(0);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setIsPaused(false);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    playStartSound(); // Sonido al iniciar descanso
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
    const isTimerExercise = ['hiit', 'amrap', 'emom'].includes(currentExercise.exercise_type);
    
    if (!isTimerExercise && completedSets === 0) {
      Alert.alert('Marca al menos una serie', 'Debes completar al menos 1 serie antes de continuar');
      return;
    }

    try {
      await logExercise(
        sessionId,
        currentExercise.id,
        completedSets || 1,
        completedReps || (currentExercise.reps * completedSets) || 0,
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
      navigation.goBack();
    }
  }

  function handleQuit() {
    Alert.alert(
      'Salir del entrenamiento',
      '¿Seguro que quieres salir? Tu progreso se guardará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  }

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay ejercicios en esta rutina</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleQuit}>
            <Text style={styles.quitText}>✕ Salir</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{routine.name}</Text>
          <Text style={styles.progressIndicator}>
            {currentExerciseIndex + 1}/{exercises.length}
          </Text>
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

        {/* Info del ejercicio - CON MEJOR VISUALIZACIÓN */}
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseTitle}>{currentExercise.name}</Text>
          
          {/* DESCRIPCIÓN MEJORADA - Scrollable para ejercicios largos */}
          {currentExercise.description && (
            <ScrollView 
              style={styles.descriptionScroll} 
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.exerciseDescription}>
                {currentExercise.description}
              </Text>
            </ScrollView>
          )}

          {currentExercise.notes && (
            <Text style={styles.exerciseNotes}>💡 {currentExercise.notes}</Text>
          )}

          {/* Info según tipo */}
          {currentExercise.exercise_type === 'standard' && (
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>Objetivo:</Text>
              <Text style={styles.targetValue}>
                {currentExercise.sets} series × {currentExercise.reps} reps
              </Text>
              <Text style={styles.restInfo}> • {currentExercise.rest_time}s descanso</Text>
            </View>
          )}

          {currentExercise.exercise_type === 'hiit' && (
            <View style={styles.hiitInfo}>
              <Text style={styles.metaText}>Trabajo: {currentExercise.hiit_work_time}s</Text>
              <Text style={styles.metaText}>Descanso: {currentExercise.hiit_rest_time}s</Text>
              <Text style={styles.metaText}>Rondas: {currentExercise.hiit_rounds}</Text>
            </View>
          )}

          {currentExercise.exercise_type === 'amrap' && (
            <Text style={styles.metaText}>
              AMRAP {Math.floor(currentExercise.amrap_duration / 60)} minutos
            </Text>
          )}

          {currentExercise.exercise_type === 'emom' && (
            <Text style={styles.metaText}>
              EMOM {Math.floor(currentExercise.emom_duration / 60)} minutos
            </Text>
          )}

          {exerciseLogged && (
            <View style={styles.loggedBadge}>
              <Text style={styles.loggedBadgeText}>✓ Guardado</Text>
            </View>
          )}
        </View>

        {/* CRONÓMETRO HIIT/AMRAP/EMOM */}
        {isTimerExercise && (
          <View style={styles.timerSection}>
            <View style={styles.timerDisplay}>
              {currentExercise.exercise_type === 'hiit' && (
                <>
                  <Text style={styles.timerPhase}>
                    {isWorkPhase ? 'TRABAJO' : 'DESCANSO'}
                  </Text>
                  <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
                  <Text style={styles.timerRound}>
                    Ronda {currentRound} / {currentExercise.hiit_rounds}
                  </Text>
                </>
              )}

              {(currentExercise.exercise_type === 'amrap' || currentExercise.exercise_type === 'emom') && (
                <>
                  <Text style={styles.timerPhase}>
                    {currentExercise.exercise_type.toUpperCase()}
                  </Text>
                  <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
                  <Text style={styles.timerRound}>
                    de {Math.floor((currentExercise.exercise_type === 'amrap' ? currentExercise.amrap_duration : currentExercise.emom_duration) / 60)} min
                  </Text>
                </>
              )}
            </View>

            <View style={styles.timerControls}>
              {!timerActive ? (
                <TouchableOpacity
                  style={[styles.timerButton, styles.timerButtonPrimary]}
                  onPress={startTimer}
                >
                  <Text style={styles.timerButtonTextPrimary}>
                    {timerSeconds > 0 ? 'Continuar' : 'Iniciar'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.timerButton, styles.timerButtonSecondary]}
                  onPress={pauseTimer}
                >
                  <Text style={styles.timerButtonTextSecondary}>
                    {isPaused ? 'Reanudar' : 'Pausar'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.timerButton, styles.timerButtonSecondary]}
                onPress={resetTimer}
              >
                <Text style={styles.timerButtonTextSecondary}>Reiniciar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteExercise}
            >
              <Text style={styles.completeButtonText}>
                {currentExerciseIndex === exercises.length - 1
                  ? 'Finalizar entrenamiento'
                  : 'Siguiente ejercicio'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EJERCICIO STANDARD */}
        {currentExercise.exercise_type === 'standard' && (
          <>
            {/* Timer de descanso */}
            {isResting && (
              <View style={styles.restCard}>
                <Text style={styles.restTitle}>Descansando</Text>
                <Text style={styles.restTimer}>{restTimeLeft}s</Text>
                <View style={styles.restButtons}>
                  <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
                    <Text style={styles.pauseButtonText}>
                      {isPaused ? 'Reanudar' : 'Pausar'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
                    <Text style={styles.skipButtonText}>Saltar</Text>
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

            {/* Contador de reps */}
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
                <Text style={styles.restTimerButtonText}>Iniciar descanso</Text>
              </TouchableOpacity>

              {exerciseLogged && currentExerciseIndex < exercises.length - 1 ? (
                <TouchableOpacity style={styles.nextButton} onPress={goToNextExercise}>
                  <Text style={styles.nextButtonText}>Siguiente ejercicio</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteExercise}>
                  <Text style={styles.completeButtonText}>
                    {currentExerciseIndex === exercises.length - 1
                      ? 'Finalizar entrenamiento'
                      : 'Completar ejercicio'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

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
                  {ex.exercise_type === 'hiit'
                    ? `HIIT ${ex.hiit_rounds}r`
                    : ex.exercise_type === 'amrap'
                    ? `AMRAP ${Math.floor(ex.amrap_duration / 60)}m`
                    : ex.exercise_type === 'emom'
                    ? `EMOM ${Math.floor(ex.emom_duration / 60)}m`
                    : `${ex.sets}×${ex.reps}`}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Playlists */}
        {spotifyPlaylists.length > 0 && (
          <View style={styles.spotifySection}>
            <Text style={styles.spotifyTitle}>Música recomendada</Text>
            {spotifyPlaylists.map((pl, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.playlistItem}
                onPress={() => Linking.openURL(pl.external_url)}
              >
                <Text style={styles.playlistName}>{pl.name}</Text>
              </TouchableOpacity>
            ))}
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  progressIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  exerciseCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  // NUEVO: Scroll para descripciones largas
  descriptionScroll: {
    maxHeight: 200,
    marginBottom: 12,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
  },
  exerciseNotes: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 14,
    color: '#888888',
    marginRight: 8,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  restInfo: {
    fontSize: 13,
    color: '#666666',
  },
  hiitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
  },
  loggedBadge: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  loggedBadgeText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  timerSection: {
    marginBottom: 20,
  },
  timerDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerPhase: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 1,
    marginBottom: 12,
  },
  timerTime: {
    fontSize: 56,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -2,
  },
  timerRound: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  timerButtonPrimary: {
    backgroundColor: '#ffffff',
  },
  timerButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
  },
  timerButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  timerButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  restCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  restTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  restButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  counterSection: {
    marginBottom: 20,
  },
  counterLabel: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 12,
    fontWeight: '600',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  counterButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginHorizontal: 32,
    minWidth: 80,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  restTimerButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  restTimerButtonDisabled: {
    backgroundColor: '#0a0a0a',
    opacity: 0.5,
  },
  restTimerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#333333',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  upcomingSection: {
    marginTop: 8,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  upcomingNumber: {
    fontSize: 13,
    color: '#666666',
    width: 24,
  },
  upcomingName: {
    flex: 1,
    fontSize: 14,
    color: '#888888',
  },
  upcomingDetail: {
    fontSize: 13,
    color: '#666666',
  },
  spotifySection: {
    marginTop: 20,
  },
  spotifyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  playlistItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistName: {
    fontSize: 14,
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});