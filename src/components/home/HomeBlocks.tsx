import { ArrowUpRight } from 'lucide-react';
import { isSafeUrl } from '@/lib/siteSettings';
import type { HomeBlock } from '@/lib/types';

type HomeBlocksProps = {
  blocks: HomeBlock[];
};

export default function HomeBlocks({ blocks }: HomeBlocksProps) {
  if (blocks.length === 0) return null;
  return (
    <section className="mx-auto mt-16 grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2">
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </section>
  );
}

function Block({ block }: { block: HomeBlock }) {
  switch (block.type) {
    case 'title':
      return (
        <div className="border-b-4 border-ink-900 pb-3 md:col-span-2">
          <h2 className="font-display text-4xl uppercase leading-[1.1] tracking-wide text-ink-900 sm:text-5xl">{block.title}</h2>
          {block.subtitle && <p className="mt-2 font-hand text-lg text-pink-700">{block.subtitle}</p>}
        </div>
      );
    case 'text':
      return <p className="whitespace-pre-line text-lg leading-relaxed text-ink-800 md:col-span-2">{block.body}</p>;
    case 'photo':
      return (
        <figure className="relative -rotate-1 border-2 border-ink-900 bg-paper-50 p-3 shadow-hard">
          <img src={block.imageUrl} alt={block.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          {block.caption && <figcaption className="mt-2 font-hand text-lg text-ink-900">{block.caption}</figcaption>}
          {block.linkUrl && isSafeUrl(block.linkUrl) && (
            <a
              href={block.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-display text-sm uppercase text-pink-700 underline decoration-2 underline-offset-4"
            >
              Ver más <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </figure>
      );
    case 'link':
      return isSafeUrl(block.url) ? (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="scrap-button justify-self-start bg-yellow-300 px-6 py-3 text-xl text-ink-900 hover:bg-yellow-500 md:col-span-2"
        >
          {block.label} <ArrowUpRight className="h-5 w-5" />
        </a>
      ) : null;
  }
}
