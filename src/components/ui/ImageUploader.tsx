import { useState, type ChangeEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadImage } from '@/lib/api';

type ImageUploaderProps = {
  ownerId: string;
  urls: string[];
  max: number;
  onChange: (urls: string[]) => void;
};

export default function ImageUploader({ ownerId, urls, max, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, max - urls.length);
    event.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadImage(ownerId, file));
      }
      onChange([...urls, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  const canAdd = urls.length < max && !uploading;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {urls.map((url) => (
          <div key={url} className="relative -rotate-1 border-2 border-ink-900 bg-white p-1 shadow-hard-sm">
            <img src={url} alt="Imagen subida" className="aspect-square w-full object-cover" />
            <button
              type="button"
              aria-label="Quitar imagen"
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center border-2 border-ink-900 bg-pink-500 text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {canAdd && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-ink-900 bg-yellow-100 text-center font-display text-xs uppercase transition-colors hover:bg-yellow-300">
            <ImagePlus className="h-6 w-6" />
            Subir
            <input type="file" accept="image/*" multiple={max > 1} onChange={handleFiles} className="sr-only" />
          </label>
        )}
        {uploading && (
          <div className="flex aspect-square items-center justify-center border-2 border-ink-900 bg-white">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-ink-600">Hasta {max} {max === 1 ? 'foto' : 'fotos'} · JPG o PNG de hasta 5 MB</p>
      {error && <p role="alert" className="text-sm font-bold text-pink-700">{error}</p>}
    </div>
  );
}
