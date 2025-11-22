import api from './client';

const SYSTEM_PROMPT = `Eres CalistenIA, un coach experto en calistenia y fitness. 
Eres amigable, motivador y das consejos prácticos.
Responde en español, de forma concisa pero útil.
Si te preguntan algo fuera de fitness/salud, responde amablemente que solo puedes ayudar con temas de entrenamiento y salud.

Puedes ayudar con:
- Rutinas de calistenia
- Técnica de ejercicios
- Nutrición básica
- Motivación y mentalidad
- Prevención de lesiones
- Progresiones de ejercicios`;

export async function sendMessage(userMessage, conversationHistory = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const res = await api.post('/api/chat', {
    messages,
    model: 'grok-4-fast-reasoning',
    max_tokens: 500,
  });

  return res.data.choices[0]?.message?.content || 'No pude generar una respuesta.';
}