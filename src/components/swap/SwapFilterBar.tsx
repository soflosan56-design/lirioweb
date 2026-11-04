import { X } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';
import { hasActiveFilters, NO_SWAP_FILTERS, type SwapFilters } from '@/lib/swapFilters';

type SwapFilterBarProps = {
  filters: SwapFilters;
  sizes: string[];
  brands: string[];
  conditions: string[];
  shown: number;
  total: number;
  onChange: (filters: SwapFilters) => void;
};

type FilterKey = keyof SwapFilters;

export default function SwapFilterBar({ filters, sizes, brands, conditions, shown, total, onChange }: SwapFilterBarProps) {
  const groups: { key: FilterKey; label: string; options: string[] }[] = [
    { key: 'size', label: 'Talla', options: sizes },
    { key: 'brand', label: 'Marca', options: brands },
    { key: 'condition', label: 'Estado', options: conditions },
  ];

  return (
    <div className="mb-10 border-2 border-ink-900 bg-white p-4 shadow-hard-sm">
      <div className="mb-4">
        <SearchField
          value={filters.query}
          onChange={(query) => onChange({ ...filters, query })}
          placeholder="Busca por nombre, marca, material o descripción"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {groups.map((group) => (
          <label key={group.key}>
            <span className="field-label">{group.label}</span>
            <select
              className="field"
              value={filters[group.key]}
              disabled={group.options.length === 0}
              onChange={(e) => onChange({ ...filters, [group.key]: e.target.value })}
            >
              <option value="">Todas</option>
              {group.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          Mostrando <span className="font-bold text-ink-900">{shown}</span> de {total} prendas
        </p>
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(NO_SWAP_FILTERS)}
            className="inline-flex items-center gap-1 border-2 border-ink-900 bg-paper-50 px-3 py-1.5 font-display text-sm uppercase transition-colors hover:bg-pink-100"
          >
            <X className="h-4 w-4" /> Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
