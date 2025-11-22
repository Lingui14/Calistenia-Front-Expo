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
} from 'react-native';
import { getTrainingHistory } from '../api/training';

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
      const data = await getTrainingHistory();
      setHistory(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error refrescando:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  function calculateStats(sessions) {
    if (!sessions || sessions.length === 0) {
      setStats({
        totalSessions: 0,
        totalMinutes: 0,
        totalExercises: 0,
        currentStreak: 0,
      });
      return;
    }

    // Total de sesiones completadas
    const completedSessions = sessions.filter(s => s.completed);
    const totalSessions = completedSessions.length;

    // Total de minutos
    const totalMinutes = completedSessions.reduce((acc, s) => {
      return acc + (s.total_duration || 0);
    }, 0);

    // Total de ejercicios (sumando los logs de cada sesión)
    const totalExercises = completedSessions.reduce((acc, s) => {
      return acc + (s.ExerciseLogs?.length || 0);
    }, 0);

    // Calcular racha actual
    const currentStreak = calculateStreak(completedSessions);

    setStats({
      totalSessions,
      totalMinutes,
      totalExercises,
      currentStreak,
    });
  }

  function calculateStreak(sessions) {
    if (sessions.length === 0) return 0;

    // Ordenar por fecha descendente
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.end_time || b.start_time) - new Date(a.end_time || a.start_time)
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sorted) {
      const sessionDate = new Date(session.end_time || session.start_time);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = sessionDate;
      } else if (diffDays > 1) {
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
    if (!minutes || minutes === 0) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
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

        {/* Stats Cards */}
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

        {/* Motivational Message */}
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

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de entrenamientos</Text>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyTitle}>Aún no hay entrenamientos</Text>
              <Text style={styles.emptySubtitle}>
                Completa tu primera sesión para ver tu progreso aquí
              </Text>
            </View>
          ) : (
            history.map((session) => (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {formatDate(session.start_time)}
                  </Text>
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
    backgroundColor: '#020617',
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
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 24,
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
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#1c1917',
    borderColor: '#f97316',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f97316',
  },
  motivationCard: {
    backgroundColor: '#14532d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  motivationText: {
    color: '#bbf7d0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  historySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 16,
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
    color: '#e5e7eb',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
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
    color: '#9ca3af',
  },
  completedBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  completedBadgeText: {
    color: '#bbf7d0',
    fontSize: 11,
    fontWeight: '600',
  },
  incompleteBadge: {
    backgroundColor: '#78350f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  incompleteBadgeText: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '600',
  },
  historyRoutineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#020617',
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
    color: '#e5e7eb',
  },
  historyStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  historyStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1f2937',
  },
});