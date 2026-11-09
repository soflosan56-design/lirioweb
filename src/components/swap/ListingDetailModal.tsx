import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import BidCard from '@/components/swap/BidCard';
import BidForm from '@/components/swap/BidForm';
import GarmentDetailsView from '@/components/swap/GarmentDetailsView';
import PhotoGallery from '@/components/swap/PhotoGallery';
import { deleteListing, fetchBids, sendMessage } from '@/lib/api';
import { addFavoriteListing, fetchFavoriteListingIds, removeFavoriteListing } from '@/lib/favoritesApi';
import { formatValue } from '@/lib/format';
import type { SwapBid, SwapListing } from '@/lib/types';

type ListingDetailModalProps = {
  listing: SwapListing;
  userId: string | null;
  onClose: () => void;
  onRequireLogin: () => void;
  onRemoved: (id: string) => void;
  onStartConversation: (otherId: string) => void;
  onBidCreated: () => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

function bidMessageBody(bid: SwapBid, listingTitle: string): string {
  const details = [bid.brand, bid.size && `talla ${bid.size}`, bid.condition].filter(Boolean).join(' · ');
  const lines = [
    `Te propongo un cambio por "${listingTitle}" con: ${bid.offer_title}${details ? ` (${details})` : ''}.`,
    `Valor estimado: ${formatValue(bid.offer_value)}. Puedes ver sus fotos entre las pujas del anuncio.`,
  ];
  if (bid.message) lines.push(bid.message);
  return lines.join('\n');
}

export default function ListingDetailModal({ listing, userId, onClose, onRequireLogin, onRemoved, onStartConversation, onBidCreated, onNotify }: ListingDetailModalProps) {
  const isOwner = userId !== null && listing.owner_id === userId;
  const [bids, setBids] = useState<SwapBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [favorite, setFavorite] = useState<boolean | null>(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchFavoriteListingIds(userId)
      .then((ids) => !cancelled && setFavorite(ids.includes(listing.id)))
      .catch((err: Error) => !cancelled && onNotify(err.message, 'error'));
    return () => {
      cancelled = true;
    };
  }, [userId, listing.id, onNotify]);

  useEffect(() => {
    let cancelled = false;
    fetchBids(listing.id)
      .then((data) => !cancelled && setBids(data))
      .catch((err: Error) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  async function handleBidCreated(bid: SwapBid) {
    setBids((prev) => [bid, ...prev].sort((a, b) => b.offer_value - a.offer_value));
    setShowForm(false);
    onBidCreated();
    try {
      await sendMessage({
        listing_id: listing.id,
        sender_id: bid.bidder_id,
        recipient_id: listing.owner_id,
        body: bidMessageBody(bid, listing.title),
      });
      onNotify('Puja enviada al dueño por el chat', 'success');
    } catch {
      onNotify('Tu puja está registrada, pero no se pudo avisar al dueño por el chat', 'error');
    }
  }

  async function toggleFavorite() {
    if (!userId || favorite === null || favoriteBusy) return;
    setFavoriteBusy(true);
    try {
      if (favorite) {
        await removeFavoriteListing(userId, listing.id);
        setFavorite(false);
        onNotify('Quitada de tus favoritos', 'success');
      } else {
        await addFavoriteListing(listing.id);
        setFavorite(true);
        onNotify('Guardada en tus favoritos', 'success');
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo actualizar el favorito', 'error');
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function handleRemove() {
    try {
      await deleteListing(listing.id);
      onRemoved(listing.id);
      onClose();
      onNotify('Prenda retirada', 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo retirar la prenda', 'error');
    }
  }

  const leader = bids[0];
  const bidderCount = new Set(bids.map((bid) => bid.bidder_id)).size;

  return (
    <Modal title={listing.title} onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="grid gap-6 md:grid-cols-2">
        <PhotoGallery urls={listing.image_urls} alt={listing.title} />

        <div className="space-y-4">
          <GarmentDetailsView details={listing} />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="border-2 border-ink-900 bg-white p-3">
              <dt className="font-display uppercase text-ink-600">Valor</dt>
              <dd className="font-bold">{listing.estimated_value !== null ? formatValue(listing.estimated_value) : 'Sin valorar'}</dd>
            </div>
          </dl>
          <p className="border-l-4 border-pink-500 pl-3 font-hand text-lg text-pink-700">
            Busca: {listing.wanted ?? 'lo que tenga sentido para ti'}
          </p>

          {!showForm && !isOwner && (
            <button type="button" onClick={() => (userId ? setShowForm(true) : onRequireLogin())} className="scrap-button w-full bg-pink-500 px-5 py-3 text-xl text-ink-900 hover:bg-pink-300">
              Hacer una puja
            </button>
          )}

          {!isOwner && userId && (
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={favorite === null || favoriteBusy}
              className="scrap-button w-full bg-white px-5 py-3 text-lg text-ink-900 hover:bg-yellow-100 disabled:opacity-60"
            >
              <Heart className={`h-5 w-5 ${favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
              {favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            </button>
          )}

          {!isOwner && (
            <button type="button" onClick={() => (userId ? onStartConversation(listing.owner_id) : onRequireLogin())} className="scrap-button w-full bg-white px-5 py-3 text-lg text-ink-900 hover:bg-yellow-100">
              <MessageCircle className="h-5 w-5" /> Escribir al dueño
            </button>
          )}

          {showForm && userId && (
            <BidForm listingId={listing.id} userId={userId} onCreated={handleBidCreated} onCancel={() => setShowForm(false)} />
          )}

          {isOwner && (
            <button type="button" onClick={handleRemove} className="scrap-button w-full bg-paper-50 px-4 py-2.5 text-base text-ink-900 hover:bg-pink-100">
              <Trash2 className="h-4 w-4" /> Retirar prenda
            </button>
          )}
        </div>
      </div>

      <section className="mt-8 border-t-4 border-ink-900 pt-5">
        <h3 className="font-display text-2xl uppercase">
          Pujas · {bidderCount} {bidderCount === 1 ? 'persona' : 'personas'}
        </h3>
        {loading && <p className="mt-3 text-ink-600">Cargando pujas...</p>}
        {loadError && <p role="alert" className="mt-3 font-bold text-pink-700">{loadError}</p>}
        {!loading && !loadError && bids.length === 0 && (
          <p className="mt-3 font-hand text-lg text-ink-600">Aún nadie ha pujado. Sé el primero.</p>
        )}
        <ul className="mt-3 space-y-3">
          {bids.map((bid) => (
            <div key={bid.id} className="space-y-2">
              <BidCard bid={bid} isLeader={bid.id === leader?.id} />
              {userId && bid.bidder_id !== userId && (
                <button type="button" onClick={() => onStartConversation(bid.bidder_id)} className="scrap-button bg-white px-4 py-2 text-sm text-ink-900 hover:bg-yellow-100">
                  <MessageCircle className="h-4 w-4" /> Chatear con esta persona
                </button>
              )}
            </div>
          ))}
        </ul>
      </section>
    </Modal>
  );
}
