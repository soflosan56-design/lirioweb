import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { sendFashionChatMessage, type FashionChatMessage } from '@/lib/fashionChat';

const MAX_MESSAGE_LENGTH = 800;

type FashionChatWidgetProps = {
  signedIn: boolean;
  onRequireLogin: () => void;
};

const GREETING: FashionChatMessage = {
  role: 'assistant',
  content: 'Hola, soy el asistente de LIRIO. Pregúntame sobre moda, cómo combinar una prenda o cómo funciona el Swap.',
};

const SUGGESTED_PROMPTS = [
  '¿Cuáles son las tendencias de moda sostenible de esta temporada?',
  '¿Qué novedades hay ahora mismo en la industria de la moda?',
  '¿Cómo se combina una chaqueta de cuero en un look de día?',
  '¿Qué marcas de moda de segunda mano están creciendo últimamente?',
];

export default function FashionChatWidget({ signedIn, onRequireLogin }: FashionChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<FashionChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending, open]);

  function toggle() {
    if (!signedIn) {
      onRequireLogin();
      return;
    }
    setOpen((value) => !value);
  }

  async function sendMessage(content: string) {
    if (!content || pending) return;

    const next: FashionChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setDraft('');
    setError(null);
    setPending(true);
    try {
      const reply = await sendFashionChatMessage(next.filter((message) => message !== GREETING));
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'El chat no pudo responder. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft.trim());
  }

  const showSuggestions = messages.length === 1 && !pending;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Asistente de moda"
          className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col border-4 border-ink-900 bg-paper-50 shadow-[8px_8px_0_0_#FF2E93]"
        >
          <header className="flex items-center justify-between gap-3 border-b-4 border-ink-900 bg-neon-500 px-4 py-3">
            <h2 className="font-display text-xl uppercase tracking-wide text-ink-900">Asistente LIRIO</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="flex h-9 w-9 items-center justify-center border-2 border-ink-900 bg-paper-50 transition-transform hover:rotate-90"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap border-2 border-ink-900 px-3 py-2 text-sm leading-relaxed text-ink-900 ${
                    message.role === 'user' ? 'bg-pink-200' : 'bg-white'
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {showSuggestions && (
              <div className="space-y-2 pt-1">
                <p className="font-hand text-base text-pink-700">Prueba con una pregunta:</p>
                <div className="flex flex-col items-start gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="border-2 border-ink-900 bg-white px-3 py-1.5 text-left text-sm text-ink-900 transition-colors hover:bg-neon-300 focus:outline-none focus:ring-4 focus:ring-yellow-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pending && (
              <div className="flex justify-start">
                <p className="flex items-center gap-2 border-2 border-ink-900 bg-white px-3 py-2 text-sm text-ink-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Escribiendo...
                </p>
              </div>
            )}
            {error && (
              <p role="alert" className="border-2 border-ink-900 bg-pink-100 px-3 py-2 text-sm font-bold text-pink-900">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t-4 border-ink-900 bg-white p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder="Escribe tu pregunta..."
              aria-label="Escribe tu pregunta"
              className="min-w-0 flex-1 border-2 border-ink-900 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            />
            <button
              type="submit"
              disabled={pending || draft.trim() === ''}
              aria-label="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink-900 bg-pink-500 text-ink-900 transition-colors hover:bg-pink-300 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente de moda'}
        aria-expanded={open}
        className="scrap-button bg-neon-500 px-4 py-3 text-base text-ink-900 transition-transform hover:-translate-y-0.5"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {open ? 'Cerrar' : 'Pregunta a LIRIO'}
      </button>
    </div>
  );
}
