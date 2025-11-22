// src/screens/ProgressScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getTrainingHistory } from '../api/training';
import useHealthData from '../hooks/useHealthData';
import { Ionicons } from '@expo/vector-icons';

// Componente de anillo de progreso
function ProgressRing({ progress, color, size = 80, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = Math.min(progress, 1);
  const strokeDashoffset = circumference - progressValue * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#1f2937"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export default function ProgressScreen() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    totalExercises: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Metas de actividad (podrías moverlas a un estado editable)
  const GOALS = {
    steps: 10000,
    calories: 500,
    distance: 5000, // metros
  };

  // Hook de Health Connect
  const {
    steps: healthSteps,
    distance: healthDistance,
    calories: healthCalories,
    isAvailable: healthAvailable,
    hasPermissions: healthPermissions,
    loading: healthLoading,
    error: healthError,
    refresh: refreshHealth,
  } = useHealthData();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await getTrainingHistory();
      setHistory(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadHistory(), refreshHealth()]);
    } catch (err) {
      console.error('Error refrescando:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshHealth]);

  function calculateStats(sessions) {
    if (!sessions || sessions.length === 0) {
      setStats({ totalSessions: 0, totalMinutes: 0, totalExercises: 0, currentStreak: 0 });
      return;
    }

    const completedSessions = sessions.filter((s) => s.completed);
    const totalSessions = completedSessions.length;
    const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.total_duration || 0), 0);
    const totalExercises = completedSessions.reduce(
      (acc, s) => acc + (s.ExerciseLogs?.length || 0),
      0
    );
    const currentStreak = calculateStreak(completedSessions);

    setStats({ totalSessions, totalMinutes, totalExercises, currentStreak });
  }

  function calculateStreak(sessions) {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.start_time) - new Date(a.start_time)
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('es-MX', options);
  }

  function formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Cargando progreso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calcular progreso de actividad
  const stepsProgress = healthSteps / GOALS.steps;
  const caloriesProgress = healthCalories / GOALS.calories;
  const distanceProgress = healthDistance / GOALS.distance;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22c55e"
            colors={['#22c55e']}
          />
        }
      >
        <Text style={styles.screenTitle}>Tu Progreso</Text>
        <Text style={styles.screenSubtitle}>
          Mantén la constancia y alcanza tus metas 💪
        </Text>

        {/* ==================== SECCIÓN DE ACTIVIDAD DIARIA ==================== */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad de hoy</Text>
            {healthAvailable && healthPermissions && (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>✓ Health Connect</Text>
              </View>
            )}
          </View>

          {healthAvailable && healthPermissions ? (
            <>
              {/* Anillos de progreso */}
              <View style={styles.ringsContainer}>
                <View style={styles.ringItem}>
                  <View style={styles.ringWrapper}>
                    <ProgressRing progress={stepsProgress} color="#22c55e" size={80} strokeWidth={8} />
                    <View style={styles.ringContent}>
                      <Text style={styles.ringEmoji}>👟</Text>
                    </View>
                  </View>
                  <Text style={styles.ringValue}>{healthSteps.toLocaleString()}</Text>
                  <Text style={styles.ringLabel}>/ {GOALS.steps.toLocaleString()}</Text>
                  <Text style={styles.ringTitle}>Pasos</Text>
                </View>

                <View style={styles.ringItem}>
                  <View style={styles.ringWrapper}>
                    <ProgressRing progress={caloriesProgress} color="#f97316" size={80} strokeWidth={8} />
                    <View style={styles.ringContent}>
                      <Text style={styles.ringEmoji}>🔥</Text>
                    </View>
                  </View>
                  <Text style={styles.ringValue}>{healthCalories}</Text>
                  <Text style={styles.ringLabel}>/ {GOALS.calories} kcal</Text>
                  <Text style={styles.ringTitle}>Calorías</Text>
                </View>

                <View style={styles.ringItem}>
                  <View style={styles.ringWrapper}>
                    <ProgressRing progress={distanceProgress} color="#3b82f6" size={80} strokeWidth={8} />
                    <View style={styles.ringContent}>
                      <Text style={styles.ringEmoji}>🚶</Text>
                    </View>
                  </View>
                  <Text style={styles.ringValue}>{(healthDistance / 1000).toFixed(1)}</Text>
                  <Text style={styles.ringLabel}>/ {GOALS.distance / 1000} km</Text>
                  <Text style={styles.ringTitle}>Distancia</Text>
                </View>
              </View>

              {/* Porcentajes */}
              <View style={styles.percentagesRow}>
                <Text style={[styles.percentageText, { color: '#22c55e' }]}>
                  {Math.round(stepsProgress * 100)}%
                </Text>
                <Text style={[styles.percentageText, { color: '#f97316' }]}>
                  {Math.round(caloriesProgress * 100)}%
                </Text>
                <Text style={[styles.percentageText, { color: '#3b82f6' }]}>
                  {Math.round(distanceProgress * 100)}%
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.connectHealthCard}
              onPress={() => {
                Alert.alert(
                  'Conectar Health Connect',
                  'Asegúrate de tener Health Connect instalado desde Play Store. Ve a Ajustes > Apps > Health Connect para configurarlo.',
                  [{ text: 'Entendido' }]
                );
              }}
            >
              <Text style={styles.connectHealthEmoji}>📱</Text>
              <View style={styles.connectHealthText}>
                <Text style={styles.connectHealthTitle}>Conectar Health Connect</Text>
                <Text style={styles.connectHealthSubtitle}>
                  {healthError || 'Sincroniza tus pasos y calorías automáticamente'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ==================== STATS DE ENTRENAMIENTOS ==================== */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          Estadísticas de entrenamiento
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Entrenamientos</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(stats.totalMinutes)}</Text>
            <Text style={styles.statLabel}>Tiempo total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalExercises}</Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </View>

          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={styles.streakValue}>🔥 {stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Racha actual</Text>
          </View>
        </View>

        {/* Mensaje motivacional */}
        {stats.currentStreak > 0 && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>
              {stats.currentStreak === 1
                ? '¡Buen comienzo! Sigue así mañana.'
                : stats.currentStreak < 7
                ? `¡${stats.currentStreak} días seguidos! Vas muy bien.`
                : `¡Increíble! ${stats.currentStreak} días de racha 🏆`}
            </Text>
          </View>
        )}

        {/* ==================== HISTORIAL ==================== */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de entrenamientos</Text>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#737373" />
              <Text style={styles.emptyTitle}>Aún no hay entrenamientos</Text>
              <Text style={styles.emptySubtitle}>
                Completa tu primera sesión para ver tu progreso aquí
              </Text>
            </View>
          ) : (
            history.map((session) => (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{formatDate(session.start_time)}</Text>
                  {session.completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓ Completado</Text>
                    </View>
                  ) : (
                    <View style={styles.incompleteBadge}>
                      <Text style={styles.incompleteBadgeText}>Incompleto</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.historyRoutineName}>
                  {session.Routine?.name || 'Rutina'}
                </Text>

                <View style={styles.historyStats}>
                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>
                      {formatDuration(session.total_duration || 0)}
                    </Text>
                    <Text style={styles.historyStatLabel}>Duración</Text>
                  </View>

                  <View style={styles.historyStatDivider} />

                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>
                      {session.ExerciseLogs?.length || 0}
                    </Text>
                    <Text style={styles.historyStatLabel}>Ejercicios</Text>
                  </View>

                  <View style={styles.historyStatDivider} />

                  <View style={styles.historyStat}>
                    <Text style={styles.historyStatValue}>
                      {session.ExerciseLogs?.reduce(
                        (acc, log) => acc + (log.completed_sets || 0),
                        0
                      ) || 0}
                    </Text>
                    <Text style={styles.historyStatLabel}>Series</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#a3a3a3',
    marginTop: 12,
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
    marginBottom: 24,
  },
  activitySection: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  connectedBadge: {
    backgroundColor: '#171717',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#404040',
  },
  connectedBadgeText: {
    color: '#d4d4d4',
    fontSize: 11,
    fontWeight: '600',
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ringItem: {
    alignItems: 'center',
  },
  ringWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringContent: {
    position: 'absolute',
  },
  ringEmoji: {
    fontSize: 20,
  },
  ringValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  ringLabel: {
    fontSize: 10,
    color: '#737373',
  },
  ringTitle: {
    fontSize: 11,
    color: '#a3a3a3',
    marginTop: 2,
  },
  percentagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d4d4d4',
  },
  connectHealthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  connectHealthEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  connectHealthText: {
    flex: 1,
  },
  connectHealthTitle: {
    color: '#d4d4d4',
    fontSize: 14,
    fontWeight: '600',
  },
  connectHealthSubtitle: {
    color: '#737373',
    fontSize: 12,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#0a0a0a',
    borderColor: '#404040',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  motivationCard: {
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  motivationText: {
    color: '#d4d4d4',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  historySection: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    color: '#a3a3a3',
  },
  completedBadge: {
    backgroundColor: '#171717',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#404040',
  },
  completedBadgeText: {
    color: '#d4d4d4',
    fontSize: 11,
    fontWeight: '600',
  },
  incompleteBadge: {
    backgroundColor: '#171717',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#404040',
  },
  incompleteBadgeText: {
    color: '#a3a3a3',
    fontSize: 11,
    fontWeight: '600',
  },
  historyRoutineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#171717',
    padding: 12,
    borderRadius: 12,
  },
  historyStat: {
    alignItems: 'center',
    flex: 1,
  },
  historyStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyStatLabel: {
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },
  historyStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#262626',
  },
});