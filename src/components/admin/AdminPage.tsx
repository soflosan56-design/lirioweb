import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import AdminEntityPanel from '@/components/admin/AdminEntityPanel';
import AdminProfilesPanel from '@/components/admin/AdminProfilesPanel';
import AiSettingsPanel from '@/components/admin/AiSettingsPanel';
import SiteSettingsEditor from '@/components/admin/site/SiteSettingsEditor';
import { fetchBrands } from '@/lib/api';
import { getEntities } from '@/lib/adminEntities';
import type { Brand, SiteSettings } from '@/lib/types';

const SITE_TAB_KEY = 'site';
const PROFILES_TAB_KEY = 'profiles';
const AI_TAB_KEY = 'ai';

type AdminPageProps = {
  ownerId: string;
  settings: SiteSettings;
  onSettingsSaved: (settings: SiteSettings) => void;
  onNotify: (message: string, tone: 'success' | 'error') => void;
};

export default function AdminPage({ ownerId, settings, onSettingsSaved, onNotify }: AdminPageProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeKey, setActiveKey] = useState('brands');

  useEffect(() => {
    let cancelled = false;
    fetchBrands()
      .then((data) => {
        if (!cancelled) setBrands(data);
      })
      .catch((err: Error) => onNotify(err.message, 'error'));
    return () => {
      cancelled = true;
    };
  }, [onNotify]);

  const entities = useMemo(
    () => getEntities(brands.map((brand) => ({ value: brand.id, label: brand.name }))),
    [brands]
  );
  const tabs = [
    ...entities.map((entity) => ({ key: entity.key, tabLabel: entity.tabLabel })),
    { key: SITE_TAB_KEY, tabLabel: 'Estética y textos' },
    { key: PROFILES_TAB_KEY, tabLabel: 'Perfiles' },
    { key: AI_TAB_KEY, tabLabel: 'Recomendador IA' },
  ];
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];
  const activeEntity = entities.find((entity) => entity.key === active.key);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 border-b-4 border-ink-900 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-hand text-lg text-pink-700">
            <ShieldCheck className="h-5 w-5" />
            Zona privada
          </p>
          <h1 className="font-display text-5xl uppercase leading-[1.1] tracking-wide text-ink-900">
            Panel de administración
          </h1>
        </div>
        <p className="max-w-sm text-sm text-ink-700">
          Los cambios se publican al instante en la web. Solo tú puedes ver y modificar esta sección.
        </p>
      </header>

      <div role="tablist" aria-label="Secciones del panel" className="grid grid-cols-1 border-2 border-ink-900 sm:auto-cols-fr sm:grid-flow-col">
        {tabs.map((tab) => {
          const selected = tab.key === active.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveKey(tab.key)}
              className={`px-4 py-3 font-display text-lg uppercase tracking-wide transition-colors ${
                selected ? 'bg-pink-500 text-ink-900' : 'bg-paper-50 text-ink-700 hover:bg-yellow-100'
              }`}
            >
              {tab.tabLabel}
            </button>
          );
        })}
      </div>

      {activeEntity ? (
        <AdminEntityPanel key={activeEntity.key} entity={activeEntity} ownerId={ownerId} onNotify={onNotify} />
      ) : active.key === PROFILES_TAB_KEY ? (
        <AdminProfilesPanel ownerId={ownerId} onNotify={onNotify} />
      ) : active.key === AI_TAB_KEY ? (
        <AiSettingsPanel onNotify={onNotify} />
      ) : (
        <SiteSettingsEditor
          ownerId={ownerId}
          settings={settings}
          onSaved={onSettingsSaved}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
