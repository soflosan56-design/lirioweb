import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { fetchFashionNews, type FashionNewsArticle } from '@/lib/fashionNews';

type NewsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; articles: FashionNewsArticle[] };

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FashionNewsStrip() {
  const [state, setState] = useState<NewsState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchFashionNews()
      .then((articles) => !cancelled && setState({ status: 'ready', articles }))
      .catch((err: Error) => !cancelled && setState({ status: 'error', message: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-label="Noticias de moda" className="mt-20">
      <div className="mb-10 flex items-end justify-between gap-4 border-b-2 border-ink-900 pb-3">
        <h2 className="font-display text-4xl uppercase">Noticias de moda</h2>
        <p className="font-hand text-lg text-pink-700">recortes del día</p>
      </div>

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 font-hand text-xl text-ink-600">
          <Loader2 className="h-5 w-5 animate-spin" /> Buscando noticias...
        </p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.articles.length === 0 && (
        <p className="font-hand text-xl text-ink-600">Por ahora no hay noticias nuevas. Vuelve más tarde.</p>
      )}

      {state.status === 'ready' && state.articles.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {state.articles.map((article) => (
            <li key={article.id} className="flex flex-col justify-between gap-4 border-2 border-ink-900 bg-white p-5 shadow-hard-sm transition-transform hover:-translate-y-1">
              <div className="space-y-3">
                <h3 className="font-display text-xl uppercase leading-tight text-ink-900">{article.title}</h3>
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700">
                {article.publisher && <span className="font-bold text-ink-900">{article.publisher}</span>}
                {formatDate(article.publishedAt) && <span>{formatDate(article.publishedAt)}</span>}
                <ExternalLink className="ml-auto h-4 w-4 text-pink-600" aria-hidden />
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
