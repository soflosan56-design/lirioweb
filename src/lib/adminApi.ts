import { supabase } from '@/lib/supabase';

export type AdminTable = 'brands' | 'products' | 'content_items';
export type AdminRow = { id: string } & Record<string, unknown>;

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('No se pudo comprobar el acceso');
  return data !== null;
}

export async function fetchAdminRows(table: AdminTable, select: string, orderBy: string, ascending: boolean): Promise<AdminRow[]> {
  const { data, error } = await supabase.from(table).select(select).order(orderBy, { ascending });
  if (error) throw new Error('No se pudieron cargar los registros');
  return (data ?? []) as unknown as AdminRow[];
}

function toAdminMessage(code: string | undefined, fallback: string): string {
  if (code === '23505') return 'Ya existe un registro con ese identificador (slug).';
  if (code === '23503') return 'Este registro está en uso y no se puede borrar.';
  return fallback;
}

export async function saveAdminRecord(table: AdminTable, id: string | null, values: Record<string, unknown>): Promise<void> {
  const query = id
    ? supabase.from(table).update(values).eq('id', id)
    : supabase.from(table).insert(values);
  const { error } = await query;
  if (error) {
    console.error('admin save failed', error);
    throw new Error(toAdminMessage(error.code, 'No se pudo guardar el registro. Inténtalo de nuevo.'));
  }
}

export type AdminProfile = { id: string; display_name: string | null; city: string | null; created_at: string };

export async function fetchAdminProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, city, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('No se pudieron cargar los perfiles');
  return (data ?? []) as AdminProfile[];
}

export async function deleteProfileAsAdmin(profileId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>('admin-delete-profile', {
    body: { profileId },
  });
  if (error || !data?.ok) {
    throw new Error(data?.error ?? 'No se pudo eliminar el perfil. Inténtalo de nuevo.');
  }
}

export async function deleteAdminRecord(table: AdminTable, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error('admin delete failed', error);
    throw new Error(toAdminMessage(error.code, 'No se pudo borrar el registro. Inténtalo de nuevo.'));
  }
}
