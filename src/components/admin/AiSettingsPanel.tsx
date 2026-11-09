import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import EditorSection from '@/components/admin/site/EditorSection';
import {
  AI_MODELS,
  MAX_AI_INSTRUCTIONS_LENGTH,
  fetchAiSettings,
  saveAiSettings,
  type AiModel,
  type AiSettings,
} from '@/lib/aiSettings';

type AiSettingsPanelProps = {
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function AiSettingsPanel({ onNotify }: AiSettingsPanelProps) {
  const [saved, setSaved] = useState<AiSettings | null>(null);
  const [draft, setDraft] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAiSettings()
      .then((settings) => {
        if (cancelled) return;
        if (!settings) {
          setLoadError('Todavía no hay configuración del recomendador.');
          return;
        }
        setSaved(settings);
        setDraft(settings);
      })
      .catch((err: Error) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ink-900" />
      </div>
    );
  }

  if (!saved || !draft) {
    return (
      <p role="alert" className="border-2 border-ink-900 bg-pink-100 p-4 font-bold text-pink-900">
        {loadError ?? 'No se pudo cargar el recomendador.'}
      </p>
    );
  }

  const dirty = draft.model !== saved.model || draft.instructions !== saved.instructions;

  async function handleSave() {
    if (!draft) return;
    const cleaned: AiSettings = { model: draft.model, instructions: draft.instructions.trim() };
    if (!cleaned.instructions) return setFormError('Escribe las instrucciones del estilista.');
    if (cleaned.instructions.length > MAX_AI_INSTRUCTIONS_LENGTH) {
      return setFormError(`Las instrucciones no pueden superar ${MAX_AI_INSTRUCTIONS_LENGTH} caracteres.`);
    }
    setFormError(null);
    setSaving(true);
    try {
      await saveAiSettings(cleaned);
      setSaved(cleaned);
      setDraft(cleaned);
      onNotify('Recomendador actualizado', 'success');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No se pudo guardar el recomendador', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <EditorSection title="Recomendador de moda">
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="font-display text-lg uppercase tracking-wide text-ink-900">Modelo de IA</span>
            <select
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value as AiModel })}
              className="w-full border-2 border-ink-900 bg-white p-3 text-ink-900 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            >
              {AI_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="font-display text-lg uppercase tracking-wide text-ink-900">Instrucciones del estilista</span>
            <textarea
              value={draft.instructions}
              onChange={(event) => setDraft({ ...draft, instructions: event.target.value.slice(0, MAX_AI_INSTRUCTIONS_LENGTH) })}
              rows={8}
              className="w-full resize-y border-2 border-ink-900 bg-white p-3 text-ink-900 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            />
            <span className="block text-right text-xs text-ink-600">
              {draft.instructions.length} / {MAX_AI_INSTRUCTIONS_LENGTH}
            </span>
          </label>
        </div>
      </EditorSection>

      <div className="sticky bottom-4 flex flex-col items-end gap-2 sm:flex-row sm:justify-end sm:gap-4">
        {formError && (
          <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-3 py-2 text-sm font-bold text-pink-900">
            {formError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="scrap-button bg-yellow-500 px-6 py-3 text-lg text-ink-900 hover:bg-yellow-300 disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Guardando...' : 'Guardar recomendador'}
        </button>
      </div>
    </div>
  );
}
