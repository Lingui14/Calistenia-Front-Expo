import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  AppState,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Pedometer } from 'expo-sensors';
import { getTodayActivity, updateActivity, updateGoals } from '../api/activity';

// Componente de anillo
function ProgressRing({ progress, color, size = 100, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = Math.min(progress, 1);
  const strokeDashoffset = circumference - (progressValue * circumference);

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

export default function ActivityScreen() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(0);
  
  const [stepsGoal, setStepsGoal] = useState('10000');
  const [caloriesGoal, setCaloriesGoal] = useState('500');
  const [minutesGoal, setMinutesGoal] = useState('90');

  const subscriptionRef = useRef(null);

  useEffect(() => {
    loadActivity();
    setupPedometer();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  async function setupPedometer() {
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(available);

      if (available) {
        // Usar watch en vez de getStepCountAsync (no soportado en Android)
        subscriptionRef.current = Pedometer.watchStepCount(result => {
          setCurrentSteps(prev => {
            const newSteps = prev + result.steps;
            // Actualizar en backend cada 100 pasos
            if (newSteps % 100 === 0) {
              const calories = Math.round(newSteps * 0.04);
              const minutes = Math.round(newSteps / 100);
              updateActivity({ steps: newSteps, calories_burned: calories, active_minutes: minutes });
            }
            return newSteps;
          });
        });
      }
    } catch (err) {
      console.error('Error configurando pedometer:', err);
      setIsPedometerAvailable(false);
    }
  }

  async function loadActivity() {
    try {
      setLoading(true);
      const data = await getTodayActivity();
      setActivity(data);
      setCurrentSteps(data.steps || 0);
      
      setStepsGoal(String(data.steps_goal));
      setCaloriesGoal(String(data.calories_goal));
      setMinutesGoal(String(data.minutes_goal));
    } catch (err) {
      console.error('Error cargando actividad:', err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivity();
    setRefreshing(false);
  }, []);

  async function handleSaveGoals() {
    try {
      await updateGoals({
        steps_goal: parseInt(stepsGoal) || 10000,
        calories_goal: parseInt(caloriesGoal) || 500,
        minutes_goal: parseInt(minutesGoal) || 90,
      });
      setModalVisible(false);
      loadActivity();
      Alert.alert('✅ Listo', 'Objetivos actualizados');
    } catch (err) {
      Alert.alert('Error', 'No se pudieron guardar los objetivos');
    }
  }

  if (loading || !activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando actividad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Usar currentSteps si hay pedometer, sino usar del backend
  const displaySteps = isPedometerAvailable ? currentSteps : activity.steps;
  const displayCalories = Math.round(displaySteps * 0.04);
  const displayMinutes = Math.round(displaySteps / 100);

  const stepsProgress = displaySteps / activity.steps_goal;
  const caloriesProgress = displayCalories / activity.calories_goal;
  const minutesProgress = displayMinutes / activity.minutes_goal;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        <Text style={styles.screenTitle}>Actividad</Text>
        <Text style={styles.screenSubtitle}>
          {isPedometerAvailable 
            ? 'Contando tus pasos en tiempo real 👟' 
            : 'Los pasos se calculan de tus entrenamientos'}
        </Text>

        {/* Anillos de progreso */}
        <View style={styles.ringsContainer}>
          <View style={styles.ringItem}>
            <View style={styles.ringWrapper}>
              <ProgressRing progress={stepsProgress} color="#22c55e" size={100} strokeWidth={10} />
              <View style={styles.ringContent}>
                <Text style={styles.ringEmoji}>👟</Text>
              </View>
            </View>
            <Text style={styles.ringValue}>{displaySteps.toLocaleString()}</Text>
            <Text style={styles.ringLabel}>/ {activity.steps_goal.toLocaleString()}</Text>
            <Text style={styles.ringTitle}>Pasos</Text>
          </View>

          <View style={styles.ringItem}>
            <View style={styles.ringWrapper}>
              <ProgressRing progress={caloriesProgress} color="#f97316" size={100} strokeWidth={10} />
              <View style={styles.ringContent}>
                <Text style={styles.ringEmoji}>🔥</Text>
              </View>
            </View>
            <Text style={styles.ringValue}>{displayCalories}</Text>
            <Text style={styles.ringLabel}>/ {activity.calories_goal} kcal</Text>
            <Text style={styles.ringTitle}>Calorías</Text>
          </View>

          <View style={styles.ringItem}>
            <View style={styles.ringWrapper}>
              <ProgressRing progress={minutesProgress} color="#3b82f6" size={100} strokeWidth={10} />
              <View style={styles.ringContent}>
                <Text style={styles.ringEmoji}>⏱️</Text>
              </View>
            </View>
            <Text style={styles.ringValue}>{displayMinutes}</Text>
            <Text style={styles.ringLabel}>/ {activity.minutes_goal} min</Text>
            <Text style={styles.ringTitle}>Activo</Text>
          </View>
        </View>

        {/* Porcentajes */}
        <View style={styles.percentagesCard}>
          <View style={styles.percentageItem}>
            <View style={[styles.percentageDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.percentageText}>
              {Math.round(stepsProgress * 100)}% pasos
            </Text>
          </View>
          <View style={styles.percentageItem}>
            <View style={[styles.percentageDot, { backgroundColor: '#f97316' }]} />
            <Text style={styles.percentageText}>
              {Math.round(caloriesProgress * 100)}% calorías
            </Text>
          </View>
          <View style={styles.percentageItem}>
            <View style={[styles.percentageDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.percentageText}>
              {Math.round(minutesProgress * 100)}% tiempo
            </Text>
          </View>
        </View>

        {/* Botón editar objetivos */}
        <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.editButtonText}>⚙️ Editar objetivos</Text>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            {isPedometerAvailable 
              ? 'Tus pasos se cuentan mientras caminas'
              : 'Completa entrenamientos para sumar actividad'}
          </Text>
        </View>
      </ScrollView>

      {/* Modal editar objetivos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Mis objetivos</Text>
              <TouchableOpacity onPress={handleSaveGoals}>
                <Text style={styles.saveButton}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goalField}>
              <Text style={styles.goalLabel}>👟 Pasos diarios</Text>
              <TextInput
                style={styles.goalInput}
                keyboardType="number-pad"
                value={stepsGoal}
                onChangeText={setStepsGoal}
              />
            </View>

            <View style={styles.goalField}>
              <Text style={styles.goalLabel}>🔥 Calorías a quemar</Text>
              <TextInput
                style={styles.goalInput}
                keyboardType="number-pad"
                value={caloriesGoal}
                onChangeText={setCaloriesGoal}
              />
            </View>

            <View style={styles.goalField}>
              <Text style={styles.goalLabel}>⏱️ Minutos activos</Text>
              <TextInput
                style={styles.goalInput}
                keyboardType="number-pad"
                value={minutesGoal}
                onChangeText={setMinutesGoal}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  ringItem: {
    alignItems: 'center',
  },
  ringWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  ringContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringEmoji: {
    fontSize: 28,
  },
  ringValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginTop: 8,
  },
  ringLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  ringTitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  percentagesCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  percentageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  percentageText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  editButton: {
    backgroundColor: '#1f2937',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  editButtonText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  cancelButton: {
    fontSize: 16,
    color: '#ef4444',
  },
  saveButton: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  goalField: {
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  goalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    color: '#e5e7eb',
    textAlign: 'center',
  },
});