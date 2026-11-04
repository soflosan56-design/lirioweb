import type { WardrobeItem } from '@/lib/types';

export type ForYouReason = 'brand' | 'size';
export type ForYouPick = { item: WardrobeItem; reasons: ForYouReason[] };

const normalize = (value: string | null) => (value ?? '').trim().toLowerCase();

export function rankForYou(
  candidates: WardrobeItem[],
  mine: WardrobeItem[],
  viewerId: string | null,
  limit: number
): ForYouPick[] {
  const myBrands = new Set(mine.map((item) => normalize(item.brand)).filter(Boolean));
  const mySizes = new Set(mine.map((item) => normalize(item.size)).filter(Boolean));

  const scored = candidates
    .filter((item) => item.owner_id !== viewerId)
    .map((item, index) => {
      const reasons: ForYouReason[] = [];
      if (myBrands.has(normalize(item.brand))) reasons.push('brand');
      if (mySizes.has(normalize(item.size))) reasons.push('size');
      return { pick: { item, reasons }, score: reasons.length, index };
    });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, limit).map((entry) => entry.pick);
}
