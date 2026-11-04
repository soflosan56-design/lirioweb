import { useEffect, useState } from 'react';
import { fetchIsAdmin } from '@/lib/adminApi';

export function useIsAdmin(userId: string | null): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(false);
    if (!userId) return;
    let cancelled = false;
    fetchIsAdmin(userId)
      .then((value) => {
        if (!cancelled) setIsAdmin(value);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return isAdmin;
}
