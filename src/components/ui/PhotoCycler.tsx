import { useEffect, useState } from 'react';

type PhotoCyclerProps = {
  urls: string[];
  alt: string;
  className: string;
  imgClassName?: string;
};

const CYCLE_MS = 1100;

export default function PhotoCycler({ urls, alt, className, imgClassName = '' }: PhotoCyclerProps) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const count = urls.length;

  useEffect(() => {
    if (!hovered || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [hovered, count]);

  if (count === 0) {
    return <span className={`block bg-paper-100 ${className}`} aria-hidden="true" />;
  }

  const current = index % count;

  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setIndex(0);
      }}
    >
      <img src={urls[current]} alt={alt} loading="lazy" className={`h-full w-full object-cover ${imgClassName}`} />
      {count > 1 && (
        <>
          <span className="absolute right-2 top-2 bg-ink-900 px-2 py-0.5 font-display text-xs tracking-wider text-paper-50">
            {current + 1}/{count}
          </span>
          <span className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {urls.map((url, i) => (
              <span
                key={url}
                className={`h-1.5 w-1.5 border border-ink-900 transition-colors ${i === current ? 'bg-neon-500' : 'bg-paper-50/80'}`}
              />
            ))}
          </span>
        </>
      )}
    </span>
  );
}
