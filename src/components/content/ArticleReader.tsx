import Modal from '@/components/ui/Modal';
import type { ContentItem } from '@/lib/types';

type ArticleReaderProps = {
  article: ContentItem;
  onClose: () => void;
};

export default function ArticleReader({ article, onClose }: ArticleReaderProps) {
  const paragraphs = (article.body ?? '').split(/\n\n+/).filter(Boolean);

  return (
    <Modal title={article.category ?? 'Artículo'} onClose={onClose} maxWidthClass="max-w-3xl">
      <article>
        <img src={article.image_url ?? ''} alt="" className="aspect-[16/9] w-full border-2 border-ink-900 object-cover" />
        <h2 className="mt-6 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">{article.title}</h2>
        {article.subtitle && <p className="mt-3 font-hand text-2xl text-pink-700">{article.subtitle}</p>}
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-600">{article.duration_label} de lectura</p>
        <div className="mt-6 space-y-5 text-lg leading-[1.5] text-ink-800">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className={index === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-pink-500' : ''}>
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </Modal>
  );
}
