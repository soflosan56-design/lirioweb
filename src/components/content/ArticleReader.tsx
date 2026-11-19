import { useCallback, useEffect, useState } from 'react';
import { FileDown, Loader2, Send, Trash2 } from 'lucide-react';
import type { ArticleBlock, ContentComment, ContentItem } from '@/lib/types';
import { createComment, deleteComment, fetchComments } from '@/lib/api';
import { useAccount } from '@/hooks/useAccount';

type ArticleReaderProps = {
  article: ContentItem;
  onClose: () => void;
};

const MAX_COMMENT_LENGTH = 2000;

function isBlockList(value: unknown): value is ArticleBlock[] {
  return (
    Array.isArray(value) &&
    value.every(
      (block) =>
        typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        ((block as { type: unknown }).type === 'subtitle' ||
          (block as { type: unknown }).type === 'paragraph' ||
          (block as { type: unknown }).type === 'image')
    )
  );
}

function CommentSection({ article }: { article: ContentItem }) {
  const { user } = useAccount();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    fetchComments(article.id)
      .then(setComments)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [article.id]);

  useEffect(() => load(), [load]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await createComment(article.id, body);
      setComments((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el comentario.');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar el comentario.');
    }
  }

  return (
    <section aria-label="Comentarios" className="mt-14 border-t-4 border-ink-900 pt-8">
      <h3 className="font-display text-3xl uppercase">
        Comentarios <span className="text-pink-500">({comments.length})</span>
      </h3>

      {user ? (
        <form onSubmit={handleSend} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
          <textarea
            className="field min-h-[5.5rem] flex-1"
            placeholder="Escribe un comentario..."
            value={draft}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            disabled={sending || draft.trim() === ''}
            className="scrap-button flex items-center justify-center gap-2 bg-pink-500 px-5 py-3 text-base text-ink-900 hover:bg-pink-300 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publicar
          </button>
        </form>
      ) : (
        <p className="mt-5 border-2 border-dashed border-ink-900 bg-paper-50 p-4 font-hand text-lg text-ink-700">
          Inicia sesión para participar en los comentarios.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 border-2 border-ink-900 bg-pink-100 p-3 text-sm font-bold text-pink-900">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-ink-900" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-6 font-hand text-xl text-ink-600">Todavía no hay comentarios. ¡Estrena el primero!</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 border-2 border-ink-900 bg-paper-50 p-4 shadow-hard-sm">
              {comment.author?.avatar_url ? (
                <img
                  src={comment.author.avatar_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full border-2 border-ink-900 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink-900 bg-yellow-200 font-display text-base text-ink-900">
                  {(comment.author?.display_name ?? '?').slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm uppercase tracking-wide text-ink-900">
                  {comment.author?.display_name ?? 'Lector'}{' '}
                  <span className="font-body text-xs font-normal normal-case text-ink-600">
                    · {new Date(comment.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-base leading-relaxed text-ink-800">{comment.body}</p>
              </div>
              {user?.id === comment.user_id && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  aria-label="Borrar comentario"
                  className="shrink-0 self-start p-1 text-pink-700 hover:text-pink-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BlockView({ block, isFirstParagraph }: { block: ArticleBlock; isFirstParagraph: boolean }) {
  if (block.type === 'subtitle') {
    return <h3 className="pt-4 font-display text-3xl uppercase leading-tight text-ink-900">{block.text}</h3>;
  }
  if (block.type === 'image') {
    return (
      <figure className="torn-edges bg-ink-900 p-2">
        <img src={block.url} alt={block.caption || ''} className="w-full border-2 border-ink-900 object-cover" />
        {block.caption && <figcaption className="mt-2 px-2 pb-1 text-center font-hand text-lg text-paper-50">{block.caption}</figcaption>}
      </figure>
    );
  }
  return (
    <p
      className={
        isFirstParagraph
          ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-pink-500'
          : ''
      }
    >
      {block.text}
    </p>
  );
}

export default function ArticleReader({ article, onClose }: ArticleReaderProps) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const blocks = isBlockList(article.blocks) ? article.blocks : null;
  const paragraphs = (article.body ?? '').split(/\n\n+/).filter(Boolean);
  let paragraphSeen = false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper-50">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b-4 border-ink-900 bg-paper-50/95 px-4 py-3 backdrop-blur sm:px-8">
        <span className="sticker-label -rotate-2 bg-cyan-300 text-ink-900">{article.category ?? 'Artículo'}</span>
        <div className="flex items-center gap-3">
          {article.document_url && (
            <a
              href={article.document_url}
              target="_blank"
              rel="noreferrer"
              className="scrap-button flex items-center gap-2 bg-yellow-500 px-4 py-2 text-base text-ink-900 hover:bg-yellow-300"
            >
              <FileDown className="h-4 w-4" />
              Descargar documento
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="scrap-button bg-ink-900 px-4 py-2 text-base text-neon-500 hover:bg-pink-500 hover:text-ink-900"
          >
            Cerrar
          </button>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <h1 className="font-display text-5xl uppercase leading-[0.95] sm:text-7xl">{article.title}</h1>
        {article.subtitle && <p className="mt-4 font-hand text-2xl text-pink-700">{article.subtitle}</p>}
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-600">{article.duration_label} de lectura</p>
        <img
          src={article.image_url ?? ''}
          alt=""
          className="mt-8 aspect-[16/9] w-full border-2 border-ink-900 object-cover shadow-hard"
        />

        <div className="mt-10 space-y-6 text-lg leading-[1.6] text-ink-800">
          {blocks
            ? blocks.map((block, index) => {
                const isFirst = block.type === 'paragraph' && !paragraphSeen;
                if (block.type === 'paragraph') paragraphSeen = true;
                return <BlockView key={index} block={block} isFirstParagraph={isFirst} />;
              })
            : paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-pink-500'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
        </div>

        <CommentSection article={article} />
      </article>
    </div>
  );
}
