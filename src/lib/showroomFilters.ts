import type { Product } from '@/lib/types';

export type ShowroomFilters = {
  query: string;
  size: string;
};

export const NO_SHOWROOM_FILTERS: ShowroomFilters = { query: '', size: '' };

export function filterProducts(products: Product[], brandId: string | null, filters: ShowroomFilters): Product[] {
  const query = filters.query.trim().toLowerCase();
  return products.filter((product) => {
    if (brandId && product.brand_id !== brandId) return false;
    if (filters.size && product.size !== filters.size) return false;
    if (!query) return true;
    const haystack = [product.name, product.description, product.size, product.brand?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function distinctProductSizes(products: Product[]): string[] {
  const values = new Set<string>();
  for (const product of products) {
    const value = product.size?.trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'es-ES'));
}
