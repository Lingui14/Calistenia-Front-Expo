import api from './client';

export async function sendMessage(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const res = await api.post('/api/chat', { messages });

  return res.data.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
}