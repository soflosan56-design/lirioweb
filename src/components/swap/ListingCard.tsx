import { Tag } from 'lucide-react';
import type { SwapListing } from '@/lib/types';
import { formatValue } from '@/lib/format';

type ListingCardProps = {
  listing: SwapListing;
  bidderCount: number;
  rotate: string;
  onOpen: (listing: SwapListing) => void;
};

export default function ListingCard({ listing, bidderCount, rotate, onOpen }: ListingCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(listing)}
      className={`group relative block w-full bg-paper-50 p-3 text-left border-2 border-ink-900 shadow-hard transition-all duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[10px_10px_0_0_#FFE14D] ${rotate}`}
    >
      <span className="tape -top-3 left-1/2 w-20 -translate-x-1/2 rotate-2" />
      <div className="relative overflow-hidden border-2 border-ink-900">
        <img
          src={listing.image_urls[0] ?? ''}
          alt={listing.title}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 bg-neon-500 px-2 py-0.5 font-hand text-sm text-ink-900">
          {listing.condition ?? 'Usado'}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="font-display text-2xl uppercase leading-tight text-ink-900">{listing.title}</p>
        <p className="text-sm text-ink-600">
          {listing.brand ?? 'Sin marca'} · Talla {listing.size ?? '-'}
        </p>
        <p className="font-bold text-sm text-pink-700">
          {bidderCount === 0 ? 'Nadie ha pujado aún' : `${bidderCount} ${bidderCount === 1 ? 'persona ha pujado' : 'personas han pujado'}`}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-dashed border-ink-900 pt-3">
        <span className="inline-flex items-center gap-1 text-sm font-bold text-ink-900">
          <Tag className="h-4 w-4" />
          {listing.estimated_value !== null ? formatValue(listing.estimated_value) : 'Sin valorar'}
        </span>
        <span className="font-hand text-pink-700">ver pujas</span>
      </div>
    </button>
  );
}
