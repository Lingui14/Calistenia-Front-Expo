import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken } from './client';

export async function register(email, password) {
  const res = await api.post('/api/auth/register', { email, password });
  const token = res.data.token;

  setAuthToken(token);
  await AsyncStorage.setItem('token', token);

  return token;
}

export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password });
  const token = res.data.token;

  setAuthToken(token);
  await AsyncStorage.setItem('token', token);

  return token;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
  setAuthToken(null);
}