import api from './client';

export async function getTodayActivity() {
  const res = await api.get('/api/activity/today');
  return res.data;
}

export async function updateActivity(data) {
  const res = await api.put('/api/activity/today', data);
  return res.data;
}

export async function updateGoals(goals) {
  const res = await api.put('/api/activity/goals', goals);
  return res.data;
}

export async function getActivityHistory() {
  const res = await api.get('/api/activity/history');
  return res.data;
}