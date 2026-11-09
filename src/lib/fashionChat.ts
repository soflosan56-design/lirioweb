import { supabase } from '@/lib/supabase';
import { readFunctionErrorMessage } from '@/lib/functionErrors';

export type FashionChatMessage = { role: 'user' | 'assistant'; content: string };

type FashionChatResponse = { reply?: unknown };

export async function sendFashionChatMessage(messages: FashionChatMessage[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke<FashionChatResponse>('fashion-chat', {
    body: { messages },
  });
  if (error) {
    throw new Error(await readFunctionErrorMessage(error, 'El chat no pudo responder. Inténtalo de nuevo.'));
  }
  if (!data || typeof data.reply !== 'string') {
    throw new Error('El chat devolvió una respuesta no válida.');
  }
  return data.reply;
}
