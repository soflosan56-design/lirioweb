import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { fetchDisplayNames } from '@/lib/api';
import { rankForYou, type ForYouPick } from '@/lib/forYou';
import { fetchWardrobeFeed, fetchWardrobeItems } from '@/lib/wardrobeApi';

const FEED_SIZE = 80;
const PICK_LIMIT = 12;

type ForYouState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; picks: ForYouPick[]; names: Record<string, string> };

type ForYouStripProps = {
  userId: string | null;
  onOpenWardrobe: (ownerId: string) => void;
};

export default function ForYouStrip({ userId, onOpenWardrobe }: ForYouStripProps) {
  const [state, setState] = useState<ForYouState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        const [feed, mine] = await Promise.all([
          fetchWardrobeFeed(FEED_SIZE),
          userId ? fetchWardrobeItems(userId) : Promise.resolve([]),
        ]);
        const picks = rankForYou(feed, mine, userId, PICK_LIMIT);
        const names = await fetchDisplayNames([...new Set(picks.map((pick) => pick.item.owner_id))]);
        if (!cancelled) setState({ status: 'ready', picks, names });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', message: err instanceof Error ? err.message : 'Error desconocido' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <section className="mb-12 space-y-5" aria-labelledby="para-ti-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="sticker-label -rotate-1 bg-neon-500 text-ink-900">
            <Sparkles className="mr-1 inline h-4 w-4" /> Para ti
          </span>
          <h2 id="para-ti-title" className="mt-3 font-display text-4xl uppercase leading-none text-ink-900 sm:text-5xl">
            Prendas de la comunidad
          </h2>
        </div>
        <p className="max-w-md text-sm text-ink-700">
          {userId
            ? 'Prendas de otros armarios. Las primeras son de marcas o tallas que ya tienes en el tuyo.'
            : 'Prendas de otros armarios. Entra con tu cuenta para ver las que encajan con tu estilo.'}
        </p>
      </div>

      {state.status === 'loading' && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-ink-900" />
        </div>
      )}

      {state.status === 'error' && (
        <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">
          No se pudieron cargar las recomendaciones: {state.message}
        </p>
      )}

      {state.status === 'ready' && state.picks.length === 0 && (
        <p className="font-hand text-xl text-ink-600">Todavía no hay prendas de otros armarios.</p>
      )}

      {state.status === 'ready' && state.picks.length > 0 && (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0">
          {state.picks.map(({ item, reasons }, index) => (
            <li
              key={item.id}
              className={`group w-44 shrink-0 snap-start bg-paper-50 p-3 border-2 border-ink-900 shadow-hard transition-all duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#FF2E93] sm:w-56 ${index % 2 ? 'rotate-1' : '-rotate-1'}`}
            >
              <div className="relative overflow-hidden border-2 border-ink-900">
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {reasons.length > 0 && (
                  <span className="absolute left-2 top-2 bg-neon-500 px-2 py-0.5 font-hand text-sm text-ink-900">
                    {reasons.includes('brand') ? 'Tu marca' : 'Tu talla'}
                  </span>
                )}
              </div>
              <p className="mt-3 truncate font-display text-xl uppercase leading-tight text-ink-900">{item.name}</p>
              <p className="truncate text-sm text-ink-600">
                {item.brand ?? 'Sin marca'} · Talla {item.size ?? '-'}
              </p>
              <button
                type="button"
                onClick={() => onOpenWardrobe(item.owner_id)}
                className="mt-2 block max-w-full truncate font-hand text-lg text-pink-700 underline decoration-2 underline-offset-4 hover:text-pink-900"
              >
                del armario de {state.names[item.owner_id] ?? 'un miembro'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
