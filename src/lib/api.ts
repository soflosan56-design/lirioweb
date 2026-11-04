import { supabase } from '@/lib/supabase';
import type {
  Brand,
  CartItem,
  CartMode,
  ContentItem,
  Product,
  Profile,
  ProfileEdits,
  SwapBid,
  SwapListing,
  SwapMessage,
} from '@/lib/types';

export function assertNoError(error: { message: string } | null, action: string): void {
  if (error) throw new Error(`${action}: ${error.message}`);
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_BUCKET = 'lirio-uploads';

export async function uploadImage(ownerId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Sólo se admiten imágenes.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('La imagen supera los 5 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '3600',
  });
  assertNoError(error, 'No se pudo subir la imagen');
  return supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path).data.publicUrl;
}

const FONT_EXTENSIONS = ['woff2', 'woff', 'ttf', 'otf'];
export const MAX_FONT_BYTES = 3 * 1024 * 1024;

export async function uploadFont(ownerId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!FONT_EXTENSIONS.includes(extension)) throw new Error('Sólo se admiten fuentes .woff2, .woff, .ttf u .otf.');
  if (file.size > MAX_FONT_BYTES) throw new Error('La fuente supera los 3 MB.');
  const path = `${ownerId}/fonts/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, file, {
    contentType: `font/${extension}`,
    cacheControl: '3600',
  });
  assertNoError(error, 'No se pudo subir la fuente');
  return supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert(input);
  assertNoError(error, 'No se pudo enviar el mensaje');
}

export const PROFILE_COLUMNS = 'id, display_name, city, style, bio, avatar_url';

export async function ensureProfile(id: string): Promise<Profile> {
  const existing = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  assertNoError(existing.error, 'No se pudo cargar el perfil');
  if (existing.data) return existing.data as Profile;

  const created = await supabase
    .from('profiles')
    .insert({ id })
    .select(PROFILE_COLUMNS)
    .single();
  assertNoError(created.error, 'No se pudo crear el perfil');
  return created.data as Profile;
}

export async function updateProfile(id: string, fields: ProfileEdits): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single();
  assertNoError(error, 'No se pudo guardar el perfil');
  return data as Profile;
}

const LISTING_COLUMNS =
  'id, owner_id, title, brand, size, condition, material, description, image_urls, wanted, estimated_value, created_at';

export async function fetchListings(): Promise<SwapListing[]> {
  const { data, error } = await supabase
    .from('swap_listings')
    .select(LISTING_COLUMNS)
    .eq('is_demo', false)
    .order('created_at', { ascending: false });
  assertNoError(error, 'No se pudieron cargar las prendas');
  return (data ?? []) as SwapListing[];
}

export type NewListing = Omit<SwapListing, 'id' | 'created_at'>;

const BID_COLUMNS =
  'id, listing_id, bidder_id, offer_title, offer_value, offer_image_urls, brand, size, condition, material, description, message, created_at';

export async function createListing(listing: NewListing): Promise<SwapListing> {
  const { data, error } = await supabase
    .from('swap_listings')
    .insert(listing)
    .select(LISTING_COLUMNS)
    .single();
  assertNoError(error, 'No se pudo publicar la prenda');
  return data as SwapListing;
}

export async function getOrCreateListingForWardrobeItem(itemId: string): Promise<SwapListing> {
  const { data, error } = await supabase.rpc('get_or_create_listing_for_wardrobe_item', { item_id: itemId });
  assertNoError(error, 'No se pudo abrir la puja de esta prenda');
  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('No se pudo abrir la puja de esta prenda');
  }
  return data as SwapListing;
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from('swap_listings').delete().eq('id', id);
  assertNoError(error, 'No se pudo retirar la prenda');
}

export async function fetchBids(listingId: string): Promise<SwapBid[]> {
  const { data, error } = await supabase
    .from('swap_bids')
    .select(BID_COLUMNS)
    .eq('listing_id', listingId)
    .order('offer_value', { ascending: false });
  assertNoError(error, 'No se pudieron cargar las pujas');
  return (data ?? []) as SwapBid[];
}

export async function fetchBidderCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('swap_listing_bidder_counts').select('listing_id, bidder_count');
  assertNoError(error, 'No se pudieron cargar las pujas');
  return Object.fromEntries((data ?? []).map((row: { listing_id: string; bidder_count: number }) => [row.listing_id, row.bidder_count]));
}

export type NewBid = Omit<SwapBid, 'id' | 'created_at' | 'bidder_id'>;

export async function createBid(bid: NewBid): Promise<SwapBid> {
  const { data, error } = await supabase
    .from('swap_bids')
    .insert(bid)
    .select(BID_COLUMNS)
    .single();
  assertNoError(error, 'No se pudo registrar la puja');
  return data as SwapBid;
}

const MESSAGE_COLUMNS = 'id, listing_id, sender_id, recipient_id, body, created_at';

export async function sendMessage(input: Omit<SwapMessage, 'id' | 'created_at'>): Promise<SwapMessage> {
  const { data, error } = await supabase
    .from('swap_messages')
    .insert(input)
    .select(MESSAGE_COLUMNS)
    .single();
  assertNoError(error, 'No se pudo enviar el mensaje');
  return data as SwapMessage;
}

export async function fetchThread(listingId: string, meId: string, otherId: string): Promise<SwapMessage[]> {
  const { data, error } = await supabase
    .from('swap_messages')
    .select(MESSAGE_COLUMNS)
    .eq('listing_id', listingId)
    .or(`and(sender_id.eq.${meId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${meId})`)
    .order('created_at', { ascending: true });
  assertNoError(error, 'No se pudo cargar la conversación');
  return (data ?? []) as SwapMessage[];
}

export type InboxMessage = SwapMessage & { listing: Pick<SwapListing, 'id' | 'title'> | null };

export async function fetchInboxMessages(): Promise<InboxMessage[]> {
  const { data, error } = await supabase
    .from('swap_messages')
    .select(`${MESSAGE_COLUMNS}, listing:swap_listings(id, title)`)
    .order('created_at', { ascending: false })
    .limit(500);
  assertNoError(error, 'No se pudieron cargar los mensajes');
  return (data ?? []) as unknown as InboxMessage[];
}

export async function fetchDisplayNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', ids);
  assertNoError(error, 'No se pudieron cargar los nombres');
  return Object.fromEntries((data ?? []).map((p: Pick<Profile, 'id' | 'display_name'>) => [p.id, p.display_name]));
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, slug, name, city, tagline, image_url, image_urls')
    .order('name', { ascending: true });
  assertNoError(error, 'No se pudieron cargar las marcas');
  return (data ?? []) as Brand[];
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, brand_id, name, description, size, price_cents, rent_cents, image_url, image_urls, brand:brands(id, name)'
    )
    .order('created_at', { ascending: true });
  assertNoError(error, 'No se pudo cargar el catálogo');
  return (data ?? []) as unknown as Product[];
}

export async function fetchContent(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select(
      'id, kind, slug, title, subtitle, excerpt, body, category, image_url, video_url, duration_label, episode_number, featured, published_at'
    )
    .order('published_at', { ascending: false });
  assertNoError(error, 'No se pudo cargar el contenido');
  return (data ?? []) as ContentItem[];
}

const CART_SELECT =
  'id, owner_id, product_id, mode, quantity, product:products(id, brand_id, name, description, size, price_cents, rent_cents, image_url, image_urls, brand:brands(id, name))';

export async function fetchCart(ownerId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(CART_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  assertNoError(error, 'No se pudo cargar el carrito');
  return (data ?? []) as unknown as CartItem[];
}

export async function addCartItem(
  ownerId: string,
  productId: string,
  mode: CartMode
): Promise<CartItem> {
  const { data, error } = await supabase
    .from('cart_items')
    .insert({ owner_id: ownerId, product_id: productId, mode })
    .select(CART_SELECT)
    .single();
  assertNoError(error, 'No se pudo añadir al carrito');
  return data as unknown as CartItem;
}

export async function removeCartItem(id: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', id);
  assertNoError(error, 'No se pudo quitar del carrito');
}
