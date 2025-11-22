// src/hooks/useHealthData.js
// Versión placeholder - Health Connect deshabilitado por ahora

export default function useHealthData() {
  return {
    steps: 0,
    distance: 0,
    calories: 0,
    isAvailable: false,
    hasPermissions: false,
    loading: false,
    error: null,
    refresh: () => {},
  };
}