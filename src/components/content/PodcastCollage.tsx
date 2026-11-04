import { Play } from 'lucide-react';
import type { ContentItem } from '@/lib/types';

const TILT = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1'];

type PodcastCollageProps = {
  episodes: ContentItem[];
  activeId: string | null;
  onSelect: (episode: ContentItem) => void;
};

export default function PodcastCollage({ episodes, activeId, onSelect }: PodcastCollageProps) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
      {episodes.map((episode, index) => {
        const active = episode.id === activeId;
        return (
          <button
            key={episode.id}
            type="button"
            onClick={() => onSelect(episode)}
            aria-pressed={active}
            className={`group relative bg-paper-50 p-2 pb-4 text-left border-2 border-ink-900 transition-all duration-200 hover:-translate-y-1 hover:rotate-0 ${
              active ? 'shadow-hard-neon bg-neon-100' : 'shadow-hard'
            } ${TILT[index % TILT.length]}`}
          >
            <span className="tape -top-3 left-4 w-16 rotate-3" />
            <div className="relative overflow-hidden border-2 border-ink-900">
              <img src={episode.image_url ?? ''} alt="" loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 flex items-center justify-center bg-ink-900/0 transition-colors group-hover:bg-ink-900/30">
                <span className="flex h-12 w-12 items-center justify-center border-2 border-ink-900 bg-neon-500 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="h-5 w-5 fill-ink-900" />
                </span>
              </span>
              {episode.duration_label && (
                <span className="absolute bottom-1 right-1 bg-ink-900 px-1.5 py-0.5 font-display text-xs text-paper-50">{episode.duration_label}</span>
              )}
            </div>
            <p className="mt-3 font-hand text-sm text-pink-700">#{String(episode.episode_number ?? 0).padStart(2, '0')}</p>
            <p className="font-display text-xl uppercase leading-tight">{episode.title}</p>
          </button>
        );
      })}
    </div>
  );
}
