import { useState, type FormEvent } from 'react';
import ImageUploader from '@/components/ui/ImageUploader';
import GarmentFields from '@/components/swap/GarmentFields';
import { createBid } from '@/lib/api';
import { EMPTY_GARMENT_FORM, toGarmentDetails, type GarmentFormValues } from '@/lib/garment';
import type { SwapBid } from '@/lib/types';

type BidFormProps = {
  listingId: string;
  userId: string;
  onCreated: (bid: SwapBid) => void;
  onCancel: () => void;
};

export default function BidForm({ listingId, userId, onCreated, onCancel }: BidFormProps) {
  const [offerTitle, setOfferTitle] = useState('');
  const [offerValue, setOfferValue] = useState('');
  const [garment, setGarment] = useState<GarmentFormValues>(EMPTY_GARMENT_FORM);
  const [offerImages, setOfferImages] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(offerValue);
    if (offerImages.length === 0) return setFormError('Añade al menos una foto de lo que ofreces.');
    if (!offerTitle.trim()) return setFormError('Describe qué ofreces a cambio.');
    if (!Number.isInteger(value) || value <= 0) return setFormError('El valor debe ser un número entero mayor que cero.');
    setSaving(true);
    setFormError(null);
    try {
      const bid = await createBid({
        listing_id: listingId,
        offer_title: offerTitle.trim(),
        offer_value: value,
        offer_image_urls: offerImages,
        ...toGarmentDetails(garment),
        message: message.trim() || null,
      });
      onCreated(bid);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar la puja.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 border-2 border-ink-900 bg-white p-4 shadow-hard-sm">
      <div>
        <span className="field-label">Fotos de tu oferta</span>
        <ImageUploader ownerId={userId} urls={offerImages} max={3} onChange={setOfferImages} />
      </div>
      <label className="block">
        <span className="field-label">Qué ofreces</span>
        <input className="field" value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} maxLength={80} placeholder="Botas negras talla 38" />
      </label>
      <GarmentFields values={garment} onChange={(patch) => setGarment((prev) => ({ ...prev, ...patch }))} />
      <label className="block">
        <span className="field-label">Valor estimado</span>
        <input className="field" inputMode="numeric" value={offerValue} onChange={(e) => setOfferValue(e.target.value)} placeholder="9500" />
      </label>
      <label className="block">
        <span className="field-label">Mensaje (opcional)</span>
        <input className="field" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={140} />
      </label>
      {formError && <p role="alert" className="text-sm font-bold text-pink-700">{formError}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="scrap-button flex-1 bg-paper-50 px-4 py-2 text-base text-ink-900">Cancelar</button>
        <button type="submit" disabled={saving} className="scrap-button flex-1 bg-yellow-500 px-4 py-2 text-base text-ink-900">
          {saving ? 'Enviando...' : 'Enviar puja'}
        </button>
      </div>
    </form>
  );
}
