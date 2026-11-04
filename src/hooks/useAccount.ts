import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { ensureProfile, updateProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Profile, ProfileEdits } from '@/lib/types';

export function useAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (next: Session | null) => {
      if (cancelled) return;
      setSession(next);
      if (!next) {
        setProfile(null);
        return;
      }
      try {
        const data = await ensureProfile(next.user.id);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar tu perfil');
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      (async () => {
        await applySession(data.session);
        if (!cancelled) setLoading(false);
      })();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      (async () => {
        await applySession(next);
      })();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(translateAuthError(signInError.message));
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (signUpError) throw new Error(translateAuthError(signUpError.message));
    if (!data.session) throw new Error('Tu cuenta se creó, pero necesitamos confirmarla antes de entrar.');
  }, []);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw new Error(signOutError.message);
  }, []);

  const saveProfile = useCallback(
    async (fields: ProfileEdits) => {
      if (!profile) throw new Error('Tu perfil todavía se está preparando');
      const updated = await updateProfile(profile.id, fields);
      setProfile(updated);
      return updated;
    },
    [profile]
  );

  const user: User | null = session?.user ?? null;

  return { user, profile, loading, error, signIn, signUp, signOut, saveProfile };
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (message.includes('already registered')) return 'Ya existe una cuenta con ese email.';
  if (message.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  return message;
}
