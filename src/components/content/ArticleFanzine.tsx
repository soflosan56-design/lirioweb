import type { ContentItem } from '@/lib/types';

type ArticleFanzineProps = {
  articles: ContentItem[];
  onOpen: (article: ContentItem) => void;
};

export default function ArticleFanzine({ articles, onOpen }: ArticleFanzineProps) {
  const [lead, ...rest] = articles;
  if (!lead) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <button
        type="button"
        onClick={() => onOpen(lead)}
        className="group relative text-left lg:col-span-7"
      >
        <div className="torn-edges relative bg-ink-900 p-2 shadow-hard">
          <img src={lead.image_url ?? ''} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
        <span className="tape -top-3 left-10 -rotate-6" />
        <span className="sticker-label absolute -right-2 top-6 rotate-6 bg-pink-500 text-ink-900">{lead.category}</span>
        <h2 className="mt-6 font-display text-5xl uppercase leading-[0.9] transition-colors group-hover:text-pink-700 sm:text-7xl">
          {lead.title}
        </h2>
        {lead.subtitle && <p className="mt-3 font-hand text-2xl text-pink-700">{lead.subtitle}</p>}
        {lead.excerpt && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-800">{lead.excerpt}</p>}
      </button>

      <div className="flex flex-col gap-8 lg:col-span-5">
        {rest.map((article, index) => (
          <button
            key={article.id}
            type="button"
            onClick={() => onOpen(article)}
            className={`group relative flex gap-4 bg-paper-50 p-4 text-left border-2 border-ink-900 shadow-hard transition-all duration-200 hover:-translate-y-1 hover:shadow-hard-neon ${index % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
          >
            <img src={article.image_url ?? ''} alt="" loading="lazy" className="h-32 w-28 shrink-0 border-2 border-ink-900 object-cover grayscale transition-all duration-300 group-hover:grayscale-0" />
            <div className="min-w-0">
              <p className="font-display text-xs uppercase tracking-wider text-pink-700">
                {article.category} · {article.duration_label}
              </p>
              <h3 className="mt-1 font-display text-2xl uppercase leading-tight">{article.title}</h3>
              {article.excerpt && <p className="mt-2 line-clamp-2 text-sm text-ink-600">{article.excerpt}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
