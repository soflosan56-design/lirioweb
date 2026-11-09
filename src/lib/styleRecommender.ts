import { supabase } from '@/lib/supabase';
import { readFunctionErrorMessage } from '@/lib/functionErrors';

export type RecommendedWardrobeItem = { id: string; name: string; image_url: string };
export type RecommendedListing = { id: string; title: string; image_url: string | null };
export type StyleRecommendation = {
  title: string;
  reason: string;
  wardrobeItems: RecommendedWardrobeItem[];
  swapListings: RecommendedListing[];
};

type RecommenderResponse = { recommendations?: unknown; error?: string };

function isRecommendation(value: unknown): value is StyleRecommendation {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.title === 'string' &&
    typeof entry.reason === 'string' &&
    Array.isArray(entry.wardrobeItems) &&
    Array.isArray(entry.swapListings)
  );
}

export async function fetchStyleRecommendations(request: string): Promise<StyleRecommendation[]> {
  const { data, error } = await supabase.functions.invoke<RecommenderResponse>('style-recommender', {
    body: { request },
  });
  if (error) {
    throw new Error(await readFunctionErrorMessage(error, 'No se pudieron generar las recomendaciones. Inténtalo de nuevo.'));
  }
  if (!data || !Array.isArray(data.recommendations)) {
    throw new Error('El recomendador devolvió una respuesta no válida.');
  }
  return data.recommendations.filter(isRecommendation);
}
