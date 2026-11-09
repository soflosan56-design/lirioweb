import { useState, type FormEvent } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { fetchStyleRecommendations, type StyleRecommendation } from '@/lib/styleRecommender';

const MAX_REQUEST_LENGTH = 300;

type StyleRecommenderModalProps = {
  onClose: () => void;
};

type RecommenderState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; recommendations: StyleRecommendation[] };

export default function StyleRecommenderModal({ onClose }: StyleRecommenderModalProps) {
  const [request, setRequest] = useState('');
  const [state, setState] = useState<RecommenderState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: 'loading' });
    try {
      const recommendations = await fetchStyleRecommendations(request.trim());
      setState({ status: 'ready', recommendations });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'No se pudieron generar las recomendaciones.' });
    }
  }

  const loading = state.status === 'loading';

  return (
    <Modal title="Recomendaciones para ti" onClose={onClose} maxWidthClass="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="font-display text-lg uppercase tracking-wide text-ink-900">¿Para qué ocasión buscas?</span>
          <textarea
            value={request}
            onChange={(event) => setRequest(event.target.value.slice(0, MAX_REQUEST_LENGTH))}
            rows={2}
            placeholder="Por ejemplo: una cena informal de verano"
            className="w-full resize-none border-2 border-ink-900 bg-white p-3 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="scrap-button w-full bg-pink-500 px-5 py-3 text-lg text-ink-900 hover:bg-pink-300 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {loading ? 'Preparando tus conjuntos...' : 'Generar recomendaciones'}
        </button>
      </form>

      {state.status === 'error' && (
        <p role="alert" className="mt-6 border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.recommendations.length === 0 && (
        <p className="mt-6 font-hand text-xl text-ink-600">No encontramos un conjunto convincente con lo que hay ahora. Prueba con otra ocasión.</p>
      )}

      {state.status === 'ready' && state.recommendations.length > 0 && (
        <ul className="mt-6 space-y-5">
          {state.recommendations.map((recommendation, index) => (
            <li key={`${recommendation.title}-${index}`} className="space-y-3 border-2 border-ink-900 bg-white p-4 shadow-hard-sm">
              <div>
                <p className="font-display text-xl uppercase text-ink-900">{recommendation.title}</p>
                <p className="mt-1 text-ink-800">{recommendation.reason}</p>
              </div>
              {recommendation.wardrobeItems.length > 0 && (
                <div>
                  <p className="font-hand text-lg text-pink-700">De tu armario</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {recommendation.wardrobeItems.map((item) => (
                      <figure key={item.id} className="w-24">
                        <img src={item.image_url} alt={item.name} className="aspect-[4/5] w-full border-2 border-ink-900 object-cover" />
                        <figcaption className="mt-1 truncate text-xs text-ink-700">{item.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
              {recommendation.swapListings.length > 0 && (
                <div>
                  <p className="font-hand text-lg text-pink-700">Disponibles en Swap</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {recommendation.swapListings.map((listing) => (
                      <figure key={listing.id} className="w-24">
                        {listing.image_url ? (
                          <img src={listing.image_url} alt={listing.title} className="aspect-[4/5] w-full border-2 border-ink-900 object-cover" />
                        ) : (
                          <div className="aspect-[4/5] w-full border-2 border-ink-900 bg-yellow-100" />
                        )}
                        <figcaption className="mt-1 truncate text-xs text-ink-700">{listing.title}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
