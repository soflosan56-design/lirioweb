import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import { MAX_FONT_BYTES, uploadFont } from '@/lib/api';
import { FONT_OPTIONS, findFont, type FontRole } from '@/lib/theme';
import type { SiteSettings } from '@/lib/types';

type Theme = SiteSettings['theme'];
type ColorKey = keyof Theme['colors'];

const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'primary', label: 'Color principal', hint: 'Botones, sellos y sombras rosas' },
  { key: 'accent', label: 'Color de acento', hint: 'Etiquetas amarillas y el botón del carrito' },
  { key: 'ink', label: 'Color de texto y bordes', hint: 'Textos, bordes y sombras duras' },
  { key: 'paper', label: 'Color de fondo', hint: 'Fondo general de la web' },
];

const FONT_FIELDS: { role: FontRole; label: string; sample: string }[] = [
  { role: 'display', label: 'Titulares', sample: 'Lirio' },
  { role: 'body', label: 'Texto general', sample: 'Moda independiente para todos' },
  { role: 'hand', label: 'Notas a mano', sample: 'hecho a tijeretazos' },
];

const FONT_ACCEPT = '.woff2,.woff,.ttf,.otf';

function fontNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
  return base.slice(0, 40) || 'Fuente propia';
}

type ThemeFieldsProps = {
  ownerId: string;
  value: Theme;
  onChange: (theme: Theme) => void;
};

export default function ThemeFields({ ownerId, value, onChange }: ThemeFieldsProps) {
  const [uploadingFont, setUploadingFont] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  async function handleFontFile(file: File | undefined) {
    if (!file) return;
    setFontError(null);
    const name = fontNameFromFile(file.name);
    if (value.customFonts.some((font) => font.name === name)) {
      setFontError(`Ya tienes una fuente llamada "${name}". Cambia el nombre del archivo.`);
      return;
    }
    setUploadingFont(true);
    try {
      const url = await uploadFont(ownerId, file);
      onChange({ ...value, customFonts: [...value.customFonts, { name, url }] });
    } catch (err) {
      setFontError(err instanceof Error ? err.message : 'No se pudo subir la fuente');
    } finally {
      setUploadingFont(false);
    }
  }

  function removeCustomFont(name: string) {
    const fallbackFonts = (Object.keys(value.fonts) as FontRole[]).reduce<Theme['fonts']>(
      (fonts, role) => (fonts[role] === name ? { ...fonts, [role]: FONT_OPTIONS[role][0].id } : fonts),
      value.fonts
    );
    onChange({
      ...value,
      fonts: fallbackFonts,
      customFonts: value.customFonts.filter((font) => font.name !== name),
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="field-label">Logotipo</span>
        <div className="max-w-xs">
          <ImageUploader
            ownerId={ownerId}
            urls={value.logoUrl ? [value.logoUrl] : []}
            max={1}
            onChange={(urls) => onChange({ ...value, logoUrl: urls[0] ?? '' })}
          />
        </div>
        <p className="mt-2 text-xs text-ink-600">Si no subes ninguno, se muestra el icono de tijeras.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_FIELDS.map((field) => (
          <label key={field.key} className="flex items-center gap-4 border-2 border-ink-900 bg-white p-3">
            <input
              type="color"
              aria-label={field.label}
              value={value.colors[field.key]}
              onChange={(e) => onChange({ ...value, colors: { ...value.colors, [field.key]: e.target.value } })}
              className="h-12 w-14 shrink-0 cursor-pointer border-2 border-ink-900 bg-white p-0.5"
            />
            <span className="min-w-0">
              <span className="block font-display text-base uppercase text-ink-900">{field.label}</span>
              <span className="block text-xs text-ink-600">
                {field.hint} · {value.colors[field.key].toUpperCase()}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {FONT_FIELDS.map((field) => (
          <div key={field.role}>
            <label>
              <span className="field-label">{field.label}</span>
              <select
                className="field"
                value={value.fonts[field.role]}
                onChange={(e) => onChange({ ...value, fonts: { ...value.fonts, [field.role]: e.target.value } })}
              >
                {FONT_OPTIONS[field.role].map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id}
                  </option>
                ))}
                {value.customFonts.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.name} (propia)
                  </option>
                ))}
              </select>
            </label>
            <p
              className="mt-3 text-2xl leading-tight text-ink-900"
              style={{ fontFamily: findFont(field.role, value.fonts[field.role], value.customFonts).stack }}
            >
              {field.sample}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-2 border-ink-900 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-xl uppercase text-ink-900">Fuentes propias</h4>
            <p className="text-xs text-ink-600">Archivos .woff2, .woff, .ttf u .otf de hasta {Math.round(MAX_FONT_BYTES / 1024 / 1024)} MB.</p>
          </div>
          <label className="scrap-button cursor-pointer bg-yellow-300 px-4 py-2 text-base text-ink-900 hover:bg-yellow-500">
            {uploadingFont ? 'Subiendo...' : 'Subir fuente'}
            <input
              type="file"
              accept={FONT_ACCEPT}
              disabled={uploadingFont}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                void handleFontFile(file);
              }}
            />
          </label>
        </div>
        {fontError && <p role="alert" className="text-sm font-bold text-pink-700">{fontError}</p>}
        {value.customFonts.length === 0 ? (
          <p className="text-sm text-ink-600">Todavía no has subido ninguna fuente.</p>
        ) : (
          <ul className="space-y-2">
            {value.customFonts.map((font) => (
              <li key={font.name} className="flex items-center justify-between gap-3 border-2 border-ink-900 bg-paper-50 px-3 py-2">
                <span className="text-xl text-ink-900" style={{ fontFamily: `"${font.name}", system-ui, sans-serif` }}>
                  {font.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomFont(font.name)}
                  className="flex items-center gap-1 text-sm font-bold text-pink-700 hover:underline"
                >
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
