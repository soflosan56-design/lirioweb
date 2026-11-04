import { useEffect, useState } from 'react';
import { deleteProfileAsAdmin, fetchAdminProfiles, type AdminProfile } from '@/lib/adminApi';

type AdminProfilesPanelProps = {
  ownerId: string;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function AdminProfilesPanel({ ownerId, onNotify }: AdminProfilesPanelProps) {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAdminProfiles()
      .then(setProfiles)
      .catch((err: Error) => onNotify(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (profile: AdminProfile) => {
    setBusyId(profile.id);
    try {
      await deleteProfileAsAdmin(profile.id);
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      onNotify('Perfil eliminado. Se han borrado también sus prendas, pujas y mensajes.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  return (
    <section className="space-y-4 border-2 border-ink-900 bg-paper-50 p-6">
      <h2 className="font-display text-2xl uppercase tracking-wide text-ink-900">Perfiles</h2>
      {loading ? (
        <p className="text-sm text-ink-700">Cargando perfiles...</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-ink-700">Todavía no hay perfiles.</p>
      ) : (
        <ul className="divide-y divide-ink-900/20">
          {profiles.map((profile) => {
            const isSelf = profile.id === ownerId;
            const confirming = confirmingId === profile.id;
            return (
              <li key={profile.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink-900">{profile.display_name || 'Sin nombre'}</p>
                  <p className="text-xs text-ink-700">
                    {profile.city || 'Sin ciudad'} · {new Date(profile.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                {isSelf ? (
                  <span className="text-xs text-ink-700">Tu cuenta</span>
                ) : confirming ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === profile.id}
                      onClick={() => handleDelete(profile)}
                      className="border-2 border-ink-900 bg-red-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyId === profile.id ? 'Eliminando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="border-2 border-ink-900 bg-paper-50 px-3 py-1 text-sm text-ink-900 transition-colors hover:bg-yellow-100"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(profile.id)}
                    className="border-2 border-ink-900 bg-paper-50 px-3 py-1 text-sm text-ink-900 transition-colors hover:bg-red-100"
                  >
                    Eliminar perfil
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
