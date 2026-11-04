import { useMemo, useState } from 'react';
import { Inbox, LogIn, Plus, Repeat } from 'lucide-react';
import ListingCard from '@/components/swap/ListingCard';
import ListingDetailModal from '@/components/swap/ListingDetailModal';
import CommunityGarmentMatches from '@/components/swap/CommunityGarmentMatches';
import ForYouStrip from '@/components/swap/ForYouStrip';
import PublishListingModal from '@/components/swap/PublishListingModal';
import SwapFilterBar from '@/components/swap/SwapFilterBar';
import InboxModal from '@/components/messages/InboxModal';
import MessageThread from '@/components/messages/MessageThread';
import { useListings } from '@/hooks/useListings';
import { distinctValues, filterListings, NO_SWAP_FILTERS, type SwapFilters } from '@/lib/swapFilters';
import type { ConversationTarget, SwapListing } from '@/lib/types';

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];

type SwapPageProps = {
  userId: string | null;
  onRequireLogin: () => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
  onOpenWardrobe: (ownerId: string) => void;
};

export default function SwapPage({ userId, onRequireLogin, onNotify, onOpenWardrobe }: SwapPageProps) {
  const { listings, bidderCounts, loading, error, addListing, removeListing, refreshBidderCounts } = useListings();
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<SwapListing | null>(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [conversation, setConversation] = useState<ConversationTarget | null>(null);
  const [filters, setFilters] = useState<SwapFilters>(NO_SWAP_FILTERS);

  const sizes = useMemo(() => distinctValues(listings, 'size'), [listings]);
  const brands = useMemo(() => distinctValues(listings, 'brand'), [listings]);
  const conditions = useMemo(() => distinctValues(listings, 'condition'), [listings]);
  const visibleListings = useMemo(() => filterListings(listings, filters), [listings, filters]);

  const openCommunityListing = (listing: SwapListing) => {
    if (!listings.some((item) => item.id === listing.id)) addListing(listing);
    setSelected(listing);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <header className="relative mb-12 flex flex-col gap-6 border-b-4 border-ink-900 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="sticker-label -rotate-2 bg-yellow-500 text-ink-900">
            <Repeat className="mr-1 inline h-4 w-4" /> Intercambio
          </span>
          <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
            Swap<span className="text-pink-500">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-800">
            Publica lo que ya no usas y puja por lo que te gusta.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 self-start md:self-auto">
          {userId && (
            <button
              type="button"
              onClick={() => setInboxOpen(true)}
              className="scrap-button bg-white px-5 py-3 text-xl text-ink-900 hover:bg-yellow-100"
            >
              <Inbox className="h-5 w-5" /> Mensajes
            </button>
          )}
          <button
            type="button"
            onClick={() => (userId ? setPublishing(true) : onRequireLogin())}
            className="scrap-button bg-pink-500 px-6 py-3 text-xl text-ink-900 hover:bg-pink-300"
          >
            <Plus className="h-5 w-5" /> Publicar prenda
          </button>
        </div>
      </header>

      {!userId && (
        <div className="relative mb-10 flex flex-col items-start gap-4 border-2 border-ink-900 bg-white p-5 shadow-hard-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-hand text-xl text-pink-700">Entra con tu cuenta para publicar prendas, pujar y escribir a otros miembros.</p>
          <button type="button" onClick={onRequireLogin} className="scrap-button bg-yellow-500 px-4 py-2 text-base text-ink-900">
            <LogIn className="h-4 w-4" /> Entrar
          </button>
        </div>
      )}

      <ForYouStrip userId={userId} onOpenWardrobe={onOpenWardrobe} />

      {loading && <p className="font-hand text-xl text-ink-600">Cargando prendas...</p>}
      {error && <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">No se pudieron cargar las prendas: {error}</p>}
      {!loading && !error && listings.length === 0 && (
        <p className="font-hand text-2xl text-ink-600">Todavía no hay prendas. ¡Sé la primera persona en publicar!</p>
      )}

      {!loading && !error && listings.length > 0 && (
        <SwapFilterBar
          filters={filters}
          sizes={sizes}
          brands={brands}
          conditions={conditions}
          shown={visibleListings.length}
          total={listings.length}
          onChange={setFilters}
        />
      )}

      {!loading && !error && listings.length > 0 && visibleListings.length === 0 && (
        <p className="font-hand text-2xl text-ink-600">Ninguna prenda coincide con esos filtros.</p>
      )}

      {filters.query.trim() !== '' && (
        <CommunityGarmentMatches
          query={filters.query}
          onOpenWardrobe={onOpenWardrobe}
          onOpenListing={openCommunityListing}
          userId={userId}
          onRequireLogin={onRequireLogin}
          onNotify={onNotify}
        />
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {visibleListings.map((listing, index) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            bidderCount={bidderCounts[listing.id] ?? 0}
            rotate={ROTATIONS[index % ROTATIONS.length]}
            onOpen={setSelected}
          />
        ))}
      </div>

      {publishing && userId && (
        <PublishListingModal
          ownerId={userId}
          onClose={() => setPublishing(false)}
          onPublished={(listing) => {
            addListing(listing);
            onNotify('Prenda publicada', 'success');
          }}
        />
      )}

      {selected && (
        <ListingDetailModal
          listing={selected}
          userId={userId}
          onClose={() => setSelected(null)}
          onRequireLogin={onRequireLogin}
          onRemoved={removeListing}
          onStartConversation={(otherId) => {
            setConversation({ listingId: selected.id, listingTitle: selected.title, otherId });
            setSelected(null);
          }}
          onBidCreated={refreshBidderCounts}
          onNotify={onNotify}
        />
      )}

      {inboxOpen && userId && (
        <InboxModal
          meId={userId}
          onClose={() => setInboxOpen(false)}
          onOpen={(target) => {
            setInboxOpen(false);
            setConversation(target);
          }}
        />
      )}

      {conversation && userId && (
        <MessageThread target={conversation} meId={userId} onClose={() => setConversation(null)} />
      )}
    </div>
  );
}
