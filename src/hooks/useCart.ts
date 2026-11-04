import { useCallback, useEffect, useState } from 'react';
import { addCartItem, fetchCart, removeCartItem } from '@/lib/api';
import type { CartItem, CartMode, Product } from '@/lib/types';

export function useCart(ownerId: string | null) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    let cancelled = false;
    setLoading(true);
    fetchCart(ownerId)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const add = useCallback(
    async (product: Product, mode: CartMode): Promise<'added' | 'exists'> => {
      if (!ownerId) throw new Error('Tu perfil todavía se está preparando');
      if (items.some((item) => item.product_id === product.id && item.mode === mode)) {
        return 'exists';
      }
      const created = await addCartItem(ownerId, product.id, mode);
      setItems((prev) => [...prev, created]);
      return 'added';
    },
    [items, ownerId]
  );

  const remove = useCallback(async (id: string) => {
    await removeCartItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, loading, error, add, remove };
}

export function cartItemPrice(item: CartItem): number {
  if (item.mode === 'rent') return item.product.rent_cents ?? 0;
  return item.product.price_cents;
}
