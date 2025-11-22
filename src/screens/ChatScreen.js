function ChatScreen() {
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
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
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
            <View
              key={index}
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
          ))
        )}
        {loading && (
          <View style={[chatStyles.messageBubble, chatStyles.aiBubble]}>
            <ActivityIndicator size="small" color="#22c55e" />
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

  const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  suggestions: {
    marginTop: 24,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  suggestionText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#22c55e',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  userText: {
    color: '#022c22',
  },
  aiText: {
    color: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    alignItems: 'flex-end',
    backgroundColor: '#020617',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#22c55e',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1f2937',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#022c22',
  },
});
}