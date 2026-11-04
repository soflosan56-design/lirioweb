import { useEffect, useMemo, useState } from 'react';
import { getOrCreateListingForWardrobeItem } from '@/lib/api';
import { fetchWardrobeFeed } from '@/lib/wardrobeApi';
import type { SwapListing, WardrobeItem } from '@/lib/types';

type CommunityGarmentMatchesProps = {
  query: string;
  onOpenWardrobe: (ownerId: string) => void;
  onOpenListing: (listing: SwapListing) => void;
  userId: string | null;
  onRequireLogin: () => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

const FEED_LIMIT = 300;

function matches(item: WardrobeItem, query: string): boolean {
  const haystack = [item.name, item.brand, item.material, item.description, item.size, item.condition]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function CommunityGarmentMatches({
  query,
  onOpenWardrobe,
  onOpenListing,
  userId,
  onRequireLogin,
  onNotify,
}: CommunityGarmentMatchesProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const normalized = query.trim().toLowerCase();

  useEffect(() => {
    let cancelled = false;
    fetchWardrobeFeed(FEED_LIMIT)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBid = async (item: WardrobeItem) => {
    if (!userId) {
      onRequireLogin();
      return;
    }
    setOpeningId(item.id);
    try {
      onOpenListing(await getOrCreateListingForWardrobeItem(item.id));
    } catch (err) {
      onNotify((err as Error).message, 'error');
    } finally {
      setOpeningId(null);
    }
  };

  const results = useMemo(
    () => items.filter((item) => matches(item, normalized)),
    [items, normalized]
  );

  return (
    <section className="mb-10 space-y-4 border-2 border-ink-900 bg-white p-5">
      <h2 className="font-display text-2xl uppercase tracking-wide text-ink-900">Prendas de la comunidad</h2>
      {loading && <p className="font-hand text-lg text-ink-600">Buscando en los armarios...</p>}
      {error && <p role="alert" className="font-bold text-pink-900">No se pudieron buscar las prendas: {error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="font-hand text-lg text-ink-600">Ninguna prenda de los armarios coincide con "{query.trim()}".</p>
      )}
      {results.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {results.map((item) => (
            <li key={item.id} className="space-y-2">
              <img src={item.image_url} alt={item.name} loading="lazy" className="aspect-[3/4] w-full border-2 border-ink-900 object-cover" />
              <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>
              <p className="truncate text-xs text-ink-700">{[item.brand, item.size].filter(Boolean).join(' · ')}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={openingId === item.id}
                  onClick={() => handleBid(item)}
                  className="scrap-button bg-pink-500 px-3 py-1 text-xs text-ink-900 hover:bg-pink-300 disabled:opacity-60"
                >
                  {openingId === item.id ? 'Abriendo...' : 'Pujar'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenWardrobe(item.owner_id)}
                  className="text-xs font-medium text-pink-700 underline-offset-2 hover:underline"
                >
                  Ver armario
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
