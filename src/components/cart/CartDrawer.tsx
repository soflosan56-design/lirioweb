import { useEffect } from 'react';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { cartItemPrice } from '@/hooks/useCart';
import { formatEuros } from '@/lib/format';
import type { CartItem } from '@/lib/types';

type CartDrawerProps = {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRemove: (id: string) => Promise<void>;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function CartDrawer({ items, loading, error, onClose, onRemove, onNotify }: CartDrawerProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = items.reduce((sum, item) => sum + cartItemPrice(item) * item.quantity, 0);

  async function handleRemove(id: string) {
    try {
      await onRemove(id);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo quitar el artículo', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Cerrar carrito" onClick={onClose} className="absolute inset-0 bg-ink-900/70" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compra"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l-4 border-ink-900 bg-paper-50 shadow-[-10px_0_0_0_#FFE14D]"
      >
        <div className="flex items-center justify-between border-b-4 border-ink-900 bg-neon-500 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-3xl uppercase">
            <ShoppingBag className="h-6 w-6" /> Carrito
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-paper-50 transition-transform hover:rotate-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading && <p className="font-hand text-lg text-ink-600">Cargando carrito...</p>}
          {error && <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-3 text-sm font-bold text-pink-900">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="font-hand text-2xl text-ink-600">Tu carrito está vacío. Ve al Showroom y recorta algo bonito.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 border-2 border-ink-900 bg-white p-3 shadow-hard-sm">
              <img src={item.product.image_url ?? ''} alt="" className="h-24 w-20 shrink-0 border-2 border-ink-900 object-cover" />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="font-display text-xl uppercase leading-tight">{item.product.name}</p>
                  <p className="text-xs text-ink-600">{item.product.brand?.name}</p>
                  <span className={`mt-1 inline-block px-2 py-0.5 font-hand text-sm ${item.mode === 'rent' ? 'bg-cyan-300' : 'bg-neon-300'}`}>
                    {item.mode === 'rent' ? 'Alquiler · 3 días' : 'Compra'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl">{formatEuros(cartItemPrice(item))}</span>
                  <button type="button" onClick={() => handleRemove(item.id)} aria-label={`Quitar ${item.product.name}`} className="flex h-9 w-9 items-center justify-center border-2 border-ink-900 transition-colors hover:bg-pink-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-4 border-ink-900 bg-white p-5">
          <div className="flex items-center justify-between font-display text-2xl uppercase">
            <span>Total</span>
            <span>{formatEuros(total)}</span>
          </div>
          <p className="mt-2 font-hand text-base text-ink-600">El pago todavía no está conectado; el carrito guarda tu selección.</p>
        </div>
      </aside>
    </div>
  );
}
