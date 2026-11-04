import { useCallback, useEffect, useState } from 'react';
import { fetchBidderCounts, fetchListings } from '@/lib/api';
import type { SwapListing } from '@/lib/types';

export function useListings() {
  const [listings, setListings] = useState<SwapListing[]>([]);
  const [bidderCounts, setBidderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchListings(), fetchBidderCounts()])
      .then(([listingData, counts]) => {
        if (cancelled) return;
        setListings(listingData);
        setBidderCounts(counts);
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const addListing = useCallback((listing: SwapListing) => {
    setListings((prev) => [listing, ...prev]);
  }, []);

  const removeListing = useCallback((id: string) => {
    setListings((prev) => prev.filter((listing) => listing.id !== id));
  }, []);

  const refreshBidderCounts = useCallback(() => {
    fetchBidderCounts()
      .then(setBidderCounts)
      .catch(() => undefined);
  }, []);

  return { listings, bidderCounts, loading, error, addListing, removeListing, refreshBidderCounts };
}
