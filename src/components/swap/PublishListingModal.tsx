import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import ImageUploader from '@/components/ui/ImageUploader';
import GarmentFields from '@/components/swap/GarmentFields';
import { EMPTY_GARMENT_FORM, toGarmentDetails, type GarmentFormValues } from '@/lib/garment';
import { createListing } from '@/lib/api';
import type { SwapListing } from '@/lib/types';

type PublishListingModalProps = {
  ownerId: string;
  onClose: () => void;
  onPublished: (listing: SwapListing) => void;
};

export default function PublishListingModal({ ownerId, onClose, onPublished }: PublishListingModalProps) {
  const [title, setTitle] = useState('');
  const [garment, setGarment] = useState<GarmentFormValues>(EMPTY_GARMENT_FORM);
  const [wanted, setWanted] = useState('');
  const [value, setValue] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const estimated = Number(value);
    if (photos.length === 0) return setError('Añade al menos una foto de la prenda.');
    if (!title.trim()) return setError('Ponle un nombre a tu prenda.');
    if (!Number.isInteger(estimated) || estimated <= 0) {
      return setError('El valor debe ser un número entero mayor que cero.');
    }
    setSubmitting(true);
    setError(null);
    try {
      const listing = await createListing({
        owner_id: ownerId,
        title: title.trim(),
        ...toGarmentDetails(garment),
        image_urls: photos,
        wanted: wanted.trim() || null,
        estimated_value: estimated,
      });
      onPublished(listing);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar la prenda.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Publicar prenda" onClose={onClose} maxWidthClass="max-w-3xl">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <span className="field-label">Fotos de la prenda</span>
          <ImageUploader ownerId={ownerId} urls={photos} max={3} onChange={setPhotos} />
        </div>
        <label>
          <span className="field-label">Nombre de la prenda</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ej. Chaqueta denim con parches" />
        </label>
        <GarmentFields values={garment} onChange={(patch) => setGarment((prev) => ({ ...prev, ...patch }))} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Valor estimado</span>
            <input className="field" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="8000" />
          </label>
          <label>
            <span className="field-label">Qué buscas a cambio</span>
            <input className="field" value={wanted} onChange={(e) => setWanted(e.target.value)} maxLength={120} placeholder="Botas, bolso de cuero, abrigo..." />
          </label>
        </div>

        {error && (
          <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-3 py-2 text-sm font-bold text-pink-900">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="scrap-button bg-paper-50 px-5 py-2.5 text-lg text-ink-900">
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="scrap-button bg-yellow-500 px-5 py-2.5 text-lg text-ink-900 hover:bg-yellow-300">
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
