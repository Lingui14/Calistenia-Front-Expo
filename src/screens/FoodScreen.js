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
import { getTodayFood, logFood, deleteFood } from '../api/food';

const MEAL_TYPES = [
  { key: 'breakfast', label: '🌅 Desayuno' },
  { key: 'lunch', label: '☀️ Almuerzo' },
  { key: 'dinner', label: '🌙 Cena' },
  { key: 'snack', label: '🍎 Snack' },
];

export default function FoodScreen() {
  const [foods, setFoods] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState('snack');

  useEffect(() => {
    loadTodayFood();
  }, []);

  async function loadTodayFood() {
    try {
      setLoading(true);
      const data = await getTodayFood();
      setFoods(data.foods);
      setTotals(data.totals);
    } catch (err) {
      console.error('Error cargando comidas:', err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTodayFood();
      setFoods(data.foods);
      setTotals(data.totals);
    } catch (err) {
      console.error('Error refrescando:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  function openModal() {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType('snack');
    setModalVisible(true);
  }

  async function handleSaveFood() {
    if (!name.trim()) {
      Alert.alert('Error', '¿Qué comiste? Escribe el nombre');
      return;
    }

    try {
      setSaving(true);
      await logFood({
        name: name.trim(),
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        meal_type: mealType,
      });

      setModalVisible(false);
      loadTodayFood();
    } catch (err) {
      console.error('Error guardando comida:', err);
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteFood(food) {
    Alert.alert(
      'Eliminar',
      `¿Eliminar "${food.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFood(food.id);
              loadTodayFood();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }

  function getMealLabel(type) {
    const meal = MEAL_TYPES.find(m => m.key === type);
    return meal ? meal.label : '🍽️';
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Cargando comidas...</Text>
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
        <Text style={styles.screenTitle}>Alimentación</Text>
        <Text style={styles.screenSubtitle}>Registra lo que comes hoy 🍽️</Text>

        {/* Resumen del día */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Hoy</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totals.calories}</Text>
              <Text style={styles.summaryLabel}>kcal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totals.protein.toFixed(0)}g</Text>
              <Text style={styles.summaryLabel}>Proteína</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totals.carbs.toFixed(0)}g</Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totals.fat.toFixed(0)}g</Text>
              <Text style={styles.summaryLabel}>Grasa</Text>
            </View>
          </View>
        </View>

        {/* Botón agregar */}
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Text style={styles.addButtonText}>+ Agregar comida</Text>
        </TouchableOpacity>

        {/* Lista de comidas */}
        {foods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Sin comidas registradas</Text>
            <Text style={styles.emptySubtitle}>
              Registra tu primera comida del día
            </Text>
          </View>
        ) : (
          foods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodCard}
              onLongPress={() => handleDeleteFood(food)}
            >
              <View style={styles.foodHeader}>
                <Text style={styles.foodMeal}>{getMealLabel(food.meal_type)}</Text>
                <Text style={styles.foodCalories}>{food.calories} kcal</Text>
              </View>
              <Text style={styles.foodName}>{food.name}</Text>
              <View style={styles.foodMacros}>
                <Text style={styles.foodMacro}>P: {food.protein}g</Text>
                <Text style={styles.foodMacro}>C: {food.carbs}g</Text>
                <Text style={styles.foodMacro}>G: {food.fat}g</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.hint}>💡 Mantén presionado para eliminar</Text>
      </ScrollView>

      {/* Modal agregar comida */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Agregar comida</Text>
              <TouchableOpacity onPress={handleSaveFood} disabled={saving}>
                <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                  {saving ? '...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tipo de comida */}
            <Text style={styles.label}>Tipo de comida</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((meal) => (
                <TouchableOpacity
                  key={meal.key}
                  style={[
                    styles.mealTypeButton,
                    mealType === meal.key && styles.mealTypeButtonActive,
                  ]}
                  onPress={() => setMealType(meal.key)}
                >
                  <Text style={styles.mealTypeText}>{meal.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nombre */}
            <Text style={styles.label}>¿Qué comiste?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pollo con arroz"
              placeholderTextColor="#6b7280"
              value={name}
              onChangeText={setName}
            />

            {/* Calorías */}
            <Text style={styles.label}>Calorías (kcal)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 450"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              value={calories}
              onChangeText={setCalories}
            />

            {/* Macros */}
            <Text style={styles.label}>Macros (opcional)</Text>
            <View style={styles.macrosRow}>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Proteína (g)</Text>
                <TextInput
                  style={styles.macroInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.macroInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View style={styles.macroField}>
                <Text style={styles.macroLabel}>Grasa (g)</Text>
                <TextInput
                  style={styles.macroInput}
                  placeholder="0"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>
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
  summaryCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1f2937',
  },
  addButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#022c22',
    fontSize: 16,
    fontWeight: '700',
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
  },
  foodCard: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 10,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodMeal: {
    fontSize: 12,
    color: '#9ca3af',
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 6,
  },
  foodMacros: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  foodMacro: {
    fontSize: 12,
    color: '#6b7280',
  },
  hint: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 16,
  },
  // Modal
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
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  mealTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  mealTypeButtonActive: {
    backgroundColor: '#166534',
    borderColor: '#22c55e',
  },
  mealTypeText: {
    fontSize: 13,
    color: '#e5e7eb',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroField: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  macroInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
  },
});