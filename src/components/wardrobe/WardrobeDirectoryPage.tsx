import { useEffect, useState } from 'react';
import { Loader2, Shirt } from 'lucide-react';
import { fetchProfiles, fetchWardrobeCounts } from '@/lib/wardrobeApi';
import type { Profile } from '@/lib/types';

type WardrobeDirectoryPageProps = {
  onOpenWardrobe: (ownerId: string) => void;
};

type DirectoryState = { profiles: Profile[]; counts: Record<string, number> };

export default function WardrobeDirectoryPage({ onOpenWardrobe }: WardrobeDirectoryPageProps) {
  const [data, setData] = useState<DirectoryState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProfiles(), fetchWardrobeCounts()])
      .then(([profiles, counts]) => {
        if (!cancelled) setData({ profiles, counts });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <header className="border-b-4 border-ink-900 pb-6">
        <p className="font-hand text-lg text-pink-700">la comunidad Lirio</p>
        <h1 className="font-display text-5xl uppercase leading-[1.1] tracking-wide text-ink-900">Armarios</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-700">Asómate a los armarios de otras personas, mira qué guardan y encuentra inspiración.</p>
      </header>

      {!data && !error && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-ink-900" />
        </div>
      )}

      {error && (
        <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-4 py-3 font-bold text-pink-900">
          No se pudieron cargar los armarios: {error}
        </p>
      )}

      {data && data.profiles.length === 0 && (
        <p className="py-16 text-center font-hand text-2xl text-ink-700">Todavía no hay armarios. Sé la primera persona en crear el suyo.</p>
      )}

      {data && data.profiles.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.profiles.map((profile, index) => {
            const count = data.counts[profile.id] ?? 0;
            return (
              <li key={profile.id}>
                <button
                  type="button"
                  onClick={() => onOpenWardrobe(profile.id)}
                  className={`group flex w-full items-center gap-4 border-2 border-ink-900 bg-paper-50 p-4 text-left shadow-hard transition-all duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#FF2E93] ${index % 2 ? 'rotate-1' : '-rotate-1'}`}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" loading="lazy" className="h-20 w-20 shrink-0 border-2 border-ink-900 object-cover" />
                  ) : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-ink-900 bg-yellow-400 font-display text-4xl text-ink-900">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate font-display text-2xl uppercase leading-tight text-ink-900">{profile.display_name}</span>
                    <span className="block truncate text-sm text-ink-600">{profile.style ?? profile.city ?? 'Sin presentar'}</span>
                    <span className="inline-flex items-center gap-1 font-hand text-pink-700">
                      <Shirt className="h-4 w-4" />
                      {count} {count === 1 ? 'prenda' : 'prendas'}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
