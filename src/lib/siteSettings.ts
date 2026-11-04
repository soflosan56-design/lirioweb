import { assertNoError } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { DestinationId, HomeBlock, SitePlan, SiteSettings } from '@/lib/types';

const SITE_KEY = 'site';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
export const DESTINATION_IDS: DestinationId[] = ['swap', 'showroom', 'contenidos'];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  theme: {
    colors: { primary: '#FF2E93', accent: '#FFE14D', ink: '#0B0B0B', paper: '#FFF6FA' },
    fonts: { display: 'Rubik Dirt', body: 'Space Grotesk', hand: 'Permanent Marker' },
    logoUrl: '',
    customFonts: [],
  },
  home: {
    intro:
      'Una plataforma hecha a tijeretazos: moda independiente, ropa que cambia de manos y contenido grabado en cualquier esquina.',
    coverImageUrl: 'https://images.pexels.com/photos/14008893/pexels-photo-14008893.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    polaroidImageUrl: 'https://images.pexels.com/photos/33976561/pexels-photo-33976561.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    blocks: [],
    destinations: {
      swap: {
        blurb: 'Publica tu ropa y puja por la de otros.',
        imageUrl: 'https://images.pexels.com/photos/5524406/pexels-photo-5524406.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      },
      showroom: {
        blurb: 'Compra o alquila piezas de marcas independientes.',
        imageUrl: 'https://images.pexels.com/photos/8307669/pexels-photo-8307669.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      },
      contenidos: {
        blurb: 'Contenido y reportajes de la calle a la plataforma.',
        imageUrl: 'https://images.pexels.com/photos/9399680/pexels-photo-9399680.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      },
    },
  },
  subscriptions: {
    title: 'Elige tu corte',
    intro:
      'Lirio es gratis para empezar. Si quieres más espacio en el swap, más fotos en tus pujas o acceso antes que nadie, elige un plan.',
    note: 'Por ahora son planes informativos: los cobros aún no están activos.',
    plans: [
      {
        name: 'Curiosa',
        price: 'Gratis',
        period: 'para siempre',
        tagline: 'Entra al swap y lee los contenidos.',
        features: ['Publica hasta 3 prendas', 'Puja en el swap', 'Lee todos los artículos', 'Mira los contenidos'],
      },
      {
        name: 'Cómplice',
        price: '4,90 €',
        period: 'al mes',
        tagline: 'Para quien vive dentro del swap.',
        features: [
          'Prendas ilimitadas en el swap',
          'Pujas con hasta 3 fotos de tu oferta',
          'Acceso anticipado a cada contenido nuevo',
          'Descuento del 10% en el showroom',
        ],
      },
      {
        name: 'Editora',
        price: '12 €',
        period: 'al mes',
        tagline: 'Para marcas y creadoras de la calle.',
        features: ['Todo lo de Cómplice', 'Tu marca destacada en el showroom', 'Colaboraciones en reportajes', 'Soporte prioritario'],
      },
    ],
    faq: [
      {
        question: '¿Puedo cancelar cuando quiera?',
        answer: 'Sí. No hay permanencia y puedes bajar de plan en cualquier momento.',
      },
      {
        question: '¿Qué pasa con mis prendas si cancelo?',
        answer: 'Siguen publicadas en el plan gratuito, sin límite de pujas recibidas.',
      },
    ],
  },
  contact: {
    title: 'Escríbenos',
    intro: 'Colaboraciones, marcas que quieren entrar en el showroom, propuestas de contenido o dudas sobre el swap.',
    email: 'hola@lirio.fanzine',
  },
};

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function mergePlans(value: unknown, fallback: SitePlan[]): SitePlan[] {
  if (!Array.isArray(value) || value.length !== fallback.length) return fallback;
  return value.map((raw, index) => {
    const plan = record(raw);
    const base = fallback[index];
    return {
      name: text(plan.name, base.name),
      price: text(plan.price, base.price),
      period: text(plan.period, base.period),
      tagline: text(plan.tagline, base.tagline),
      features: stringList(plan.features),
    };
  });
}

function mergeCustomFonts(value: unknown): { name: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    const font = record(raw);
    const name = text(font.name, '');
    const url = text(font.url, '');
    return name && url ? [{ name, url }] : [];
  });
}

