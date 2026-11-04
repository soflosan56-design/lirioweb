import { useState, type FormEvent } from 'react';
import { Shirt } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ImageUploader from '@/components/ui/ImageUploader';
import type { Profile, ProfileEdits } from '@/lib/types';

type ProfileModalProps = {
  profile: Profile;
  onClose: () => void;
  onSave: (fields: ProfileEdits) => Promise<unknown>;
  onSignOut: () => Promise<void>;
  onOpenWardrobe: () => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function ProfileModal({ profile, onClose, onSave, onSignOut, onOpenWardrobe, onNotify }: ProfileModalProps) {
  const [name, setName] = useState(profile.display_name);
  const [city, setCity] = useState(profile.city ?? '');
  const [style, setStyle] = useState(profile.style ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatar, setAvatar] = useState<string[]>(profile.avatar_url ? [profile.avatar_url] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return setError('Necesitas un nombre para tu perfil.');
    setSaving(true);
    setError(null);
    try {
      await onSave({
        display_name: name.trim(),
        city: city.trim() || null,
        style: style.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatar[0] ?? null,
      });
      onNotify('Perfil guardado', 'success');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
      setSaving(false);
    }
  }

  return (
    <Modal title="Tu perfil" onClose={onClose} maxWidthClass="max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <div className="w-40 shrink-0">
          <ImageUploader ownerId={profile.id} urls={avatar} max={1} onChange={setAvatar} />
        </div>
        <p className="font-hand text-lg text-pink-700">así te verán en el swap y en tu armario</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="field-label">Nombre</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        <label className="block">
          <span className="field-label">Ciudad</span>
          <input className="field" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
        </label>
        <label className="block">
          <span className="field-label">Tu estilo</span>
          <input className="field" value={style} onChange={(e) => setStyle(e.target.value)} maxLength={60} placeholder="Y2K, grunge, minimal..." />
        </label>
        <label className="block">
          <span className="field-label">Biografía</span>
          <textarea
            className="field min-h-24"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={400}
            placeholder="Cuéntanos quién eres y qué te gusta vestir."
          />
        </label>
        {error && <p role="alert" className="text-sm font-bold text-pink-700">{error}</p>}
        <button
          type="button"
          onClick={onOpenWardrobe}
          className="scrap-button w-full bg-neon-500 px-5 py-2.5 text-lg text-ink-900 hover:bg-neon-300"
        >
          <Shirt className="h-5 w-5" />
          Ver mi armario
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await onSignOut();
                onNotify('Sesión cerrada', 'success');
                onClose();
              } catch (err) {
                onNotify(err instanceof Error ? err.message : 'No se pudo cerrar la sesión', 'error');
              }
            }}
            className="scrap-button bg-paper-50 px-5 py-2.5 text-base text-ink-900 hover:bg-pink-100"
          >
            Cerrar sesión
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="scrap-button bg-paper-50 px-5 py-2.5 text-lg text-ink-900">Cancelar</button>
            <button type="submit" disabled={saving} className="scrap-button bg-yellow-500 px-5 py-2.5 text-lg text-ink-900 hover:bg-yellow-300">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
