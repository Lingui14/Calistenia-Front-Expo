import api from './client';

/**
 * Inicia una nueva sesión de entrenamiento
 */
export async function startTrainingSession(routineId) {
  const response = await api.post('/api/training/start', { routineId });
  return response.data;
}

/**
 * Registra un ejercicio completado durante la sesión
 */
export async function logExercise(sessionId, exerciseId, completedSets, completedReps, notes = '') {
  const response = await api.post('/api/training/log', {
    sessionId,
    exerciseId,
    completedSets,
    completedReps,
    notes,
  });
  return response.data;
}

/**
 * Finaliza la sesión de entrenamiento
 */
export async function finishTrainingSession(sessionId) {
  const response = await api.post('/api/training/finish', { sessionId });
  return response.data;
}

/**
 * Obtiene el historial de sesiones del usuario
 */
export async function getTrainingHistory() {
  const response = await api.get('/api/training/history');
  return response.data;
}