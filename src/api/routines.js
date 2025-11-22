import api from './client';

/**
 * Obtiene todas las rutinas del usuario
 */
export async function getMyRoutines() {
  const res = await api.get('/api/routines');
  return res.data;
}

/**
 * Obtiene la rutina activa (la más reciente)
 */
export async function getActiveRoutine() {
  const res = await api.get('/api/routines/active');
  return res.data;
}

/**
 * Crea una nueva rutina personalizada
 * @param {Object} routineData - { name, description, difficulty_level, exercises }
 * @param {Array} routineData.exercises - [{ name, sets, reps, rest_time }]
 */
export async function createRoutine(routineData) {
  const res = await api.post('/api/routines', routineData);
  return res.data;
}

/**
 * Actualiza una rutina existente
 * @param {string} routineId - ID de la rutina
 * @param {Object} routineData - Datos a actualizar
 */
export async function updateRoutine(routineId, routineData) {
  const res = await api.put(`/api/routines/${routineId}`, routineData);
  return res.data;
}

/**
 * Elimina una rutina
 * @param {string} routineId - ID de la rutina a eliminar
 */
export async function deleteRoutine(routineId) {
  const res = await api.delete(`/api/routines/${routineId}`);
  return res.data;
}

/**
 * Genera una rutina automática (IA MVP)
 */
export async function generateRoutine() {
  const res = await api.post('/api/routines/generate');
  return res.data;
}

/**
 * Marca/desmarca una rutina como favorita
 * @param {string} routineId - ID de la rutina
 */
export async function toggleFavorite(routineId) {
  const res = await api.post(`/api/routines/${routineId}/favorite`);
  return res.data;
}