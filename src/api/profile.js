//src/api/profile.js
import api from './client';

export async function getProfile() {
  const { data } = await api.get('/api/profile/me');
  return data;
}

export async function saveOnboardingProfile(profileData) {
  const { data } = await api.put('/api/profile/me', profileData);
  return data;
}