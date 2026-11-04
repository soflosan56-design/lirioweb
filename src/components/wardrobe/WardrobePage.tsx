import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GarmentDetailsView from '@/components/swap/GarmentDetailsView';
import ListingDetailModal from '@/components/swap/ListingDetailModal';
import MessageThread from '@/components/messages/MessageThread';
import WardrobeItemModal from '@/components/wardrobe/WardrobeItemModal';
import { getOrCreateListingForWardrobeItem } from '@/lib/api';
import { deleteWardrobeItem, fetchProfile, fetchWardrobeItems } from '@/lib/wardrobeApi';
import type { ConversationTarget, Profile, SwapListing, WardrobeItem } from '@/lib/types';

type WardrobePageProps = {
  ownerId: string;
  viewerId: string | null;
  onBack: () => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function WardrobePage({ ownerId, viewerId, onBack, onNotify }: WardrobePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WardrobeItem | 'new' | null>(null);
  const [viewing, setViewing] = useState<WardrobeItem | null>(null);
  const [openingListing, setOpeningListing] = useState(false);
  const [openedListing, setOpenedListing] = useState<SwapListing | null>(null);
  const [conversation, setConversation] = useState<ConversationTarget | null>(null);

  const isOwner = viewerId === ownerId;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextProfile, nextItems] = await Promise.all([fetchProfile(ownerId), fetchWardrobeItems(ownerId)]);
      setProfile(nextProfile);
      setItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el armario.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function openGarmentListing(item: WardrobeItem) {
    if (!viewerId) {
      onNotify('Entra con tu cuenta para pujar o escribir al dueño', 'error');
      return;
    }
    setOpeningListing(true);
    try {
      const listing = await getOrCreateListingForWardrobeItem(item.id);
      setViewing(null);
      setOpenedListing(listing);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo abrir la puja de esta prenda', 'error');
    } finally {
      setOpeningListing(false);
    }
  }

  function handleSaved(saved: WardrobeItem) {
    setItems((prev) => (prev.some((item) => item.id === saved.id) ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]));
    setViewing((current) => (current?.id === saved.id ? saved : current));
  }

  async function handleDelete(item: WardrobeItem) {
    if (!window.confirm(`¿Borrar "${item.name}" de tu armario?`)) return;
    try {
      await deleteWardrobeItem(item.id);
      setItems((prev) => prev.filter((current) => current.id !== item.id));
      setViewing(null);
      onNotify('Prenda borrada', 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo borrar la prenda.', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-display text-lg uppercase tracking-wide text-ink-900 hover:text-pink-700">
        <ArrowLeft className="h-5 w-5" />
        Todos los armarios
      </button>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ink-900" />
        </div>
      )}

      {!loading && error && (
        <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-4 py-3 font-bold text-pink-900">
          {error}
        </p>
      )}

      {!loading && !error && !profile && (
        <p className="py-20 text-center font-hand text-2xl text-ink-700">Este armario no existe.</p>
      )}

      {!loading && !error && profile && (
        <>
          <header className="flex flex-col gap-6 border-b-4 border-ink-900 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`Foto de ${profile.display_name}`} className="h-24 w-24 -rotate-3 border-4 border-ink-900 object-cover shadow-hard" />
              ) : (
                <span className="flex h-24 w-24 -rotate-3 items-center justify-center border-4 border-ink-900 bg-pink-500 font-display text-5xl text-ink-900 shadow-hard">
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="space-y-2">
                <p className="font-hand text-lg text-pink-700">armario de</p>
                <h1 className="font-display text-5xl uppercase leading-[1.1] tracking-wide text-ink-900">{profile.display_name}</h1>
                <p className="text-sm text-ink-600">
                  {[profile.city, profile.style].filter(Boolean).join(' · ') || 'Sin ciudad ni estilo todavía'}
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditing('new')}
                className="scrap-button self-start bg-yellow-500 px-5 py-2.5 text-lg text-ink-900 hover:bg-yellow-300 sm:self-auto"
              >
                <Plus className="h-5 w-5" />
                Añadir prenda
              </button>
            )}
          </header>

          {profile.bio && <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-ink-800">{profile.bio}</p>}

          {items.length === 0 ? (
            <p className="py-16 text-center font-hand text-2xl text-ink-700">
              {isOwner ? 'Tu armario está vacío. Añade tu primera prenda.' : 'Todavía no hay prendas en este armario.'}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setViewing(item)}
                    className={`group block w-full bg-paper-50 p-3 text-left border-2 border-ink-900 shadow-hard transition-all duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#FFE14D] ${index % 2 ? 'rotate-1' : '-rotate-1'}`}
                  >
                    <div className="overflow-hidden border-2 border-ink-900">
                      <img src={item.image_url} alt={item.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="font-display text-xl uppercase leading-tight text-ink-900">{item.name}</p>
                      <p className="text-sm text-ink-600">{item.brand ?? 'Sin marca'} · Talla {item.size ?? '-'}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)} maxWidthClass="max-w-3xl">
          <div className="grid gap-6 md:grid-cols-2">
            <img src={viewing.image_url} alt={viewing.name} className="w-full border-2 border-ink-900 object-cover" />
            <div className="space-y-5">
              <GarmentDetailsView details={viewing} />
              {!isOwner && (
                <button
                  type="button"
                  disabled={openingListing}
                  onClick={() => openGarmentListing(viewing)}
                  className="scrap-button w-full bg-pink-500 px-5 py-3 text-lg text-ink-900 hover:bg-pink-300 disabled:opacity-60"
                >
                  <MessageCircle className="h-5 w-5" />
                  {openingListing ? 'Abriendo...' : 'Pujar o escribir al dueño'}
                </button>
              )}
              {isOwner && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(viewing);
                      setViewing(null);
                    }}
                    className="scrap-button bg-paper-50 px-4 py-2 text-base text-ink-900 hover:bg-neon-300"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(viewing)}
                    className="scrap-button bg-pink-500 px-4 py-2 text-base text-ink-900 hover:bg-pink-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Borrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {openedListing && viewerId && (
        <ListingDetailModal
          listing={openedListing}
          userId={viewerId}
          onClose={() => setOpenedListing(null)}
          onRequireLogin={() => onNotify('Entra con tu cuenta para continuar', 'error')}
          onRemoved={() => setOpenedListing(null)}
          onStartConversation={(otherId) => {
            setConversation({ listingId: openedListing.id, listingTitle: openedListing.title, otherId });
            setOpenedListing(null);
          }}
          onBidCreated={() => undefined}
          onNotify={onNotify}
        />
      )}

      {conversation && viewerId && (
        <MessageThread target={conversation} meId={viewerId} onClose={() => setConversation(null)} />
      )}

      {editing && isOwner && (
        <WardrobeItemModal
          ownerId={ownerId}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