export function isSafeUrl(value: string): boolean {
  return /^(https?:\/\/|mailto:|\/(?!\/))/i.test(value.trim());
}

function mergeHomeBlocks(value: unknown): HomeBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): HomeBlock[] => {
    const block = record(raw);
    const id = text(block.id, crypto.randomUUID());
    switch (block.type) {
      case 'photo':
        return [{ id, type: 'photo', imageUrl: text(block.imageUrl, ''), caption: text(block.caption, ''), linkUrl: text(block.linkUrl, '') }];
      case 'text':
        return [{ id, type: 'text', body: text(block.body, '') }];
      case 'title':
        return [{ id, type: 'title', title: text(block.title, ''), subtitle: text(block.subtitle, '') }];
      case 'link':
        return [{ id, type: 'link', label: text(block.label, ''), url: text(block.url, '') }];
      default:
        return [];
    }
  });
}

export function mergeSiteSettings(raw: unknown): SiteSettings {
  const base = DEFAULT_SITE_SETTINGS;
  const saved = record(raw);
  const theme = record(saved.theme);
  const colors = record(theme.colors);
  const fonts = record(theme.fonts);
  const home = record(saved.home);
  const destinations = record(home.destinations);
  const subscriptions = record(saved.subscriptions);
  const contact = record(saved.contact);

  return {
    theme: {
      colors: {
        primary: color(colors.primary, base.theme.colors.primary),
        accent: color(colors.accent, base.theme.colors.accent),
        ink: color(colors.ink, base.theme.colors.ink),
        paper: color(colors.paper, base.theme.colors.paper),
      },
      logoUrl: text(theme.logoUrl, base.theme.logoUrl),
      customFonts: mergeCustomFonts(theme.customFonts),
      fonts: {
        display: text(fonts.display, base.theme.fonts.display),
        body: text(fonts.body, base.theme.fonts.body),
        hand: text(fonts.hand, base.theme.fonts.hand),
      },
    },
    home: {
      intro: text(home.intro, base.home.intro),
      coverImageUrl: text(home.coverImageUrl, base.home.coverImageUrl),
      polaroidImageUrl: text(home.polaroidImageUrl, base.home.polaroidImageUrl),
      blocks: mergeHomeBlocks(home.blocks),
      destinations: Object.fromEntries(
        DESTINATION_IDS.map((id) => {
          const destination = record(destinations[id]);
          return [
            id,
            {
              blurb: text(destination.blurb, base.home.destinations[id].blurb),
              imageUrl: text(destination.imageUrl, base.home.destinations[id].imageUrl),
            },
          ];
        })
      ) as SiteSettings['home']['destinations'],
    },
    subscriptions: {
      title: text(subscriptions.title, base.subscriptions.title),
      intro: text(subscriptions.intro, base.subscriptions.intro),
      note: text(subscriptions.note, base.subscriptions.note),
      plans: mergePlans(subscriptions.plans, base.subscriptions.plans),
      faq: Array.isArray(subscriptions.faq)
        ? subscriptions.faq.map((raw, index) => {
            const item = record(raw);
            const fallback = base.subscriptions.faq[index] ?? { question: '', answer: '' };
            return {
              question: text(item.question, fallback.question),
              answer: text(item.answer, fallback.answer),
            };
          })
        : base.subscriptions.faq,
    },
    contact: {
      title: text(contact.title, base.contact.title),
      intro: text(contact.intro, base.contact.intro),
      email: text(contact.email, base.contact.email),
    },
  };
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SITE_KEY)
    .maybeSingle();
  assertNoError(error, 'No se pudo cargar la web');
  return mergeSiteSettings(data?.value);
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert(
      { key: SITE_KEY, value: settings, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  assertNoError(error, 'No se pudo guardar la estética');
}
