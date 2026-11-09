import { assertNoError } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export const AI_MODELS = ['gemini-2.5-flash'] as const;
export type AiModel = (typeof AI_MODELS)[number];

export const MAX_AI_INSTRUCTIONS_LENGTH = 2000;

export type AiSettings = { model: AiModel; instructions: string };

export async function fetchAiSettings(): Promise<AiSettings | null> {
  const { data, error } = await supabase.from('ai_settings').select('model, instructions').eq('id', 1).maybeSingle();
  assertNoError(error, 'No se pudo cargar la configuración del recomendador');
  return (data as AiSettings | null) ?? null;
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  const { data, error } = await supabase
    .from('ai_settings')
    .update({ model: settings.model, instructions: settings.instructions, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('id');
  assertNoError(error, 'No se pudo guardar la configuración del recomendador');
  if (!data || data.length === 0) throw new Error('No tienes permiso para cambiar el recomendador.');
}
