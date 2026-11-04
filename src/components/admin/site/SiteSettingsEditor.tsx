import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import ContactFields from '@/components/admin/site/ContactFields';
import EditorSection from '@/components/admin/site/EditorSection';
import HomeFields from '@/components/admin/site/HomeFields';
import SubscriptionsFields from '@/components/admin/site/SubscriptionsFields';
import ThemeFields from '@/components/admin/site/ThemeFields';
import { DESTINATION_IDS, isSafeUrl, saveSiteSettings } from '@/lib/siteSettings';
import { applyTheme } from '@/lib/theme';
import type { SiteSettings } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SiteSettingsEditorProps = {
  ownerId: string;
  settings: SiteSettings;
  onSaved: (settings: SiteSettings) => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function SiteSettingsEditor({ ownerId, settings, onSaved, onNotify }: SiteSettingsEditorProps) {
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedThemeRef = useRef(settings.theme);

  useEffect(() => {
    savedThemeRef.current = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    applyTheme(draft.theme);
  }, [draft.theme]);

  useEffect(() => () => applyTheme(savedThemeRef.current), []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  async function handleSave() {
    const cleaned = cleanSettings(draft);
    const problem = findProblem(cleaned);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      await saveSiteSettings(cleaned);
      setDraft(cleaned);
      onSaved(cleaned);
      onNotify('Cambios publicados en la web', 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo guardar la estética', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <EditorSection title="Colores y tipografía">
        <ThemeFields ownerId={ownerId} value={draft.theme} onChange={(theme) => setDraft((d) => ({ ...d, theme }))} />
      </EditorSection>

      <EditorSection title="Portada y fotos">
        <HomeFields ownerId={ownerId} value={draft.home} onChange={(home) => setDraft((d) => ({ ...d, home }))} />
      </EditorSection>

      <EditorSection title="Suscripciones">
        <SubscriptionsFields
          value={draft.subscriptions}
          onChange={(subscriptions) => setDraft((d) => ({ ...d, subscriptions }))}
        />
      </EditorSection>

      <EditorSection title="Contacto">
        <ContactFields value={draft.contact} onChange={(contact) => setDraft((d) => ({ ...d, contact }))} />
      </EditorSection>

      <div className="sticky bottom-4 flex flex-col items-end gap-2 sm:flex-row sm:justify-end sm:gap-4">
        {error && (
          <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-3 py-2 text-sm font-bold text-pink-900">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="scrap-button bg-yellow-500 px-6 py-3 text-lg text-ink-900 hover:bg-yellow-300"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Publicando...' : 'Publicar cambios'}
        </button>
      </div>
    </div>
  );
}

function cleanSettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    subscriptions: {
      ...settings.subscriptions,
      plans: settings.subscriptions.plans.map((plan) => ({
        ...plan,
        features: plan.features.map((feature) => feature.trim()).filter(Boolean),
      })),
    },
  };
}

function findProblem(settings: SiteSettings): string | null {
  if (settings.home.blocks.some((block) => block.type === 'photo' && !block.imageUrl)) {
    return 'Cada bloque de foto necesita una imagen.';
  }
  if (settings.home.blocks.some((block) => block.type === 'photo' && block.linkUrl && !isSafeUrl(block.linkUrl))) {
    return 'Las direcciones de los bloques de foto deben empezar por https://, mailto: o /.';
  }
  if (settings.home.blocks.some((block) => block.type === 'link' && (!block.label.trim() || !isSafeUrl(block.url)))) {
    return 'Cada enlace necesita un texto y una dirección que empiece por https://, mailto: o /.';
  }
  if (settings.home.blocks.some((block) => block.type === 'title' && !block.title.trim())) {
    return 'Cada bloque de título necesita un texto.';
  }
  if (!EMAIL_PATTERN.test(settings.contact.email.trim())) return 'Escribe un email de contacto válido.';
  if (!settings.home.coverImageUrl || !settings.home.polaroidImageUrl) return 'La portada necesita sus dos fotos.';
  if (DESTINATION_IDS.some((id) => !settings.home.destinations[id].imageUrl)) {
    return 'Cada uno de los tres accesos necesita una foto.';
  }
  if (settings.subscriptions.plans.some((plan) => !plan.name.trim())) return 'Cada plan necesita un nombre.';
  if (settings.subscriptions.faq.some((item) => !item.question.trim())) return 'Cada pregunta frecuente necesita texto.';
  return null;
}
