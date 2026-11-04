import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { fetchThread, sendMessage } from '@/lib/api';
import type { ConversationTarget, SwapMessage } from '@/lib/types';

const POLL_INTERVAL_MS = 5000;

type MessageThreadProps = {
  target: ConversationTarget;
  meId: string;
  onClose: () => void;
};

export default function MessageThread({ target, meId, onClose }: MessageThreadProps) {
  const [messages, setMessages] = useState<SwapMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchThread(target.listingId, meId, target.otherId)
        .then((data) => {
          if (cancelled) return;
          setMessages(data);
          setLoadError(null);
        })
        .catch((err: Error) => !cancelled && setLoadError(err.message))
        .finally(() => !cancelled && setLoading(false));
    load();
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [target.listingId, target.otherId, meId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);
    try {
      const sent = await sendMessage({
        listing_id: target.listingId,
        sender_id: meId,
        recipient_id: target.otherId,
        body,
      });
      setMessages((prev) => [...prev, sent]);
      setDraft('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal title={`Sobre: ${target.listingTitle}`} onClose={onClose}>
      <div className="flex max-h-[50vh] min-h-48 flex-col gap-3 overflow-y-auto border-2 border-ink-900 bg-paper-100 p-4">
        {loading && <p className="font-hand text-lg text-ink-600">Cargando mensajes...</p>}
        {loadError && <p role="alert" className="font-bold text-pink-700">{loadError}</p>}
        {!loading && !loadError && messages.length === 0 && (
          <p className="font-hand text-lg text-ink-600">Todavía no hay mensajes. Empieza la conversación.</p>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === meId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words border-2 border-ink-900 px-3 py-2 text-base text-ink-900 ${mine ? 'bg-yellow-300' : 'bg-white'}`}
              >
                <p>{message.body}</p>
                <p className="mt-1 text-xs text-ink-600">
                  {new Date(message.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 space-y-3">
        <label className="block">
          <span className="field-label">Tu mensaje</span>
          <textarea
            className="field min-h-20"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Pregunta por la talla, propón un cambio, acuerda la entrega..."
          />
        </label>
        {sendError && <p role="alert" className="text-sm font-bold text-pink-700">{sendError}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="scrap-button bg-yellow-500 px-5 py-2.5 text-base text-ink-900 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
