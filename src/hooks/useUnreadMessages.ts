import { useEffect, useState } from 'react';
import { fetchInboxMessages, type InboxMessage } from '@/lib/api';

const POLL_INTERVAL_MS = 5000;
const LAST_SEEN_KEY = 'lirio:inbox:last-seen';

function lastSeenAt(): number {
  return Number(localStorage.getItem(LAST_SEEN_KEY) ?? '0');
}

export function markInboxSeen(): void {
  localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
}

export function useUnreadMessages(userId: string | null): number {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = () =>
      fetchInboxMessages()
        .then((messages: InboxMessage[]) => {
          if (cancelled) return;
          const seen = lastSeenAt();
          setUnread(
            messages.filter((m) => m.recipient_id === userId && new Date(m.created_at).getTime() > seen).length
          );
        })
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [userId]);

  return unread;
}
