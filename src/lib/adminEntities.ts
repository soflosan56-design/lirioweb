import type { AdminRow, AdminTable } from '@/lib/adminApi';
import { formatEuros } from '@/lib/format';

export type FieldKind = 'text' | 'textarea' | 'number' | 'euros' | 'select' | 'image' | 'images' | 'checkbox';
export type FieldOption = { value: string; label: string };
export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: FieldOption[];
  hint?: string;
};
export type EntityConfig = {
  key: string;
  table: AdminTable;
  tabLabel: string;
  noun: string;
  select: string;
  orderBy: string;
  ascending: boolean;
  fields: FieldDef[];
  describe: (row: AdminRow) => { title: string; meta: string; image: string | null };
};
export type FormValues = Record<string, string | boolean | string[]>;

export const GALLERY_MAX_PHOTOS = 12;

const CONTENT_KINDS: FieldOption[] = [
  { value: 'podcast', label: 'Episodio de audio' },
  { value: 'article', label: 'Artículo' },
];

export function getEntities(brandOptions: FieldOption[]): EntityConfig[] {
  return [
    {
      key: 'brands',
      table: 'brands',
      tabLabel: 'Marcas',
      noun: 'marca',
      select: 'id, slug, name, city, tagline, image_url, image_urls',
      orderBy: 'name',
      ascending: true,
      fields: [
        { name: 'name', label: 'Nombre', kind: 'text', required: true },
        { name: 'slug', label: 'Identificador (slug)', kind: 'text', required: true, hint: 'Sin espacios ni acentos, por ejemplo: mi-marca' },
        { name: 'city', label: 'Ciudad', kind: 'text' },
        { name: 'tagline', label: 'Frase corta', kind: 'text' },
        { name: 'image_urls', label: 'Fotos', kind: 'images', hint: 'La primera foto es la principal.' },
      ],
      describe: (row) => ({
        title: String(row.name ?? ''),
        meta: String(row.city ?? 'Sin ciudad'),
        image: typeof row.image_url === 'string' ? row.image_url : null,
      }),
    },
    {
      key: 'products',
      table: 'products',
      tabLabel: 'Productos',
      noun: 'producto',
      select: 'id, brand_id, name, description, size, price_cents, rent_cents, image_url, image_urls, brand:brands(id, name)',
      orderBy: 'name',
      ascending: true,
      fields: [
        { name: 'brand_id', label: 'Marca', kind: 'select', required: true, options: brandOptions },
        { name: 'name', label: 'Nombre', kind: 'text', required: true },
        { name: 'description', label: 'Descripción', kind: 'textarea' },
        { name: 'size', label: 'Talla', kind: 'text' },
        { name: 'price_cents', label: 'Precio (€)', kind: 'euros', required: true },
        { name: 'rent_cents', label: 'Alquiler (€)', kind: 'euros', hint: 'Déjalo vacío si no se alquila' },
        { name: 'image_urls', label: 'Fotos', kind: 'images', hint: 'La primera foto es la principal.' },
      ],
      describe: (row) => {
        const brand = row.brand as { name: string } | null;
        const price = typeof row.price_cents === 'number' ? formatEuros(row.price_cents) : '';
        return {
          title: String(row.name ?? ''),
          meta: `${brand?.name ?? 'Sin marca'} · ${price}`,
          image: typeof row.image_url === 'string' ? row.image_url : null,
        };
      },
    },
    {
      key: 'content',
      table: 'content_items',
      tabLabel: 'Contenidos',
      noun: 'contenido',
      select:
        'id, kind, slug, title, subtitle, excerpt, body, category, image_url, video_url, duration_label, episode_number, featured, published_at',
      orderBy: 'published_at',
      ascending: false,
      fields: [
        { name: 'kind', label: 'Tipo', kind: 'select', required: true, options: CONTENT_KINDS },
        { name: 'title', label: 'Título', kind: 'text', required: true },
        { name: 'slug', label: 'Identificador (slug)', kind: 'text', required: true, hint: 'Sin espacios ni acentos, por ejemplo: entrevista-lola' },
        { name: 'subtitle', label: 'Subtítulo', kind: 'text' },
        { name: 'category', label: 'Categoría', kind: 'text' },
        { name: 'excerpt', label: 'Resumen', kind: 'textarea' },
        { name: 'body', label: 'Texto completo', kind: 'textarea' },
        { name: 'image_url', label: 'Imagen', kind: 'image' },
        { name: 'video_url', label: 'Enlace de vídeo', kind: 'text' },
        { name: 'duration_label', label: 'Duración', kind: 'text', hint: 'Por ejemplo: 42 min' },
        { name: 'episode_number', label: 'Número de episodio', kind: 'number' },
        { name: 'featured', label: 'Destacar en la portada', kind: 'checkbox' },
      ],
      describe: (row) => {
        const kind = row.kind === 'article' ? 'Artículo' : 'Episodio de audio';
        const date = typeof row.published_at === 'string' ? new Date(row.published_at).toLocaleDateString('es-ES') : '';
        return {
          title: String(row.title ?? ''),
          meta: `${kind} · ${date}${row.featured === true ? ' · Destacado' : ''}`,
          image: typeof row.image_url === 'string' ? row.image_url : null,
        };
      },
    },
  ];
}

export function toFormValues(fields: FieldDef[], row: AdminRow | null): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = row?.[field.name];
    if (field.kind === 'checkbox') values[field.name] = raw === true;
    else if (field.kind === 'euros') values[field.name] = typeof raw === 'number' ? (raw / 100).toFixed(2) : '';
    else if (field.kind === 'images') values[field.name] = Array.isArray(raw) ? raw.filter((url): url is string => typeof url === 'string') : [];
    else values[field.name] = raw == null ? '' : String(raw);
  }
  return values;
}

function parseField(field: FieldDef, text: string): unknown {
  if (field.kind === 'euros') {
    const amount = Number(text.replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`${field.label}: escribe un importe válido.`);
    return Math.round(amount * 100);
  }
  if (field.kind === 'number') {
    const n = Number(text);
    if (!Number.isInteger(n) || n < 1) throw new Error(`${field.label}: escribe un número entero mayor que cero.`);
    return n;
  }
  return text;
}

export function toPayload(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.kind === 'checkbox') {
      payload[field.name] = value === true;
      continue;
    }
    if (field.kind === 'images') {
      const urls = Array.isArray(value) ? value : [];
      payload[field.name] = urls;
      payload.image_url = urls[0] ?? null;
      continue;
    }
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) {
      if (field.required) throw new Error(`Falta completar: ${field.label}.`);
      payload[field.name] = null;
      continue;
    }
    payload[field.name] = parseField(field, text);
  }
  return payload;
}
