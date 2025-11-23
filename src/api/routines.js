// src/api/routines.js (ACTUALIZADO)
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
 */
export async function createRoutine(routineData) {
  const res = await api.post('/api/routines', routineData);
  return res.data;
}

/**
 * Actualiza una rutina existente
 */
export async function updateRoutine(routineId, routineData) {
  const res = await api.put(`/api/routines/${routineId}`, routineData);
  return res.data;
}

/**
 * Elimina una rutina
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
 * NUEVO: Genera una rutina con IA de Grok
 */
export async function generateRoutineAI(params = {}) {
  const res = await api.post('/api/routines/generate-ai', {
    customPrompt: params.customPrompt,
    workoutType: params.workoutType,
    duration: params.duration,
    intensity: params.intensity,
  });
  return res.data;
}

/**
 * NUEVO: Obtiene sugerencias rápidas
 */
export async function getAISuggestions() {
  const res = await api.get('/api/routines/ai-suggestions');
  return res.data;
}

/**
 * Marca/desmarca una rutina como favorita
 */
export async function toggleFavorite(routineId) {
  const res = await api.post(`/api/routines/${routineId}/favorite`);
  return res.data;
}