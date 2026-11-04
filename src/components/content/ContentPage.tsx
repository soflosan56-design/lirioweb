import { useEffect, useMemo, useState } from 'react';
import ArticleFanzine from '@/components/content/ArticleFanzine';
import ArticleReader from '@/components/content/ArticleReader';
import PodcastCollage from '@/components/content/PodcastCollage';
import VideoPlayer from '@/components/content/VideoPlayer';
import { fetchContent } from '@/lib/api';
import type { ContentItem } from '@/lib/types';

type Filter = 'todos' | 'podcast' | 'articulo';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'podcast', label: 'Audio / Vídeo' },
  { id: 'articulo', label: 'Artículos' },
];

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('todos');
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<ContentItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchContent()
      .then((data) => !cancelled && setItems(data))
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const episodes = useMemo(() => items.filter((i) => i.kind === 'podcast'), [items]);
  const articles = useMemo(() => items.filter((i) => i.kind === 'article'), [items]);
  const activeEpisode = episodes.find((e) => e.id === activeEpisodeId) ?? episodes.find((e) => e.featured) ?? episodes[0];

  const showVideos = filter !== 'articulo' && episodes.length > 0;
  const showArticles = filter !== 'podcast' && articles.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <header className="mb-10 border-b-4 border-ink-900 pb-8">
        <span className="sticker-label -rotate-2 bg-cyan-300 text-ink-900">Plataforma digital</span>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
          Conte<span className="text-pink-500">nidos</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-800">Contenido, reportajes y entrevistas recortados a mano para la calle.</p>

        <div role="tablist" aria-label="Filtrar contenidos" className="mt-8 flex flex-wrap gap-3">
          {FILTERS.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(option.id)}
                className={`scrap-button px-4 py-2 text-lg ${active ? 'bg-ink-900 text-neon-500' : 'bg-paper-50 text-ink-900 hover:bg-neon-300'}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {loading && <p className="font-hand text-xl text-ink-600">Cargando contenidos...</p>}
      {error && <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">No se pudo cargar el contenido: {error}</p>}

      {!loading && !error && showVideos && activeEpisode && (
        <section aria-label="Podcasts" className="mb-20">
          <div className="mb-8 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <VideoPlayer episode={activeEpisode} />
            </div>
            <div className="lg:col-span-4">
              <h2 className="mb-4 font-display text-3xl uppercase">Más episodios</h2>
              <p className="mb-6 font-hand text-lg text-pink-700">selecciona para reproducir</p>
              <PodcastCollage episodes={episodes} activeId={activeEpisode.id} onSelect={(e) => setActiveEpisodeId(e.id)} />
            </div>
          </div>
        </section>
      )}

      {!loading && !error && showArticles && (
        <section aria-label="Artículos y reportajes">
          <div className="mb-10 flex items-end justify-between gap-4 border-b-2 border-ink-900 pb-3">
            <h2 className="font-display text-4xl uppercase">Reportajes</h2>
            <p className="font-hand text-lg text-pink-700">lectura de fanzine</p>
          </div>
          <ArticleFanzine articles={articles} onOpen={setOpenArticle} />
        </section>
      )}

      {openArticle && <ArticleReader article={openArticle} onClose={() => setOpenArticle(null)} />}
    </div>
  );
}
