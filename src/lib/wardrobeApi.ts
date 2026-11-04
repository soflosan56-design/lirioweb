import { assertNoError, PROFILE_COLUMNS } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { GarmentDetails, Profile, WardrobeItem } from '@/lib/types';

const WARDROBE_COLUMNS = 'id, owner_id, name, image_url, brand, size, condition, material, description, created_at';

export type WardrobeItemInput = GarmentDetails & { name: string; image_url: string };

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false });
  assertNoError(error, 'No se pudieron cargar los armarios');
  return (data ?? []) as Profile[];
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
  assertNoError(error, 'No se pudo cargar el perfil');
  return (data as Profile | null) ?? null;
}

export async function fetchWardrobeCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('wardrobe_items').select('owner_id');
  assertNoError(error, 'No se pudieron contar las prendas');
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { owner_id: string }[]) {
    counts[row.owner_id] = (counts[row.owner_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchWardrobeItems(ownerId: string): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select(WARDROBE_COLUMNS)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  assertNoError(error, 'No se pudo cargar el armario');
  return (data ?? []) as WardrobeItem[];
}

export async function fetchWardrobeFeed(limit: number): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select(WARDROBE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  assertNoError(error, 'No se pudieron cargar las prendas');
  return (data ?? []) as WardrobeItem[];
}

export async function createWardrobeItem(input: WardrobeItemInput): Promise<WardrobeItem> {
  const { data, error } = await supabase.from('wardrobe_items').insert(input).select(WARDROBE_COLUMNS).single();
  assertNoError(error, 'No se pudo añadir la prenda');
  return data as WardrobeItem;
}

export async function updateWardrobeItem(id: string, input: WardrobeItemInput): Promise<WardrobeItem> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .update(input)
    .eq('id', id)
    .select(WARDROBE_COLUMNS)
    .single();
  assertNoError(error, 'No se pudo guardar la prenda');
  return data as WardrobeItem;
}

export async function deleteWardrobeItem(id: string): Promise<void> {
  const { error } = await supabase.from('wardrobe_items').delete().eq('id', id);
  assertNoError(error, 'No se pudo borrar la prenda');
}
