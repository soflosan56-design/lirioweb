import { useState } from 'react';
import { ShoppingBag, Clock3 } from 'lucide-react';
import { formatEuros } from '@/lib/format';
import PhotoCycler from '@/components/ui/PhotoCycler';
import type { CartMode, Product } from '@/lib/types';

type ProductCardProps = {
  product: Product;
  rotate: string;
  onAdd: (product: Product, mode: CartMode) => Promise<'added' | 'exists' | 'signed_out'>;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function ProductCard({ product, rotate, onAdd, onNotify }: ProductCardProps) {
  const canRent = product.rent_cents !== null;
  const [mode, setMode] = useState<CartMode>('buy');
  const [pending, setPending] = useState(false);

  const price = mode === 'rent' && product.rent_cents !== null ? product.rent_cents : product.price_cents;

  async function handleAdd() {
    setPending(true);
    try {
      const result = await onAdd(product, mode);
      if (result === 'signed_out') {
        return;
      }
      if (result === 'exists') {
        onNotify('Ya está en tu carrito', 'error');
      } else {
        onNotify(mode === 'rent' ? 'Alquiler añadido al carrito' : 'Añadido al carrito', 'success');
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo añadir al carrito', 'error');
    } finally {
      setPending(false);
    }
  }

  return (
    <article className={`group relative flex flex-col bg-paper-50 p-3 border-2 border-ink-900 shadow-hard transition-all duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#FF2E93] ${rotate}`}>
      <span className="tape -top-3 right-6 w-16 rotate-6" />
      <div className="relative overflow-hidden border-2 border-ink-900">
        <PhotoCycler urls={product.image_urls} alt={product.name} className="aspect-[4/5] w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" />
        {canRent && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-cyan-300 px-2 py-0.5 font-hand text-sm text-ink-900">
            <Clock3 className="h-3.5 w-3.5" /> alquilable
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-xs uppercase tracking-wider text-pink-700">{product.brand?.name ?? 'Independiente'}</p>
      <h3 className="font-display text-2xl uppercase leading-tight">{product.name}</h3>
      {product.description && <p className="mt-1 text-sm text-ink-600">{product.description}</p>}

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="font-display text-3xl text-ink-900">
          {formatEuros(price)}
          {mode === 'rent' && <span className="font-body text-sm text-ink-600"> / 3 días</span>}
        </p>
        {canRent && (
          <div role="group" aria-label="Modo de compra" className="flex border-2 border-ink-900 text-sm font-bold">
            {(['buy', 'rent'] as CartMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                aria-pressed={mode === option}
                className={`px-2.5 py-1 uppercase transition-colors ${mode === option ? 'bg-neon-500' : 'bg-white hover:bg-neon-100'}`}
              >
                {option === 'buy' ? 'Comprar' : 'Alquilar'}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={handleAdd} disabled={pending} className="scrap-button mt-4 w-full bg-ink-900 px-4 py-2.5 text-lg text-neon-500 hover:bg-neon-500 hover:text-ink-900">
        <ShoppingBag className="h-4 w-4" /> {pending ? 'Añadiendo...' : 'Añadir'}
      </button>
    </article>
  );
}
