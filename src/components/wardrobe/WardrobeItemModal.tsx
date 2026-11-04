import { useState, type FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import ImageUploader from '@/components/ui/ImageUploader';
import GarmentFields from '@/components/swap/GarmentFields';
import { EMPTY_GARMENT_FORM, toGarmentDetails, type GarmentFormValues } from '@/lib/garment';
import { createWardrobeItem, updateWardrobeItem, type WardrobeItemInput } from '@/lib/wardrobeApi';
import type { WardrobeItem } from '@/lib/types';

type WardrobeItemModalProps = {
  ownerId: string;
  item: WardrobeItem | null;
  onClose: () => void;
  onSaved: (item: WardrobeItem) => void;
};

function initialGarment(item: WardrobeItem | null): GarmentFormValues {
  if (!item) return EMPTY_GARMENT_FORM;
  return {
    brand: item.brand ?? '',
    size: item.size ?? '',
    condition: item.condition ?? EMPTY_GARMENT_FORM.condition,
    material: item.material ?? '',
    description: item.description ?? '',
  };
}

export default function WardrobeItemModal({ ownerId, item, onClose, onSaved }: WardrobeItemModalProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [photos, setPhotos] = useState<string[]>(item ? [item.image_url] : []);
  const [garment, setGarment] = useState<GarmentFormValues>(() => initialGarment(item));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photos.length === 0) return setError('Añade una foto de la prenda.');
    if (!name.trim()) return setError('Ponle un nombre a la prenda.');
    const input: WardrobeItemInput = {
      name: name.trim(),
      image_url: photos[0],
      ...toGarmentDetails(garment),
    };
    setSubmitting(true);
    setError(null);
    try {
      const saved = item ? await updateWardrobeItem(item.id, input) : await createWardrobeItem(input);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la prenda.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title={item ? 'Editar prenda' : 'Añadir al armario'} onClose={onClose} maxWidthClass="max-w-3xl">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <span className="field-label">Foto de la prenda</span>
          <ImageUploader ownerId={ownerId} urls={photos} max={1} onChange={setPhotos} />
        </div>
        <label>
          <span className="field-label">Nombre de la prenda</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Ej. Abrigo de lana camel" />
        </label>
        <GarmentFields values={garment} onChange={(patch) => setGarment((prev) => ({ ...prev, ...patch }))} />

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
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
