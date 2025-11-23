import { StyleSheet } from 'react-native';

export const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#737373',
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
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  suggestions: {
    marginTop: 24,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: '#171717',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  suggestionText: {
    color: '#a3a3a3',
    fontSize: 13,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#171717',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#000000',
  },
  aiText: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#262626',
    alignItems: 'flex-end',
    backgroundColor: '#000000',
  },
  input: {
    flex: 1,
    backgroundColor: '#171717',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#ffffff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#262626',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#000000',
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
});