import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Single lazy-initialized client to avoid "Multiple GoTrueClient instances" warning
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.warn(
        'Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    return null;
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Detect session from URL hash (for magic link redirects)
        detectSessionInUrl: true,
        // Persist session in localStorage
        persistSession: true,
        // Auto-refresh tokens
        autoRefreshToken: true,
      },
    });
  }

  return _supabase;
}

// For backwards compatibility - use the singleton getter
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;
