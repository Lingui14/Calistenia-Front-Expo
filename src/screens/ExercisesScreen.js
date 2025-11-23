// src/screens/ExercisesScreen.js (COMPLETO CON CRONÓMETROS)
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
import api from '../api/client';

export default function ExercisesScreen({ navigation }) {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [exercises, setExercises] = useState([
    { 
      name: '', 
      exercise_type: 'standard',
      sets: '3', 
      reps: '10', 
      rest_time: '60',
      hiit_work_time: '40',
      hiit_rest_time: '20',
      hiit_rounds: '8',
      amrap_duration: '1200',
      emom_duration: '600',
    },
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

  async function handleGenerateWithAI() {
    try {
      setLoadingAI(true);
      const res = await api.post('/api/routines/generate-ai', {});
      
      loadRoutines();
      
      Alert.alert(
        'Rutina creada',
        `"${res.data.routine.name}" fue generada con IA y agregada a tus rutinas`
      );
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'No se pudo generar la rutina con IA');
    } finally {
      setLoadingAI(false);
    }
  }

  function openModal() {
    setRoutineName('');
    setRoutineDescription('');
    setExercises([{ 
      name: '', 
      exercise_type: 'standard',
      sets: '3', 
      reps: '10', 
      rest_time: '60',
      hiit_work_time: '40',
      hiit_rest_time: '20',
      hiit_rounds: '8',
      amrap_duration: '1200',
      emom_duration: '600',
    }]);
    setModalVisible(true);
  }

  function addExerciseField() {
    setExercises([...exercises, { 
      name: '', 
      exercise_type: 'standard',
      sets: '3', 
      reps: '10', 
      rest_time: '60',
      hiit_work_time: '40',
      hiit_rest_time: '20',
      hiit_rounds: '8',
      amrap_duration: '1200',
      emom_duration: '600',
    }]);
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
          exercise_type: ex.exercise_type,
          sets: ex.exercise_type === 'standard' ? parseInt(ex.sets) : null,
          reps: ex.exercise_type === 'standard' ? parseInt(ex.reps) : null,
          rest_time: ex.exercise_type === 'standard' ? parseInt(ex.rest_time) : null,
          hiit_work_time: ex.exercise_type === 'hiit' ? parseInt(ex.hiit_work_time) : null,
          hiit_rest_time: ex.exercise_type === 'hiit' ? parseInt(ex.hiit_rest_time) : null,
          hiit_rounds: ex.exercise_type === 'hiit' ? parseInt(ex.hiit_rounds) : null,
          amrap_duration: ex.exercise_type === 'amrap' ? parseInt(ex.amrap_duration) : null,
          emom_duration: ex.exercise_type === 'emom' ? parseInt(ex.emom_duration) : null,
        })),
      });

      setModalVisible(false);
      loadRoutines();
      Alert.alert('Listo', 'Tu rutina fue guardada');
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

  function getExerciseDetail(ex) {
    if (ex.exercise_type === 'amrap') {
      return `AMRAP ${Math.floor(ex.amrap_duration / 60)} min`;
    } else if (ex.exercise_type === 'hiit') {
      return `HIIT ${ex.hiit_work_time}s/${ex.hiit_rest_time}s × ${ex.hiit_rounds}`;
    } else if (ex.exercise_type === 'emom') {
      return `EMOM ${Math.floor(ex.emom_duration / 60)} min`;
    } else {
      return `${ex.sets} × ${ex.reps}`;
    }
  }

  function handleStartTraining(routine) {
    navigation.navigate('Rutina', {
      screen: 'Training',
      params: { routine }
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Mis Rutinas</Text>
          <Text style={styles.screenSubtitle}>
            Crea tus propias rutinas personalizadas
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleGenerateWithAI}
            disabled={loadingAI}
          >
            {loadingAI ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Generar con IA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={openModal}
          >
            <Text style={styles.secondaryButtonText}>Crear manual</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de rutinas */}
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin rutinas</Text>
            <Text style={styles.emptySubtitle}>
              Genera una rutina con IA o crea una manualmente para comenzar
            </Text>
          </View>
        ) : (
          <View style={styles.routinesGrid}>
            {routines.map((routine) => (
              <View key={routine.id} style={styles.routineCard}>
                {/* Header de la card */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <View style={styles.metaTags}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {routine.difficulty_level.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {routine.Exercises?.length || 0} ejercicios
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRoutine(routine)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Descripción */}
                {routine.description ? (
                  <Text style={styles.routineDescription} numberOfLines={2}>
                    {routine.description}
                  </Text>
                ) : null}

                {/* Lista de ejercicios */}
                <View style={styles.exercisesList}>
                  {routine.Exercises?.slice(0, 4).map((ex, idx) => (
                    <View key={ex.id} style={styles.exerciseRow}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.exerciseContent}>
                        <Text style={styles.exerciseName} numberOfLines={1}>
                          {ex.name}
                        </Text>
                        <Text style={styles.exerciseDetail}>
                          {getExerciseDetail(ex)}
                        </Text>
                      </View>
                      {ex.exercise_type !== 'standard' && (
                        <View style={styles.exerciseBadge}>
                          <Text style={styles.exerciseBadgeText}>
                            {ex.exercise_type.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  {routine.Exercises?.length > 4 && (
                    <Text style={styles.moreExercises}>
                      +{routine.Exercises.length - 4} más
                    </Text>
                  )}
                </View>

                {/* Botón entrenar */}
                <TouchableOpacity
                  style={styles.trainButton}
                  onPress={() => handleStartTraining(routine)}
                >
                  <Text style={styles.trainButtonText}>Entrenar ahora</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para crear rutina manual */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Rutina</Text>
            <TouchableOpacity onPress={handleSaveRoutine} disabled={saving}>
              <Text style={[styles.modalSaveText, saving && styles.modalSaveTextDisabled]}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nombre</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ej: Full Body Advanced"
                placeholderTextColor="#666666"
                value={routineName}
                onChangeText={setRoutineName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Notas sobre esta rutina..."
                placeholderTextColor="#666666"
                value={routineDescription}
                onChangeText={setRoutineDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Ejercicios</Text>

            {exercises.map((ex, index) => (
              <View key={index} style={styles.exerciseFormCard}>
                <View style={styles.exerciseFormHeader}>
                  <Text style={styles.exerciseFormTitle}>
                    Ejercicio {index + 1}
                  </Text>
                  {exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExerciseField(index)}>
                      <Text style={styles.removeExerciseText}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.formInput}
                  placeholder="Nombre del ejercicio"
                  placeholderTextColor="#666666"
                  value={ex.name}
                  onChangeText={(val) => updateExercise(index, 'name', val)}
                />

                {/* Selector de tipo de ejercicio */}
                <View style={styles.typeSelector}>
                  {[
                    { key: 'standard', label: 'NORMAL' },
                    { key: 'hiit', label: 'HIIT' },
                    { key: 'amrap', label: 'AMRAP' },
                    { key: 'emom', label: 'EMOM' },
                  ].map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeButton,
                        ex.exercise_type === type.key && styles.typeButtonActive
                      ]}
                      onPress={() => updateExercise(index, 'exercise_type', type.key)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        ex.exercise_type === type.key && styles.typeButtonTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Campos según el tipo */}
                {ex.exercise_type === 'standard' && (
                  <View style={styles.exerciseParams}>
                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Series</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={ex.sets}
                        onChangeText={(val) => updateExercise(index, 'sets', val)}
                      />
                    </View>

                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Reps</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={ex.reps}
                        onChangeText={(val) => updateExercise(index, 'reps', val)}
                      />
                    </View>

                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Descanso (s)</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={ex.rest_time}
                        onChangeText={(val) => updateExercise(index, 'rest_time', val)}
                      />
                    </View>
                  </View>
                )}

                {ex.exercise_type === 'hiit' && (
                  <View style={styles.exerciseParams}>
                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Trabajo (s)</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={ex.hiit_work_time}
                        onChangeText={(val) => updateExercise(index, 'hiit_work_time', val)}
                      />
                    </View>

                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Descanso (s)</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={ex.hiit_rest_time}
                        onChangeText={(val) => updateExercise(index, 'hiit_rest_time', val)}
                      />
                    </View>

                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Rondas</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={ex.hiit_rounds}
                        onChangeText={(val) => updateExercise(index, 'hiit_rounds', val)}
                      />
                    </View>
                  </View>
                )}

                {ex.exercise_type === 'amrap' && (
                  <View style={styles.exerciseParams}>
                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Duración (min)</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={String(parseInt(ex.amrap_duration) / 60 || 20)}
                        onChangeText={(val) => updateExercise(index, 'amrap_duration', String(parseInt(val || 0) * 60))}
                      />
                    </View>
                  </View>
                )}

                {ex.exercise_type === 'emom' && (
                  <View style={styles.exerciseParams}>
                    <View style={styles.paramField}>
                      <Text style={styles.paramLabel}>Duración (min)</Text>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="number-pad"
                        value={String(parseInt(ex.emom_duration) / 60 || 10)}
                        onChangeText={(val) => updateExercise(index, 'emom_duration', String(parseInt(val || 0) * 60))}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}

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
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    marginTop: 16,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#666666',
    marginTop: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ffffff',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  routinesGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  routineCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#666666',
    lineHeight: 24,
  },
  routineDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginBottom: 16,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 13,
    color: '#666666',
  },
  exerciseBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exerciseBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 0.5,
  },
  moreExercises: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  trainButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  trainButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalSaveTextDisabled: {
    color: '#333333',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  formInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  formTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  exerciseFormCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
    color: '#888888',
  },
  removeExerciseText: {
    fontSize: 14,
    color: '#666666',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  typeButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 0.5,
  },
  typeButtonTextActive: {
    color: '#000000',
  },
  exerciseParams: {
    flexDirection: 'row',
    gap: 12,
  },
  paramField: {
    flex: 1,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  paramInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  addExerciseButton: {
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
  },
  addExerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.3,
  },
});