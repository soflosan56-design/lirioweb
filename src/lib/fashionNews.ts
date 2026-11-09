import { supabase } from '@/lib/supabase';
import { readFunctionErrorMessage } from '@/lib/functionErrors';

export type FashionNewsArticle = {
  id: string;
  title: string;
  publisher: string | null;
  publishedAt: string | null;
};

type FashionNewsResponse = { articles?: unknown };

function isArticle(value: unknown): value is FashionNewsArticle {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === 'string' && typeof entry.title === 'string';
}

export async function fetchFashionNews(): Promise<FashionNewsArticle[]> {
  const { data, error } = await supabase.functions.invoke<FashionNewsResponse>('fashion-news', { method: 'GET' });
  if (error) {
    throw new Error(await readFunctionErrorMessage(error, 'No se pudieron cargar las noticias.'));
  }
  if (!data || !Array.isArray(data.articles)) {
    throw new Error('Las noticias llegaron en un formato no válido.');
  }
  return data.articles.filter(isArticle);
}
