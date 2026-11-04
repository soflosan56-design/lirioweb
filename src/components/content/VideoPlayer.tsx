import { Play } from 'lucide-react';
import type { ContentItem } from '@/lib/types';

type VideoPlayerProps = {
  episode: ContentItem;
};

export default function VideoPlayer({ episode }: VideoPlayerProps) {
  return (
    <div className="relative">
      <div className="absolute -left-3 -top-4 z-10 rotate-[-4deg] bg-yellow-400 px-3 py-1 font-hand text-lg text-ink-900 shadow-hard-sm">
        Episodio {String(episode.episode_number ?? 0).padStart(2, '0')}
      </div>
      <div className="border-4 border-ink-900 bg-ink-900 p-2 shadow-hard-pink">
        {episode.video_url ? (
          <video
            key={episode.id}
            controls
            preload="metadata"
            poster={episode.image_url ?? undefined}
            className="aspect-video w-full bg-ink-900"
          >
            <source src={episode.video_url} type="video/mp4" />
          </video>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-ink-800 text-paper-50">
            <Play className="h-12 w-12 text-neon-500" />
          </div>
        )}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-pink-700">Contenido destacado</p>
          <h2 className="font-display text-4xl uppercase leading-[0.95] sm:text-6xl">{episode.title}</h2>
          {episode.subtitle && <p className="mt-2 text-lg text-ink-800">{episode.subtitle}</p>}
        </div>
        {episode.duration_label && (
          <span className="self-start border-2 border-ink-900 bg-neon-500 px-3 py-1 font-display text-lg uppercase md:self-end">
            {episode.duration_label}
          </span>
        )}
      </div>
    </div>
  );
}
