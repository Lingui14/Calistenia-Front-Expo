// src/components/PrimaryButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function PrimaryButton({ title, onPress, variant = 'primary', disabled }) {
  const styleVariant =
    variant === 'danger'
      ? styles.danger
      : variant === 'secondary'
      ? styles.secondary
      : styles.primary;

  return (
    <TouchableOpacity
      style={[styles.button, styleVariant, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 8,
  },
  primary: {
    backgroundColor: '#2563EB',
  },
  secondary: {
    backgroundColor: '#4B5563',
  },
  danger: {
    backgroundColor: '#DC2626',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
});
