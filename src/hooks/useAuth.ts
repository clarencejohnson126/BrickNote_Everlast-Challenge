'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

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

    // Check if we're running in Electron (check at call time, not module load)
    const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

    // In development, always use localhost (deep link only works in packaged app)
    // In production Electron, use deep link protocol
    // In production web, use current origin
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    let redirectTo: string;
    if (isDev) {
      // Development mode: localhost (same window will receive the redirect)
      redirectTo = 'http://localhost:3007';
    } else if (isElectron) {
      // Production Electron: deep link will open the Electron app
      redirectTo = 'bricknote://auth/callback';
    } else {
      // Production web: redirect back to current origin
      redirectTo = window.location.origin;
    }

    console.log('[Auth] signIn redirect:', { isDev, isElectron, redirectTo });

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
