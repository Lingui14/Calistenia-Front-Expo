import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { getMyRoutines, createRoutine, deleteRoutine } from '../api/routines';

export default function ExercisesScreen() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form state
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [exercises, setExercises] = useState([
    { name: '', sets: '3', reps: '10', rest_time: '60' },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, []);

  async function loadRoutines() {
    try {
      setLoading(true);
      const data = await getMyRoutines();
      setRoutines(data);
    } catch (err) {
      console.error('Error cargando rutinas:', err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getMyRoutines();
      setRoutines(data);
    } catch (err) {
      console.error('Error refrescando:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  function openModal() {
    setRoutineName('');
    setRoutineDescription('');
    setExercises([{ name: '', sets: '3', reps: '10', rest_time: '60' }]);
    setModalVisible(true);
  }

  function addExerciseField() {
    setExercises([...exercises, { name: '', sets: '3', reps: '10', rest_time: '60' }]);
  }

  function removeExerciseField(index) {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  }

  function updateExercise(index, field, value) {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  }

  async function handleSaveRoutine() {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Dale un nombre a tu rutina');
      return;
    }

    const validExercises = exercises.filter(ex => ex.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Error', 'Agrega al menos un ejercicio');
      return;
    }

    try {
      setSaving(true);
      await createRoutine({
        name: routineName.trim(),
        description: routineDescription.trim(),
        difficulty_level: 'custom',
        exercises: validExercises.map(ex => ({
          name: ex.name.trim(),
          sets: parseInt(ex.sets) || 3,
          reps: parseInt(ex.reps) || 10,
          rest_time: parseInt(ex.rest_time) || 60,
        })),
      });

      setModalVisible(false);
      loadRoutines();
      Alert.alert('✅ Listo', 'Tu rutina fue guardada');
    } catch (err) {
      console.error('Error guardando rutina:', err);
      Alert.alert('Error', 'No se pudo guardar la rutina');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteRoutine(routine) {
    Alert.alert(
      'Eliminar rutina',
      `¿Seguro que quieres eliminar "${routine.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutine(routine.id);
              loadRoutines();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Cargando rutinas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        <Text style={styles.screenTitle}>Mis Rutinas</Text>
        <Text style={styles.screenSubtitle}>
          Crea tus propias rutinas personalizadas 💪
        </Text>

        {/* Botón agregar */}
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Text style={styles.addButtonText}>+ Nueva rutina</Text>
        </TouchableOpacity>

        {/* Lista de rutinas */}
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>Sin rutinas personalizadas</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primera rutina tocando el botón de arriba
            </Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteRoutine(routine)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
              
              {routine.description ? (
                <Text style={styles.routineDescription}>{routine.description}</Text>
              ) : null}

              <Text style={styles.exerciseCount}>
                {routine.Exercises?.length || 0} ejercicios
              </Text>

              <View style={styles.exerciseList}>
                {routine.Exercises?.map((ex, idx) => (
                  <View key={ex.id} style={styles.exerciseItem}>
                    <Text style={styles.exerciseNumber}>{idx + 1}.</Text>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {ex.sets}×{ex.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para crear rutina */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nueva Rutina</Text>
              <TouchableOpacity onPress={handleSaveRoutine} disabled={saving}>
                <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nombre de rutina */}
            <Text style={styles.label}>Nombre de la rutina</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mi rutina de push"
              placeholderTextColor="#6b7280"
              value={routineName}
              onChangeText={setRoutineName}
            />

            {/* Descripción */}
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notas sobre esta rutina..."
              placeholderTextColor="#6b7280"
              value={routineDescription}
              onChangeText={setRoutineDescription}
              multiline
              numberOfLines={3}
            />

            {/* Ejercicios */}
            <Text style={styles.sectionTitle}>Ejercicios</Text>

            {exercises.map((ex, index) => (
              <View key={index} style={styles.exerciseForm}>
                <View style={styles.exerciseFormHeader}>
                  <Text style={styles.exerciseFormTitle}>Ejercicio {index + 1}</Text>
                  {exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExerciseField(index)}>
                      <Text style={styles.removeExercise}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nombre del ejercicio"
                  placeholderTextColor="#6b7280"
                  value={ex.name}
                  onChangeText={(val) => updateExercise(index, 'name', val)}
                />

                <View style={styles.exerciseNumbers}>
                  <View style={styles.numberField}>
                    <Text style={styles.numberLabel}>Series</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="number-pad"
                      value={ex.sets}
                      onChangeText={(val) => updateExercise(index, 'sets', val)}
                    />
                  </View>

                  <View style={styles.numberField}>
                    <Text style={styles.numberLabel}>Reps</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="number-pad"
                      value={ex.reps}
                      onChangeText={(val) => updateExercise(index, 'reps', val)}
                    />
                  </View>

                  <View style={styles.numberField}>
                    <Text style={styles.numberLabel}>Descanso</Text>
                    <TextInput
                      style={styles.numberInput}
                      keyboardType="number-pad"
                      value={ex.rest_time}
                      onChangeText={(val) => updateExercise(index, 'rest_time', val)}
                    />
                  </View>
                </View>
              </View>
            ))}

            {/* Botón agregar ejercicio */}
            <TouchableOpacity style={styles.addExerciseButton} onPress={addExerciseField}>
              <Text style={styles.addExerciseButtonText}>+ Agregar ejercicio</Text>
            </TouchableOpacity>
          </ScrollView>
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
    marginTop: 12,
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
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#022c22',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  routineCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  deleteButton: {
    fontSize: 20,
    padding: 4,
  },
  routineDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 8,
    marginBottom: 12,
  },
  exerciseList: {
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  exerciseNumber: {
    fontSize: 12,
    color: '#6b7280',
    width: 20,
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  saveButtonDisabled: {
    color: '#6b7280',
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 8,
    marginBottom: 16,
  },
  exerciseForm: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  exerciseFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  removeExercise: {
    fontSize: 18,
    color: '#ef4444',
    padding: 4,
  },
  exerciseNumbers: {
    flexDirection: 'row',
    gap: 12,
  },
  numberField: {
    flex: 1,
  },
  numberLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  numberInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  addExerciseButton: {
    borderWidth: 2,
    borderColor: '#1f2937',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addExerciseButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
});