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

    // Check if URL has auth tokens (from magic link redirect in browser)
    const hashParams = typeof window !== 'undefined' ? window.location.hash : '';
    const hasAuthTokens = hashParams.includes('access_token=');

    if (hasAuthTokens) {
      console.log('[Auth] Detected auth tokens in URL hash, processing...');
      // Clear the hash after a short delay to clean up the URL
      setTimeout(() => {
        if (window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 1000);
    }

    // Listen for auth tokens from Electron (via IPC from deep link)
    const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
    let cleanupTokenListener: (() => void) | undefined;

    if (electronAPI?.onAuthTokens) {
      console.log('[Auth] Setting up Electron auth token listener');
      cleanupTokenListener = electronAPI.onAuthTokens(async (tokens) => {
        console.log('[Auth] Received auth tokens from Electron IPC');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (error) {
            console.error('[Auth] Failed to set session:', error);
          } else {
            console.log('[Auth] Session set successfully:', data.user?.email);
          }
        } catch (err) {
          console.error('[Auth] Error setting session:', err);
        }
      });
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', session ? 'found' : 'none');
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event, session ? 'has session' : 'no session');
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
      if (cleanupTokenListener) {
        cleanupTokenListener();
      }
    };
  }, []);

  const signIn = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    // Check if we're running in Electron (check at call time, not module load)
    const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

    // Determine redirect URL based on environment:
    // - Electron (dev or prod): Use deep link protocol - Electron handles it and loads the correct URL
    // - Browser/Web: Use the appropriate web URL
    let redirectTo: string;
    if (isElectron) {
      // Electron (both dev and production): Use deep link protocol
      // The Electron app's handleDeepLink function will:
      // - In dev: load http://localhost:3007 with auth tokens
      // - In prod: load the static file with auth tokens
      redirectTo = 'bricknote://auth/callback';
    } else if (window.location.hostname === 'localhost') {
      // Browser development mode: localhost
      redirectTo = 'http://localhost:3007';
    } else {
      // Production web: redirect back to current origin
      redirectTo = window.location.origin;
    }

    console.log('[Auth] signIn redirect:', { isElectron, redirectTo });

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
