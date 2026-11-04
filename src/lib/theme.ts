import type { SiteSettings } from '@/lib/types';

export type FontOption = { id: string; stack: string; googleSpec: string | null };
export type FontRole = keyof SiteSettings['theme']['fonts'];
export type CustomFont = SiteSettings['theme']['customFonts'][number];

export const FONT_OPTIONS: Record<FontRole, FontOption[]> = {
  display: [
    { id: 'Rubik Dirt', stack: '"Rubik Dirt", Impact, sans-serif', googleSpec: 'family=Rubik+Dirt' },
    { id: 'Bebas Neue', stack: '"Bebas Neue", Impact, sans-serif', googleSpec: 'family=Bebas+Neue' },
    { id: 'Anton', stack: 'Anton, Impact, sans-serif', googleSpec: 'family=Anton' },
    { id: 'Bangers', stack: 'Bangers, Impact, sans-serif', googleSpec: 'family=Bangers' },
    { id: 'Archivo Black', stack: '"Archivo Black", Impact, sans-serif', googleSpec: 'family=Archivo+Black' },
  ],
  body: [
    { id: 'Space Grotesk', stack: '"Space Grotesk", system-ui, sans-serif', googleSpec: 'family=Space+Grotesk:wght@400;500;700' },
    { id: 'Inter', stack: 'Inter, system-ui, sans-serif', googleSpec: 'family=Inter:wght@400;500;700' },
    { id: 'DM Sans', stack: '"DM Sans", system-ui, sans-serif', googleSpec: 'family=DM+Sans:wght@400;500;700' },
    { id: 'Work Sans', stack: '"Work Sans", system-ui, sans-serif', googleSpec: 'family=Work+Sans:wght@400;500;700' },
    { id: 'Manrope', stack: 'Manrope, system-ui, sans-serif', googleSpec: 'family=Manrope:wght@400;500;700' },
  ],
  hand: [
    { id: 'Permanent Marker', stack: '"Permanent Marker", cursive', googleSpec: 'family=Permanent+Marker' },
    { id: 'Caveat', stack: 'Caveat, cursive', googleSpec: 'family=Caveat:wght@400;700' },
    { id: 'Gochi Hand', stack: '"Gochi Hand", cursive', googleSpec: 'family=Gochi+Hand' },
    { id: 'Shadows Into Light', stack: '"Shadows Into Light", cursive', googleSpec: 'family=Shadows+Into+Light' },
    { id: 'Rock Salt', stack: '"Rock Salt", cursive', googleSpec: 'family=Rock+Salt' },
  ],
};

const FONT_LINK_ID = 'lirio-site-fonts';

export function findFont(role: FontRole, id: string, customFonts: CustomFont[]): FontOption {
  const custom = customFonts.find((font) => font.name === id);
  if (custom) return { id: custom.name, stack: `"${custom.name}", system-ui, sans-serif`, googleSpec: null };
  return FONT_OPTIONS[role].find((option) => option.id === id) ?? FONT_OPTIONS[role][0];
}

function hexToChannels(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function loadGoogleFonts(theme: SiteSettings['theme']): void {
  const specs = new Set<string>();
  for (const role of Object.keys(theme.fonts) as FontRole[]) {
    const spec = findFont(role, theme.fonts[role], theme.customFonts).googleSpec;
    if (spec) specs.add(spec);
  }
  const href = `https://fonts.googleapis.com/css2?${[...specs].join('&')}&display=swap`;
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

function loadCustomFonts(customFonts: CustomFont[]): void {
  for (const font of customFonts) {
    const alreadyLoaded = [...document.fonts].some((face) => face.family.replace(/"/g, '') === font.name);
    if (alreadyLoaded) continue;
    const face = new FontFace(font.name, `url("${font.url}")`);
    document.fonts.add(face);
    face.load().catch((err: unknown) => console.error('No se pudo cargar la fuente', font.name, err));
  }
}

export function applyTheme(theme: SiteSettings['theme']): void {
  const style = document.documentElement.style;
  style.setProperty('--c-primary', hexToChannels(theme.colors.primary));
  style.setProperty('--c-accent', hexToChannels(theme.colors.accent));
  style.setProperty('--c-ink', hexToChannels(theme.colors.ink));
  style.setProperty('--c-paper', hexToChannels(theme.colors.paper));
  style.setProperty('--font-display', findFont('display', theme.fonts.display, theme.customFonts).stack);
  style.setProperty('--font-body', findFont('body', theme.fonts.body, theme.customFonts).stack);
  style.setProperty('--font-hand', findFont('hand', theme.fonts.hand, theme.customFonts).stack);
  loadGoogleFonts(theme);
  loadCustomFonts(theme.customFonts);
}
