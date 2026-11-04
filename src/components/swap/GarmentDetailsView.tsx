import { useState } from 'react';
import type { GarmentDetails } from '@/lib/types';

const DETAIL_ROWS: { key: Exclude<keyof GarmentDetails, 'description'>; label: string }[] = [
  { key: 'brand', label: 'Marca' },
  { key: 'size', label: 'Talla' },
  { key: 'condition', label: 'Estado' },
  { key: 'material', label: 'Material' },
];

type GarmentDetailsViewProps = {
  details: GarmentDetails;
};

export default function GarmentDetailsView({ details }: GarmentDetailsViewProps) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {DETAIL_ROWS.map((row) => (
          <div key={row.key} className="border-2 border-ink-900 bg-white p-3">
            <dt className="font-display uppercase text-ink-600">{row.label}</dt>
            <dd className="font-bold">{details[row.key] ?? '-'}</dd>
          </div>
        ))}
      </dl>
      {details.description && <p className="whitespace-pre-line text-base leading-relaxed text-ink-800">{details.description}</p>}
    </div>
  );
}
