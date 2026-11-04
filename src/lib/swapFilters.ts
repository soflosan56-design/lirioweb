import type { SwapListing } from '@/lib/types';

export type SwapFilters = {
  query: string;
  size: string;
  brand: string;
  condition: string;
};

export const NO_SWAP_FILTERS: SwapFilters = { query: '', size: '', brand: '', condition: '' };

export function hasActiveFilters(filters: SwapFilters): boolean {
  return filters.query.trim() !== '' || filters.size !== '' || filters.brand !== '' || filters.condition !== '';
}

function matchesQuery(listing: SwapListing, query: string): boolean {
  if (!query) return true;
  const haystack = [listing.title, listing.brand, listing.material, listing.description, listing.wanted]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export function filterListings(listings: SwapListing[], filters: SwapFilters): SwapListing[] {
  const query = filters.query.trim().toLowerCase();
  return listings.filter(
    (listing) =>
      matchesQuery(listing, query) &&
      (filters.size === '' || listing.size === filters.size) &&
      (filters.brand === '' || listing.brand === filters.brand) &&
      (filters.condition === '' || listing.condition === filters.condition)
  );
}

export function distinctValues(listings: SwapListing[], key: 'size' | 'brand' | 'condition'): string[] {
  const values = new Set<string>();
  for (const listing of listings) {
    const value = listing[key]?.trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'es-ES'));
}
