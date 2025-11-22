// src/components/OnboardingCarousel.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveOnboardingProfile } from '../api/profile';

const TOTAL_STEPS = 8;

export default function OnboardingCarousel({ onDone }) {
  const [step, setStep] = useState(0);

  const [profile, setProfile] = useState({
    experience: '',
    goal: '',
    daysPerWeek: 3,
    sessionDuration: 30,
    equipment: [],
    skills: {
      pushups: false,
      pullups: false,
      dips: false,
      squat: false,
      australianPullups: false,
    },
    preferences: [],
    injuries: [],
    injuriesDetail: '',
  });

  function toggleArrayValue(key, value) {
    setProfile(prev => {
      const current = prev[key] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  }

  function toggleSkill(key) {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [key]: !prev.skills[key],
      },
    }));
  }

  async function handleFinish() {
    try {
      const payload = {
        experience: profile.experience,
        goal: profile.goal,
        days_per_week: profile.daysPerWeek,
        session_duration: profile.sessionDuration,
        equipment: profile.equipment,
        skills: profile.skills,
        preferences: profile.preferences,
        injuries: profile.injuries,
        injuries_detail: profile.injuriesDetail,
      };

      await saveOnboardingProfile(payload);

      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Error',
        'No se pudo guardar tu perfil, intenta más tarde.'
      );
    }
  }

  function validateStep() {
    switch (step) {
      case 1:
        if (!profile.experience) {
          Alert.alert('Completa este paso', 'Elige tu nivel de experiencia.');
          return false;
        }
        return true;

      case 2:
        if (!profile.goal) {
          Alert.alert('Completa este paso', 'Elige al menos un objetivo.');
          return false;
        }
        return true;

      case 3:
        return true;

      case 4:
        if (!profile.equipment || profile.equipment.length === 0) {
          Alert.alert(
            'Completa este paso',
            'Selecciona al menos una opción (puede ser "Ninguno").'
          );
          return false;
        }
        return true;

      case 5:
        return true;

      case 6:
        if (!profile.preferences || profile.preferences.length === 0) {
          Alert.alert(
            'Completa este paso',
            'Selecciona al menos una preferencia.'
          );
          return false;
        }
        return true;

      case 7:
        return true;

      default:
        return true;
    }
  }

  function handleNext() {
    if (step !== 0) {
      const ok = validateStep();
      if (!ok) return;
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <View style={styles.center}>
            <Text style={styles.title}>Bienvenido a CalistenIA</Text>
            <Text style={styles.subtitle}>
              Te voy a ayudar a crear una rutina personalizada de calistenia
              basada en tu experiencia, objetivos y equipo disponible.
            </Text>
          </View>
        );

      case 1:
        return (
          <View>
            <Text style={styles.title}>Tu experiencia</Text>
            <Text style={styles.subtitle}>
              ¿Cuál es tu experiencia entrenando?
            </Text>

            {[
              { label: 'Nunca he entrenado', value: 'beginner_zero' },
              {
                label: 'Hago ejercicio pero no calistenia',
                value: 'beginner_fitness',
              },
              { label: 'Intermedio', value: 'intermediate' },
              { label: 'Avanzado', value: 'advanced' },
              {
                label: 'Puedo hacer la mayoría de ejercicios básicos',
                value: 'advanced_basics',
              },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  profile.experience === option.value && styles.optionSelected,
                ]}
                onPress={() =>
                  setProfile(prev => ({ ...prev, experience: option.value }))
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.experience === option.value &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.title}>Tu objetivo</Text>
            <Text style={styles.subtitle}>
              ¿Qué quieres lograr con CalistenIA?
            </Text>

            {[
              { label: 'Bajar grasa', value: 'fat_loss' },
              { label: 'Ganar fuerza', value: 'strength' },
              { label: 'Ganar músculo', value: 'hypertrophy' },
              { label: 'Mejorar resistencia', value: 'endurance' },
              { label: 'Movilidad / sentirse ligero', value: 'mobility' },
              { label: 'Preparar un truco (ej. handstand)', value: 'skills' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  profile.goal === option.value && styles.optionSelected,
                ]}
                onPress={() =>
                  setProfile(prev => ({ ...prev, goal: option.value }))
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.goal === option.value &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.title}>Tu tiempo</Text>
            <Text style={styles.subtitle}>
              ¿Cuántos días por semana puedes entrenar?
            </Text>

            <View style={styles.row}>
              {[2, 3, 4, 5, 6, 7].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.chip,
                    profile.daysPerWeek === d && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setProfile(prev => ({ ...prev, daysPerWeek: d }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      profile.daysPerWeek === d && styles.chipTextSelected,
                    ]}
                  >
                    {d} días
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.subtitle, { marginTop: 24 }]}>
              ¿Cuánto tiempo por sesión?
            </Text>

            {[
              { label: '20–30 min', value: 30 },
              { label: '30–45 min', value: 45 },
              { label: '45–60 min', value: 60 },
              { label: '+1 hora', value: 75 },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  profile.sessionDuration === option.value &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  setProfile(prev => ({
                    ...prev,
                    sessionDuration: option.value,
                  }))
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.sessionDuration === option.value &&
                      styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={styles.title}>Equipo disponible</Text>
            <Text style={styles.subtitle}>
              ¿Con qué equipo cuentas normalmente?
            </Text>

            {[
              { label: 'Ninguno', value: 'none' },
              { label: 'Barra fija', value: 'bar' },
              { label: 'Barras paralelas', value: 'parallettes' },
              { label: 'Bandas de resistencia', value: 'bands' },
              { label: 'Anillas', value: 'rings' },
              { label: 'Banco / step', value: 'bench' },
              { label: 'Mancuernas', value: 'dumbbells' },
              { label: 'Acceso a gym', value: 'gym' },
            ].map(option => {
              const selected =
                profile.equipment && profile.equipment.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => toggleArrayValue('equipment', option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 5:
        return (
          <View>
            <Text style={styles.title}>Ejercicios base</Text>
            <Text style={styles.subtitle}>
              Marca lo que PUEDES hacer con buena técnica.
            </Text>

            {[
              { label: 'Flexiones correctas', key: 'pushups' },
              { label: 'Dominadas (aunque sea 1)', key: 'pullups' },
              { label: 'Fondos (dips)', key: 'dips' },
              { label: 'Australian pull-ups', key: 'australianPullups' },
              { label: 'Sentadilla profunda sin dolor', key: 'squat' },
            ].map(option => {
              const selected = profile.skills[option.key];
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => toggleSkill(option.key)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 6:
        return (
          <View>
            <Text style={styles.title}>Preferencias</Text>
            <Text style={styles.subtitle}>¿Qué disfrutas más entrenar?</Text>

            {[
              { label: 'Empuje (pecho, hombro, tríceps)', value: 'push' },
              { label: 'Tracción (espalda, bíceps)', value: 'pull' },
              { label: 'Piernas', value: 'legs' },
              { label: 'Fullbody', value: 'fullbody' },
              { label: 'Movilidad', value: 'mobility' },
              {
                label: 'Skills (handstand, front lever, etc.)',
                value: 'skills',
              },
            ].map(option => {
              const selected =
                profile.preferences &&
                profile.preferences.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => toggleArrayValue('preferences', option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 7:
        return (
          <View>
            <Text style={styles.title}>Lesiones / limitaciones</Text>
            <Text style={styles.subtitle}>
              ¿Tienes alguna lesión o zona delicada?
            </Text>

            {[
              { label: 'Hombro', value: 'shoulder' },
              { label: 'Rodilla', value: 'knee' },
              { label: 'Espalda baja', value: 'lower_back' },
              { label: 'Muñeca', value: 'wrist' },
              { label: 'Ninguna', value: 'none' },
            ].map(option => {
              const selected =
                profile.injuries && profile.injuries.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => toggleArrayValue('injuries', option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.subtitle, { marginTop: 16 }]}>
              Con esto ajustaré tus ejercicios para evitar molestias
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === step && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, step === 0 && styles.navButtonDisabled]}
          disabled={step === 0}
          onPress={handleBack}
        >
          <Text
            style={[
              styles.navButtonText,
              step === 0 && styles.navButtonTextDisabled,
            ]}
          >
            Atrás
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext}>
          <Text style={styles.navButtonPrimaryText}>
            {step === TOTAL_STEPS - 1 ? 'Finalizar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#a3a3a3',
  },
  option: {
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#0a0a0a',
  },
  optionSelected: {
    borderColor: '#ffffff',
    backgroundColor: '#171717',
  },
  optionText: {
    color: '#a3a3a3',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: '#ffffff',
    backgroundColor: '#171717',
  },
  chipText: {
    color: '#a3a3a3',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#262626',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#404040',
  },
  navButtonDisabled: {
    borderColor: '#262626',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  navButtonTextDisabled: {
    color: '#525252',
  },
  navButtonPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  navButtonPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});