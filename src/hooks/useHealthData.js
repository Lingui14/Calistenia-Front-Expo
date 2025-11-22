// src/hooks/useHealthData.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export default function useHealthData(date = new Date()) {
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      initAndroid();
    } else {
      // iOS no soportado por ahora, o agregar react-native-health
      setLoading(false);
      setIsAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermissions) {
      fetchHealthData();
    }
  }, [hasPermissions, date]);

  async function initAndroid() {
    try {
      setLoading(true);
      
      const HealthConnect = require('react-native-health-connect');
      const isInitialized = await HealthConnect.initialize();

      if (!isInitialized) {
        setError('Health Connect no disponible');
        setIsAvailable(false);
        setLoading(false);
        return;
      }

      setIsAvailable(true);

      // Solicitar permisos
      const grantedPermissions = await HealthConnect.requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      ]);

      const hasSteps = grantedPermissions.some(
        (p) => p.recordType === 'Steps' && p.accessType === 'read'
      );

      setHasPermissions(hasSteps);

      if (!hasSteps) {
        setError('Permisos denegados');
      }
    } catch (err) {
      console.error('Error inicializando Health Connect:', err);
      setError(err.message);
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHealthData() {
    if (Platform.OS !== 'android') return;

    try {
      const HealthConnect = require('react-native-health-connect');

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const timeRangeFilter = {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
      };

      // Pasos
      const stepsResult = await HealthConnect.readRecords('Steps', { timeRangeFilter });
      const totalSteps = stepsResult.records.reduce((sum, r) => sum + r.count, 0);
      setSteps(totalSteps);

      // Distancia
      const distanceResult = await HealthConnect.readRecords('Distance', { timeRangeFilter });
      const totalDistance = distanceResult.records.reduce(
        (sum, r) => sum + (r.distance?.inMeters || 0),
        0
      );
      setDistance(Math.round(totalDistance));

      // Calorías
      const caloriesResult = await HealthConnect.readRecords('TotalCaloriesBurned', { timeRangeFilter });
      const totalCalories = caloriesResult.records.reduce(
        (sum, r) => sum + (r.energy?.inKilocalories || 0),
        0
      );
      setCalories(Math.round(totalCalories));

    } catch (err) {
      console.error('Error leyendo Health Connect:', err);
    }
  }

  async function refresh() {
    setLoading(true);
    await fetchHealthData();
    setLoading(false);
  }

  return {
    steps,
    distance,
    calories,
    isAvailable,
    hasPermissions,
    loading,
    error,
    refresh,
  };
}