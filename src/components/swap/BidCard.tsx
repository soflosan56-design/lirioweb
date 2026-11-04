import { Crown } from 'lucide-react';
import GarmentDetailsView from '@/components/swap/GarmentDetailsView';
import PhotoGallery from '@/components/swap/PhotoGallery';
import { formatValue } from '@/lib/format';
import type { SwapBid } from '@/lib/types';

type BidCardProps = {
  bid: SwapBid;
  isLeader: boolean;
};

export default function BidCard({ bid, isLeader }: BidCardProps) {
  return (
    <li className={`space-y-4 border-2 border-ink-900 p-4 ${isLeader ? 'bg-yellow-300' : 'bg-white'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl uppercase">{bid.offer_title}</p>
        <div className="flex items-center gap-2">
          {isLeader && (
            <span className="inline-flex items-center gap-1 bg-ink-900 px-2 py-0.5 font-display text-xs uppercase text-yellow-500">
              <Crown className="h-3 w-3" /> Líder
            </span>
          )}
          <span className="font-display text-xl">{formatValue(bid.offer_value)}</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <PhotoGallery urls={bid.offer_image_urls} alt={bid.offer_title} aspectClass="aspect-square" />
        <GarmentDetailsView details={bid} />
      </div>
      {bid.message && <p className="text-sm text-ink-600">“{bid.message}”</p>}
    </li>
  );
}
