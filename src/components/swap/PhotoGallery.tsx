import { useState } from 'react';

type PhotoGalleryProps = {
  urls: string[];
  alt: string;
  aspectClass?: string;
};

export default function PhotoGallery({ urls, alt, aspectClass = 'aspect-[4/5]' }: PhotoGalleryProps) {
  const [index, setIndex] = useState(0);

  if (urls.length === 0) {
    return (
      <div className={`flex ${aspectClass} w-full items-center justify-center border-2 border-dashed border-ink-900 bg-paper-100 font-hand text-lg text-ink-600`}>
        Sin fotos
      </div>
    );
  }

  const current = urls[Math.min(index, urls.length - 1)];

  return (
    <div className="space-y-2">
      <img src={current} alt={alt} className={`${aspectClass} w-full border-2 border-ink-900 object-cover`} />
      {urls.length > 1 && (
        <div className="flex gap-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === index}
              className={`h-16 w-16 overflow-hidden border-2 border-ink-900 transition-transform hover:-translate-y-0.5 ${i === index ? 'shadow-hard-sm' : 'opacity-70'}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
