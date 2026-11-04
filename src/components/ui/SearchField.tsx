import { Search, X } from 'lucide-react';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export default function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <label className="relative block">
      <span className="sr-only">Buscar</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-700" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={80}
        className="field pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-ink-700 hover:text-pink-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}
