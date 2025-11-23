// src/screens/ChatScreen.js - COMPLETO
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendMessage } from '../api/chat';

export default function ChatScreen({ onRoutineGenerated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    try {
      setLoading(true);
      const reply = await sendMessage(userMessage, messages);
      
      // PARSEAR el marcador [ROUTINE_BUTTON:uuid]
      const routineButtonPattern = /\[ROUTINE_BUTTON:([a-f0-9-]+)\]/i;
      const match = reply.match(routineButtonPattern);
      
      let cleanedReply = reply;
      let hasRoutine = false;
      let routineId = null;
      
      if (match) {
        routineId = match[1];
        hasRoutine = true;
        // Limpiar el mensaje (quitar el marcador)
        cleanedReply = reply.replace(routineButtonPattern, '').trim();
      }
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: cleanedReply,
        hasRoutine: hasRoutine,
        routineId: routineId
      }]);
      
      // Si se generó una rutina, actualizar (solo si la función existe)
      if (hasRoutine && onRoutineGenerated) {
        onRoutineGenerated();
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Lo siento, hubo un error. Intenta de nuevo.' 
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleGoToRoutine() {
    navigation.navigate('Rutina');
  }

  return (
    <SafeAreaView style={chatStyles.container}>
      <View style={chatStyles.header}>
        <Text style={chatStyles.title}>🤖 CalistenIA</Text>
        <Text style={chatStyles.subtitle}>Tu coach personal de calistenia</Text>
      </View>

      <ScrollView 
        style={chatStyles.messagesContainer}
        contentContainerStyle={chatStyles.messagesContent}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={chatStyles.emptyChat}>
            <Text style={chatStyles.emptyChatEmoji}>💬</Text>
            <Text style={chatStyles.emptyChatText}>
              ¡Hola! Soy tu asistente de calistenia.{'\n\n'}
              Pregúntame sobre ejercicios, rutinas, técnica, nutrición o lo que necesites.
            </Text>
            <View style={chatStyles.suggestions}>
              <TouchableOpacity 
                style={chatStyles.suggestionChip}
                onPress={() => setInput('¿Cómo hago mi primera dominada?')}
              >
                <Text style={chatStyles.suggestionText}>¿Cómo hago mi primera dominada?</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={chatStyles.suggestionChip}
                onPress={() => setInput('Dame una rutina para principiantes')}
              >
                <Text style={chatStyles.suggestionText}>Rutina para principiantes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={chatStyles.suggestionChip}
                onPress={() => setInput('¿Qué debo comer para ganar músculo?')}
              >
                <Text style={chatStyles.suggestionText}>Nutrición para ganar músculo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          messages.map((msg, index) => (
            <View key={index}>
              <View
                style={[
                  chatStyles.messageBubble,
                  msg.role === 'user' ? chatStyles.userBubble : chatStyles.aiBubble,
                ]}
              >
                <Text style={[
                  chatStyles.messageText,
                  msg.role === 'user' ? chatStyles.userText : chatStyles.aiText,
                ]}>
                  {msg.content}
                </Text>
              </View>
              
              {/* BOTÓN PARA VER RUTINA */}
              {msg.role === 'assistant' && msg.hasRoutine && (
                <TouchableOpacity
                  style={chatStyles.routineButton}
                  onPress={handleGoToRoutine}
                >
                  <Text style={chatStyles.routineButtonText}>
                    Ver rutina generada
                  </Text>
                  <Text style={chatStyles.routineButtonArrow}>→</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        {loading && (
          <View style={[chatStyles.messageBubble, chatStyles.aiBubble, { flexDirection: 'row' }]}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={[chatStyles.aiText, { marginLeft: 8 }]}>Pensando...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={chatStyles.inputContainer}>
          <TextInput
            style={chatStyles.input}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor="#6b7280"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[chatStyles.sendButton, (!input.trim() || loading) && chatStyles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={chatStyles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyChatEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 15,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  suggestions: {
    gap: 8,
    width: '100%',
    paddingHorizontal: 16,
  },
  suggestionChip: {
    backgroundColor: '#171717',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  suggestionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#171717',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#262626',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#000000',
    fontWeight: '600',
  },
  aiText: {
    color: '#ffffff',
  },
  routineButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 4,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routineButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  routineButtonArrow: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#171717',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sendButton: {
    backgroundColor: '#ffffff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#262626',
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
  },
});