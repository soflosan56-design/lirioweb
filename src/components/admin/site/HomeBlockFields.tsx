import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import type { HomeBlock, HomeBlockType } from '@/lib/types';

const BLOCK_TYPES: { type: HomeBlockType; label: string }[] = [
  { type: 'photo', label: 'Foto' },
  { type: 'title', label: 'Título' },
  { type: 'text', label: 'Texto' },
  { type: 'link', label: 'Enlace' },
];

function createBlock(type: HomeBlockType): HomeBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case 'photo':
      return { id, type, imageUrl: '', caption: '', linkUrl: '' };
    case 'text':
      return { id, type, body: '' };
    case 'title':
      return { id, type, title: '', subtitle: '' };
    case 'link':
      return { id, type, label: '', url: '' };
  }
}

function labelFor(type: HomeBlockType): string {
  return BLOCK_TYPES.find((item) => item.type === type)?.label ?? type;
}

type HomeBlockFieldsProps = {
  ownerId: string;
  value: HomeBlock[];
  onChange: (blocks: HomeBlock[]) => void;
};

export default function HomeBlockFields({ ownerId, value, onChange }: HomeBlockFieldsProps) {
  function replace(next: HomeBlock) {
    onChange(value.map((block) => (block.id === next.id ? next : block)));
  }

  function remove(id: string) {
    onChange(value.filter((block) => block.id !== id));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-display text-xl uppercase text-ink-900">Bloques extra de la portada</h4>
        <p className="text-xs text-ink-600">Aparecen debajo de los tres accesos, en el orden que veas aquí.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onChange([...value, createBlock(item.type)])}
            className="scrap-button bg-yellow-300 px-4 py-2 text-sm text-ink-900 hover:bg-yellow-500"
          >
            + {item.label}
          </button>
        ))}
      </div>

      {value.length === 0 && <p className="text-sm text-ink-600">Todavía no has añadido bloques.</p>}

      <ul className="space-y-4">
        {value.map((block, index) => (
          <li key={block.id} className="border-2 border-ink-900 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-display text-sm uppercase text-ink-900">
                {labelFor(block.type)} {index + 1}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Subir bloque"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="flex h-8 w-8 items-center justify-center border-2 border-ink-900 hover:bg-yellow-100 disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Bajar bloque"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  className="flex h-8 w-8 items-center justify-center border-2 border-ink-900 hover:bg-yellow-100 disabled:opacity-40"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Quitar bloque"
                  onClick={() => remove(block.id)}
                  className="flex h-8 w-8 items-center justify-center border-2 border-ink-900 bg-pink-100 text-pink-900 hover:bg-pink-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <BlockFields ownerId={ownerId} block={block} onChange={replace} />
          </li>
        ))}
      </ul>
    </div>
  );
}

type BlockFieldsProps = {
  ownerId: string;
  block: HomeBlock;
  onChange: (block: HomeBlock) => void;
};

function BlockFields({ ownerId, block, onChange }: BlockFieldsProps) {
  switch (block.type) {
    case 'photo':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="field-label">Imagen</span>
            <ImageUploader
              ownerId={ownerId}
              urls={block.imageUrl ? [block.imageUrl] : []}
              max={1}
              onChange={(urls) => onChange({ ...block, imageUrl: urls[0] ?? '' })}
            />
          </div>
          <div className="space-y-4">
            <TextField label="Pie de foto" value={block.caption} maxLength={120} onChange={(caption) => onChange({ ...block, caption })} />
            <TextField label="Enlace (opcional)" placeholder="https://..." value={block.linkUrl} maxLength={300} onChange={(linkUrl) => onChange({ ...block, linkUrl })} />
          </div>
        </div>
      );
    case 'title':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Título" value={block.title} maxLength={80} onChange={(title) => onChange({ ...block, title })} />
          <TextField label="Subtítulo" value={block.subtitle} maxLength={120} onChange={(subtitle) => onChange({ ...block, subtitle })} />
        </div>
      );
    case 'text':
      return (
        <label className="block">
          <span className="field-label">Texto</span>
          <textarea className="field min-h-24" value={block.body} maxLength={1000} onChange={(e) => onChange({ ...block, body: e.target.value })} />
        </label>
      );
    case 'link':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Texto del botón" value={block.label} maxLength={60} onChange={(label) => onChange({ ...block, label })} />
          <TextField label="Dirección" placeholder="https://..." value={block.url} maxLength={300} onChange={(url) => onChange({ ...block, url })} />
        </div>
      );
  }
}

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  maxLength: number;
  onChange: (value: string) => void;
};

function TextField({ label, value, placeholder, maxLength, onChange }: TextFieldProps) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        className="field"
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
