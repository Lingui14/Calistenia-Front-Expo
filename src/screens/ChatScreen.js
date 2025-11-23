import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sendMessage } from '../api/chat';
import { chatStyles } from '../styles/chatStyles';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    
    try {
      setLoading(true);
      const reply = await sendMessage(userMessage, messages);
      
      const routineButtonPattern = /\[ROUTINE_BUTTON:([a-f0-9-]+)\]/i;
      const match = reply.match(routineButtonPattern);
      
      let cleanedReply = reply;
      let hasRoutine = false;
      
      if (match) {
        hasRoutine = true;
        cleanedReply = reply.replace(routineButtonPattern, '').trim();
      }
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: cleanedReply,
        hasRoutine: hasRoutine
      }]);
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

  return (
    <SafeAreaView style={chatStyles.container}>
      <View style={chatStyles.header}>
        <Text style={chatStyles.title}> CalistenIA</Text>
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
              
              {msg.role === 'assistant' && msg.hasRoutine && (
                <TouchableOpacity
                  style={chatStyles.routineButton}
                  onPress={() => navigation.navigate('MisRutinas')}
                >
                  <Text style={chatStyles.routineButtonText}>Ver rutina generada</Text>
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