// src/screens/FoodScreen.js
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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getTodayFood, logFood, deleteFood, analyzeFood } from '../api/food';

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

  // Camera/AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [scanModalVisible, setScanModalVisible] = useState(false);

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

  // ==================== CÁMARA E IA ====================

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para escanear comida');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reducir calidad para envío más rápido
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedImage(asset.uri);
      setScanModalVisible(true);
      analyzeImage(asset.base64);
    }
  }

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCapturedImage(asset.uri);
      setScanModalVisible(true);
      analyzeImage(asset.base64);
    }
  }

  async function analyzeImage(base64) {
    try {
      setAnalyzing(true);
      setAnalysisResult(null);

      const result = await analyzeFood(base64);
      setAnalysisResult(result);

    } catch (err) {
      console.error('Error analizando:', err);
      Alert.alert('Error', err.response?.data?.message || 'No se pudo analizar la imagen');
      setScanModalVisible(false);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmAnalysis() {
    if (!analysisResult) return;

    try {
      setSaving(true);
      await logFood({
        name: analysisResult.name,
        calories: analysisResult.calories || 0,
        protein: analysisResult.protein || 0,
        carbs: analysisResult.carbs || 0,
        fat: analysisResult.fat || 0,
        meal_type: mealType,
      });

      setScanModalVisible(false);
      setCapturedImage(null);
      setAnalysisResult(null);
      loadTodayFood();
      Alert.alert('✅ Guardado', `${analysisResult.name} registrado correctamente`);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelScan() {
    setScanModalVisible(false);
    setCapturedImage(null);
    setAnalysisResult(null);
  }

  // ==================== MODAL MANUAL ====================

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
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteFood(food) {
    Alert.alert('Eliminar', `¿Eliminar "${food.name}"?`, [
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
    ]);
  }

  function getMealLabel(type) {
    const meal = MEAL_TYPES.find((m) => m.key === type);
    return meal ? meal.label : '🍽️';
  }

  // ==================== RENDER ====================

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

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.scanButton} onPress={handleTakePhoto}>
            <Text style={styles.scanButtonText}>📸 Escanear comida</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Text style={styles.galleryButtonText}>🖼️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Text style={styles.addButtonText}>+ Agregar manualmente</Text>
        </TouchableOpacity>

        {/* Lista de comidas */}
        {foods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Sin comidas registradas</Text>
            <Text style={styles.emptySubtitle}>
              Escanea con la cámara o agrega manualmente
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

      {/* ==================== MODAL ESCANEO IA ==================== */}
      <Modal
        visible={scanModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelScan}
      >
        <SafeAreaView style={styles.scanModalContainer}>
          <View style={styles.scanModalHeader}>
            <TouchableOpacity onPress={handleCancelScan}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.scanModalTitle}>Análisis IA</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scanModalContent}>
            {/* Imagen capturada */}
            {capturedImage && (
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            )}

            {/* Estado de análisis */}
            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.analyzingText}>Analizando con IA...</Text>
                <Text style={styles.analyzingSubtext}>
                  Identificando ingredientes y calculando nutrientes
                </Text>
              </View>
            )}

            {/* Resultado del análisis */}
            {analysisResult && !analyzing && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{analysisResult.name}</Text>
                  <View style={[
                    styles.confidenceBadge,
                    analysisResult.confidence === 'alta' && styles.confidenceHigh,
                    analysisResult.confidence === 'media' && styles.confidenceMedium,
                    analysisResult.confidence === 'baja' && styles.confidenceLow,
                  ]}>
                    <Text style={styles.confidenceText}>
                      {analysisResult.confidence === 'alta' ? '✓ Alta precisión' :
                       analysisResult.confidence === 'media' ? '~ Precisión media' :
                       '? Precisión baja'}
                    </Text>
                  </View>
                </View>

                {/* Nutrientes */}
                <View style={styles.nutrientsGrid}>
                  <View style={styles.nutrientCard}>
                    <Text style={styles.nutrientValue}>{analysisResult.calories}</Text>
                    <Text style={styles.nutrientLabel}>kcal</Text>
                  </View>
                  <View style={styles.nutrientCard}>
                    <Text style={styles.nutrientValue}>{analysisResult.protein}g</Text>
                    <Text style={styles.nutrientLabel}>Proteína</Text>
                  </View>
                  <View style={styles.nutrientCard}>
                    <Text style={styles.nutrientValue}>{analysisResult.carbs}g</Text>
                    <Text style={styles.nutrientLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutrientCard}>
                    <Text style={styles.nutrientValue}>{analysisResult.fat}g</Text>
                    <Text style={styles.nutrientLabel}>Grasa</Text>
                  </View>
                </View>

                {analysisResult.notes && (
                  <Text style={styles.resultNotes}>💡 {analysisResult.notes}</Text>
                )}

                {/* Selector de tipo de comida */}
                <Text style={styles.mealTypeLabel}>¿En qué comida lo registramos?</Text>
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

                {/* Botón confirmar */}
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmAnalysis}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#022c22" />
                  ) : (
                    <Text style={styles.confirmButtonText}>✓ Guardar comida</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.retryButton} onPress={handleTakePhoto}>
                  <Text style={styles.retryButtonText}>📸 Tomar otra foto</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==================== MODAL MANUAL (existente) ==================== */}
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
                  keyboardType="number-pad"
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
                  keyboardType="number-pad"
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
                  keyboardType="number-pad"
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
  summaryCard: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a3a3a3',
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
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#262626',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scanButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  galleryButton: {
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    borderWidth: 1,
    borderColor: '#262626',
  },
  galleryButtonText: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#171717',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  addButtonText: {
    color: '#a3a3a3',
    fontSize: 14,
    fontWeight: '600',
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
  foodCard: {
    backgroundColor: '#0a0a0a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 10,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodMeal: {
    fontSize: 12,
    color: '#a3a3a3',
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 6,
  },
  foodMacros: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  foodMacro: {
    fontSize: 12,
    color: '#737373',
  },
  hint: {
    fontSize: 12,
    color: '#525252',
    textAlign: 'center',
    marginTop: 16,
  },
  scanModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scanModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  scanModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  scanModalContent: {
    padding: 16,
  },
  capturedImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analyzingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  analyzingSubtext: {
    color: '#737373',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultContainer: {
    paddingTop: 8,
  },
  resultHeader: {
    marginBottom: 20,
  },
  resultName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  confidenceHigh: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#404040',
  },
  confidenceMedium: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#404040',
  },
  confidenceLow: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#404040',
  },
  confidenceText: {
    color: '#d4d4d4',
    fontSize: 12,
    fontWeight: '600',
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  nutrientCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  nutrientValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 4,
  },
  resultNotes: {
    color: '#a3a3a3',
    fontSize: 14,
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: '#171717',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  retryButtonText: {
    color: '#a3a3a3',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    color: '#dc2626',
    fontSize: 16,
  },
  saveButton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
  },
  mealTypeButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  mealTypeText: {
    fontSize: 13,
    color: '#a3a3a3',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroField: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    color: '#a3a3a3',
    marginBottom: 6,
  },
  macroInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#262626',
    textAlign: 'center',
  },
});