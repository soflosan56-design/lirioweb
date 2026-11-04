import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { fetchDisplayNames, fetchInboxMessages, type InboxMessage } from '@/lib/api';
import type { ConversationTarget } from '@/lib/types';

const POLL_INTERVAL_MS = 5000;

type Conversation = ConversationTarget & {
  key: string;
  lastMessage: InboxMessage;
};

type InboxModalProps = {
  meId: string;
  onClose: () => void;
  onOpen: (target: ConversationTarget) => void;
};

function groupConversations(messages: InboxMessage[], meId: string): Conversation[] {
  const byKey = new Map<string, Conversation>();
  for (const message of messages) {
    if (!message.listing) continue;
    const otherId = message.sender_id === meId ? message.recipient_id : message.sender_id;
    const key = `${message.listing_id}|${otherId}`;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      key,
      listingId: message.listing_id,
      listingTitle: message.listing.title,
      otherId,
      lastMessage: message,
    });
  }
  return [...byKey.values()];
}

export default function InboxModal({ meId, onClose, onOpen }: InboxModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchInboxMessages()
        .then(async (messages) => {
          const grouped = groupConversations(messages, meId);
          const ids = [...new Set(grouped.map((c) => c.otherId))];
          const displayNames = await fetchDisplayNames(ids);
          if (cancelled) return;
          setConversations(grouped);
          setNames(displayNames);
          setError(null);
        })
        .catch((err: Error) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false));
    load();
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [meId]);

  return (
    <Modal title="Mensajes" onClose={onClose}>
      {loading && <p className="font-hand text-lg text-ink-600">Cargando mensajes...</p>}
      {error && <p role="alert" className="font-bold text-pink-700">{error}</p>}
      {!loading && !error && conversations.length === 0 && (
        <p className="font-hand text-xl text-ink-600">Aún no tienes conversaciones. Escribe al dueño de una prenda para empezar.</p>
      )}
      <ul className="space-y-3">
        {conversations.map((conversation) => (
          <li key={conversation.key}>
            <button
              type="button"
              onClick={() => onOpen({ listingId: conversation.listingId, listingTitle: conversation.listingTitle, otherId: conversation.otherId })}
              className="block w-full border-2 border-ink-900 bg-white p-4 text-left shadow-hard-sm transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg uppercase">{names[conversation.otherId] ?? 'Miembro'}</p>
                <p className="text-xs text-ink-600">
                  {new Date(conversation.lastMessage.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="text-sm font-bold text-pink-700">{conversation.listingTitle}</p>
              <p className="mt-1 truncate text-sm text-ink-800">{conversation.lastMessage.body}</p>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
