import api from './client';

// Obtener comidas de hoy con totales
export async function getTodayFood() {
  const res = await api.get('/api/food/today');
  return res.data;
}

// Obtener historial (últimos 7 días)
export async function getFoodHistory() {
  const res = await api.get('/api/food/history');
  return res.data;
}

// Registrar comida
export async function logFood(foodData) {
  const res = await api.post('/api/food', foodData);
  return res.data;
}

// Eliminar comida
export async function deleteFood(foodId) {
  const res = await api.delete(`/api/food/${foodId}`);
  return res.data;
}

// Analizar imagen de comida con IA
export async function analyzeFood(imageBase64) {
  const res = await api.post('/api/food/analyze', { image: imageBase64 });
  return res.data;
}