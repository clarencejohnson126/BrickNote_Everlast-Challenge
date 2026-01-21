'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    // In development, always use localhost (deep link only works in packaged app)
    // In production Electron, use deep link protocol
    // In production web, use current origin
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    const redirectTo = isDev
      ? 'http://localhost:3007'
      : isElectron
        ? 'bricknote://auth/callback'
        : window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signOut };
}
