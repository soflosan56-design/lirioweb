import { useEffect, useState } from 'react';
import { DEFAULT_SITE_SETTINGS, fetchSiteSettings } from '@/lib/siteSettings';
import { applyTheme } from '@/lib/theme';
import type { SiteSettings } from '@/lib/types';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetchSiteSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch((err: unknown) => console.error('No se cargaron los ajustes del sitio', err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  return { settings, setSettings };
}
