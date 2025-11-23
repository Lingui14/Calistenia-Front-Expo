// src/components/WorkoutTimer.js (NUEVO)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';

export default function WorkoutTimer({ exercise, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('work'); // work, rest, complete
  const [currentRound, setCurrentRound] = useState(1);
  const [repsCompleted, setRepsCompleted] = useState(0);
  
  const timerRef = useRef(null);
  const totalRounds = exercise.hiit_rounds || 1;

  useEffect(() => {
    // Inicializar según tipo de ejercicio
    if (exercise.exercise_type === 'amrap') {
      setTimeLeft(exercise.amrap_duration);
    } else if (exercise.exercise_type === 'hiit') {
      setTimeLeft(exercise.hiit_work_time);
    }
  }, [exercise]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, currentPhase]);

  function handlePhaseComplete() {
    Vibration.vibrate(500);

    if (exercise.exercise_type === 'hiit') {
      if (currentPhase === 'work') {
        // Cambiar a descanso
        setCurrentPhase('rest');
        setTimeLeft(exercise.hiit_rest_time);
      } else if (currentPhase === 'rest') {
        if (currentRound < totalRounds) {
          // Siguiente ronda
          setCurrentRound(prev => prev + 1);
          setCurrentPhase('work');
          setTimeLeft(exercise.hiit_work_time);
        } else {
          // Completado
          setCurrentPhase('complete');
          setIsRunning(false);
          onComplete?.({ repsCompleted, rounds: totalRounds });
        }
      }
    } else if (exercise.exercise_type === 'amrap') {
      // AMRAP completado
      setCurrentPhase('complete');
      setIsRunning(false);
      onComplete?.({ repsCompleted, rounds: Math.floor(repsCompleted / exercise.reps) });
    }
  }

  function toggleTimer() {
    setIsRunning(prev => !prev);
  }

  function addRep() {
    setRepsCompleted(prev => prev + 1);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (currentPhase === 'complete') {
    return (
      <View style={styles.container}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>¡Ejercicio completado!</Text>
        <Text style={styles.completeStats}>
          {exercise.exercise_type === 'amrap' 
            ? `${repsCompleted} reps totales`
            : `${totalRounds} rondas completadas`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Indicador de fase para HIIT */}
      {exercise.exercise_type === 'hiit' && (
        <View style={styles.phaseIndicator}>
          <Text style={[
            styles.phaseText,
            currentPhase === 'work' ? styles.phaseWork : styles.phaseRest
          ]}>
            {currentPhase === 'work' ? '💪 TRABAJO' : '😮‍💨 DESCANSO'}
          </Text>
          <Text style={styles.roundText}>
            Ronda {currentRound} / {totalRounds}
          </Text>
        </View>
      )}

      {/* Timer principal */}
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      {/* Contador de reps (para AMRAP) */}
      {exercise.exercise_type === 'amrap' && (
        <View style={styles.repsSection}>
          <Text style={styles.repsLabel}>Repeticiones</Text>
          <View style={styles.repsCounter}>
            <Text style={styles.repsValue}>{repsCompleted}</Text>
            <TouchableOpacity style={styles.addRepButton} onPress={addRep}>
              <Text style={styles.addRepText}>+1</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isRunning && styles.controlButtonPause]}
          onPress={toggleTimer}
        >
          <Text style={styles.controlButtonText}>
            {isRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instrucciones */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          {exercise.notes || exercise.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  phaseIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  phaseWork: {
    color: '#22c55e',
  },
  phaseRest: {
    color: '#f59e0b',
  },
  roundText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#22c55e',
    marginVertical: 24,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#ffffff',
  },
  repsSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  repsLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  repsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  repsValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    minWidth: 100,
    textAlign: 'center',
  },
  addRepButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addRepText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#022c22',
  },
  controls: {
    width: '100%',
    marginBottom: 24,
  },
  controlButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  controlButtonPause: {
    backgroundColor: '#f59e0b',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#022c22',
  },
  instructions: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  instructionsText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    textAlign: 'center',
  },
  completeEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  completeStats: {
    fontSize: 18,
    color: '#22c55e',
  },
});