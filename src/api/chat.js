import api from './client';

export async function sendMessage(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  console.log('Enviando a /api/chat:', { messages });

  try {
    const res = await api.post('/api/chat', { messages });
    console.log('Respuesta del chat:', res.data);
    return res.data.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
  } catch (err) {
    console.error('Error en sendMessage:', err.response?.data || err.message);
    throw err;
  }
}