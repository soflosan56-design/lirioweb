import { assertNoError } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export async function fetchFavoriteListingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('swap_favorites').select('listing_id').eq('user_id', userId);
  assertNoError(error, 'No se pudieron cargar tus favoritos');
  return ((data ?? []) as { listing_id: string }[]).map((row) => row.listing_id);
}

export async function addFavoriteListing(listingId: string): Promise<void> {
  const { error } = await supabase.from('swap_favorites').insert({ listing_id: listingId });
  assertNoError(error, 'No se pudo guardar el favorito');
}

export async function removeFavoriteListing(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase.from('swap_favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
  assertNoError(error, 'No se pudo quitar el favorito');
}
