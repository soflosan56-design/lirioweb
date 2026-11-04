import { useEffect, useMemo, useState } from 'react';
import { Store } from 'lucide-react';
import ProductCard from '@/components/showroom/ProductCard';
import PhotoCycler from '@/components/ui/PhotoCycler';
import SearchField from '@/components/ui/SearchField';
import { fetchBrands, fetchProducts } from '@/lib/api';
import { distinctProductSizes, filterProducts, NO_SHOWROOM_FILTERS, type ShowroomFilters } from '@/lib/showroomFilters';
import type { Brand, CartMode, Product } from '@/lib/types';

const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-2', '-rotate-2'];

type ShowroomPageProps = {
  onAdd: (product: Product, mode: CartMode) => Promise<'added' | 'exists' | 'signed_out'>;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function ShowroomPage({ onAdd, onNotify }: ShowroomPageProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShowroomFilters>(NO_SHOWROOM_FILTERS);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchBrands(), fetchProducts()])
      .then(([brandData, productData]) => {
        if (cancelled) return;
        setBrands(brandData);
        setProducts(productData);
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const sizes = useMemo(() => distinctProductSizes(products), [products]);
  const visible = useMemo(() => filterProducts(products, brandId, filters), [products, brandId, filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <header className="mb-10 border-b-4 border-ink-900 pb-8">
        <span className="sticker-label rotate-2 bg-pink-500 text-ink-900">
          <Store className="mr-1 inline h-4 w-4" /> Diseñadores independientes
        </span>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
          Show<span className="text-neon-500 [text-shadow:3px_3px_0_#0B0B0B]">room</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-800">
          Piezas de marcas pequeñas, hechas por encargo o en tiradas cortas. Cómpralas o alquílalas para una noche.
        </p>
      </header>

      {loading && <p className="font-hand text-xl text-ink-600">Cargando catálogo...</p>}
      {error && <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">No se pudo cargar el catálogo: {error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand, index) => {
              const active = brandId === brand.id;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setBrandId(active ? null : brand.id)}
                  aria-pressed={active}
                  className={`group relative overflow-hidden border-2 border-ink-900 text-left transition-all duration-200 ${active ? 'shadow-hard-neon' : 'shadow-hard hover:-translate-y-1'} ${ROTATIONS[index % ROTATIONS.length]}`}
                >
                  <PhotoCycler urls={brand.image_urls} alt={brand.name} className="aspect-[4/3] w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-ink-900 p-3 text-paper-50">
                    <p className="font-display text-2xl uppercase leading-none">{brand.name}</p>
                    <p className="mt-1 text-xs text-neon-300">{brand.city} · {brand.tagline}</p>
                  </div>
                  {active && <span className="absolute right-2 top-2 bg-neon-500 px-2 py-0.5 font-hand text-sm text-ink-900">filtrando</span>}
                </button>
              );
            })}
          </div>

          {brandId && (
            <button type="button" onClick={() => setBrandId(null)} className="mb-8 font-hand text-lg text-pink-700 underline decoration-2 underline-offset-4">
              Ver todas las marcas
            </button>
          )}

          <div className="mb-10 grid gap-4 border-2 border-ink-900 bg-white p-4 shadow-hard-sm sm:grid-cols-[1fr_200px]">
            <SearchField
              value={filters.query}
              onChange={(query) => setFilters((prev) => ({ ...prev, query }))}
              placeholder="Busca por prenda, descripción o marca"
            />
            <label>
              <span className="field-label">Talla</span>
              <select
                className="field"
                value={filters.size}
                disabled={sizes.length === 0}
                onChange={(e) => setFilters((prev) => ({ ...prev, size: e.target.value }))}
              >
                <option value="">Todas</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-ink-600 sm:col-span-2">
              Mostrando <span className="font-bold text-ink-900">{visible.length}</span> de {products.length} piezas
            </p>
          </div>

          {visible.length === 0 && (
            <p className="font-hand text-2xl text-ink-600">Ninguna pieza coincide con esa búsqueda.</p>
          )}

          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {visible.map((product, index) => (
              <ProductCard key={product.id} product={product} rotate={ROTATIONS[index % ROTATIONS.length]} onAdd={onAdd} onNotify={onNotify} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
