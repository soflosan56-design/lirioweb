import HomeBlockFields from '@/components/admin/site/HomeBlockFields';
import ImageUploader from '@/components/ui/ImageUploader';
import { DESTINATION_IDS } from '@/lib/siteSettings';
import type { DestinationId, SiteSettings } from '@/lib/types';

type Home = SiteSettings['home'];

const DESTINATION_LABELS: Record<DestinationId, string> = {
  swap: 'Swap',
  showroom: 'Showroom',
  contenidos: 'Contenidos',
};

type HomeFieldsProps = {
  ownerId: string;
  value: Home;
  onChange: (home: Home) => void;
};

export default function HomeFields({ ownerId, value, onChange }: HomeFieldsProps) {
  return (
    <div className="space-y-8">
      <label className="block">
        <span className="field-label">Texto de bienvenida</span>
        <textarea
          className="field min-h-24"
          value={value.intro}
          maxLength={300}
          onChange={(e) => onChange({ ...value, intro: e.target.value })}
        />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <PhotoField
          label="Foto de portada"
          ownerId={ownerId}
          url={value.coverImageUrl}
          onChange={(url) => onChange({ ...value, coverImageUrl: url })}
        />
        <PhotoField
          label="Foto de la tarjeta pequeña"
          ownerId={ownerId}
          url={value.polaroidImageUrl}
          onChange={(url) => onChange({ ...value, polaroidImageUrl: url })}
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-display text-xl uppercase text-ink-900">Los tres accesos</h4>
        {DESTINATION_IDS.map((id) => {
          const destination = value.destinations[id];
          return (
            <div key={id} className="grid gap-5 border-2 border-ink-900 bg-white p-4 sm:grid-cols-[160px_1fr]">
              <PhotoField
                label={DESTINATION_LABELS[id]}
                ownerId={ownerId}
                url={destination.imageUrl}
                onChange={(url) =>
                  onChange({
                    ...value,
                    destinations: { ...value.destinations, [id]: { ...destination, imageUrl: url } },
                  })
                }
              />
              <label className="block">
                <span className="field-label">Descripción</span>
                <textarea
                  className="field min-h-24"
                  value={destination.blurb}
                  maxLength={160}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      destinations: { ...value.destinations, [id]: { ...destination, blurb: e.target.value } },
                    })
                  }
                />
              </label>
            </div>
          );
        })}
      </div>

      <HomeBlockFields ownerId={ownerId} value={value.blocks} onChange={(blocks) => onChange({ ...value, blocks })} />
    </div>
  );
}

type PhotoFieldProps = {
  label: string;
  ownerId: string;
  url: string;
  onChange: (url: string) => void;
};

function PhotoField({ label, ownerId, url, onChange }: PhotoFieldProps) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <ImageUploader ownerId={ownerId} urls={url ? [url] : []} max={1} onChange={(urls) => onChange(urls[0] ?? '')} />
    </div>
  );
}
