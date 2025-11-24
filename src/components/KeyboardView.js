// src/components/KeyboardView.js
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  View,
  StyleSheet,
} from 'react-native';

export default function KeyboardView({ children, style, offset = 0 }) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, style]}
        behavior="padding"
        keyboardVerticalOffset={offset}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }

  // Android: usar padding manual
  return (
    <View style={[styles.container, style, { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});